"use server"

import { createClient } from "@/lib/supabase/server"


// =====================================================
// DELETE PRODUCT
// =====================================================

export async function deleteProduct(
  id: string
) {
  const supabase = await createClient()

  // ==========================================
  // 1. HAPUS BARCODE VARIANT
  // ==========================================

  const { error: variantError } =
    await supabase
      .from("product_variants")
      .update({
        barcode: null,
        barcode_manual: false,
      })
      .eq("product_id", id)

  if (variantError) {
    throw variantError
  }

  // ==========================================
  // 2. HAPUS BARCODE PRODUCT
  // ==========================================

  const { error: productError } =
    await supabase
      .from("products")
      .update({
        barcode: null,
        barcode_manual: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)

  if (productError) {
    throw productError
  }

  return {
    success: true,
    message: "Produk berhasil dihapus",
  }
}


// =====================================================
// DUPLICATE PRODUCT
// =====================================================

export async function duplicateProduct(
  id: string
) {
  const supabase = await createClient()

  const {
    data: product,
    error,
  } = await supabase
    .from("products")
    .select(`
      *,
      images:product_images!product_images_product_id_fkey(*),
      variants: product_variants!product_id(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw error
  }

  // duplicate product
  const {
    data: newProduct,
    error: insertError,
  } = await supabase
    .from("products")
    .insert({
      outlet_id: product.outlet_id,

      name: `${product.name} (Copy)`,

      sku: product.sku,

      category_id: product.category_id ?? null,

      description: product.description,

      // IMPORTANT:
      // jangan langsung memasukkan stock
      // supaya initial stock bisa dicatat sebagai movement
      stock: 0,

      price: product.price,

      price_disc: product.price_disc,

      price_cost: product.price_cost,

      weight: product.weight,
      length: product.length,
      width: product.width,
      height: product.height,

      has_variant: product.has_variant,

      variant_count: product.variant_count,

      variant_config: product.variant_config,

      barcode: null,
      barcode_manual: true,

      status:
        product.status === "draft"
          ? "draft"
          : "inactive",
    })
    .select()
    .single()

  if (insertError) {
    throw insertError
  }

  // =====================================================
  // DUPLICATE IMAGES
  // =====================================================

  if (product.images?.length) {
    const imagePayload =
      product.images.map(
        (img: any, index: number) => ({
          product_id: newProduct.id,

          image_url: img.image_url,

          is_main: index === 0,

          sort_order: index,
        })
      )

    const { error: imageError } =
      await supabase
        .from("product_images")
        .insert(imagePayload)

    if (imageError) {
      throw imageError
    }
  }


  // =====================================================
  // DUPLICATE VARIANTS
  // =====================================================

  if (product.variants?.length) {

    const variantPayload =
      product.variants.map(
        (variant: any, index: number) => ({
          product_id: newProduct.id,

          key: variant.key,

          name: variant.name,

          option1: variant.option1,

          option2: variant.option2,

          sku: variant.sku,

          url_image: variant.url_image,

          // IMPORTANT:
          // insert dulu dengan 0
          stock: 0,

          price: variant.price,

          price_disc: variant.price_disc,

          price_cost: variant.price_cost,

          barcode: null,

          barcode_manual: true,

          status:
            variant.status ?? "active",

          sort_order:
            variant.sort_order ?? index,
        })
      )

    const {
      error: variantError,
    } = await supabase
      .from("product_variants")
      .insert(variantPayload)

    if (variantError) {
      throw variantError
    }


    // ===================================================
    // CATAT INITIAL STOCK VARIANT
    // ===================================================

    for (const variant of product.variants) {

      const quantity =
        Number(variant.stock ?? 0)

      if (quantity <= 0) continue

      const { error: stockError } =
        await supabase.rpc(
          "add_stock",
          {
            p_product_id: null,

            p_variant_id:
              (
                await supabase
                  .from("product_variants")
                  .select("id")
                  .eq(
                    "product_id",
                    newProduct.id
                  )
                  .eq(
                    "key",
                    variant.key
                  )
                  .single()
              ).data?.id,

            p_quantity: quantity,

            p_note:
              "Stok awal saat duplikasi produk",

            p_reference_type:
              "initial_stock",

            p_reference_id:
              newProduct.id,
          }
        )

      if (stockError) {
        throw stockError
      }
    }
  }


  // =====================================================
  // PRODUCT TANPA VARIANT
  // =====================================================

  if (
    !product.has_variant &&
    Number(product.stock ?? 0) > 0
  ) {

    const {
      error: stockError,
    } = await supabase.rpc(
      "add_stock",
      {
        p_product_id:
          newProduct.id,

        p_variant_id: null,

        p_quantity:
          Number(product.stock),

        p_note:
          "Stok awal saat duplikasi produk",

        p_reference_type:
          "initial_stock",

        p_reference_id:
          newProduct.id,
      }
    )

    if (stockError) {
      throw stockError
    }
  }


  return newProduct
}


// =====================================================
// UPDATE PRODUCT STATUS
// =====================================================

export async function updateProductStatus(
  id: string,
  status: "active" | "inactive" | "archived"
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("products")
    .update({
      status,
    })
    .eq("id", id)

  if (error) {
    throw error
  }

  return {
    success: true,
    message:
      status === "active"
        ? "Produk berhasil diaktifkan"
        : "Produk berhasil dinonaktifkan",
  }
}


// =====================================================
// ADJUST STOCK
// =====================================================

export async function adjustStock({
  productId,
  variantId = null,
  oldStock,
  newStock,
  note = "Penyesuaian stok dari form produk",
  referenceType = "adjustment",
  referenceId = null,
}: {
  productId: string | null
  variantId?: string | null
  oldStock: number
  newStock: number
  note?: string
  referenceType?: string
  referenceId?: string | null
}) {

  const supabase = await createClient()

  const before = Number(oldStock ?? 0)
  const after = Number(newStock ?? 0)

  // Tidak ada perubahan
  if (before === after) {
    return {
      success: true,
      changed: false,
      movement: null,
    }
  }

  const quantity = Math.abs(after - before)

  // ===================================================
  // STOK BERTAMBAH
  // ===================================================

  if (after > before) {

    const {
      data,
      error,
    } = await supabase.rpc(
      "add_stock",
      {
        p_product_id:
          variantId ? null : productId,

        p_variant_id:
          variantId,

        p_quantity:
          quantity,

        p_note:
          note,

        p_reference_type:
          referenceType,

        p_reference_id:
          referenceId,
      }
    )

    if (error) {
      throw error
    }

    return {
      success: true,
      changed: true,
      movement: data,
    }
  }


  // ===================================================
  // STOK BERKURANG
  // ===================================================

  const {
    data,
    error,
  } = await supabase.rpc(
    "remove_stock",
    {
      p_product_id:
        variantId ? null : productId,

      p_variant_id:
        variantId,

      p_quantity:
        quantity,

      p_note:
        note,

      p_reference_type:
        referenceType,

      p_reference_id:
        referenceId,
    }
  )

  if (error) {
    throw error
  }

  return {
    success: true,
    changed: true,
    movement: data,
  }
}