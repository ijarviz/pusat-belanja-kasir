import { createClient } from "@/lib/supabase/client"
import type { StockMovement } from "./types"

export async function getStockMovements(): Promise<StockMovement[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("stock_movements")
    .select(`
      id,
      product_id,
      variant_id,
      type,
      quantity,
      stock_before,
      stock_after,
      reference_type,
      reference_id,
      note,
      created_at,
      created_by,
      product_name_snapshot,
      variant_name_snapshot,
      product_sku_snapshot,
      variant_sku_snapshot
    `)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return (data ?? []).map((movement) => ({
    id: movement.id,

    product_id: movement.product_id,
    variant_id: movement.variant_id,

    type: movement.type,

    quantity: movement.quantity,
    stock_before: movement.stock_before,
    stock_after: movement.stock_after,

    reference_type: movement.reference_type,
    reference_id: movement.reference_id,

    note: movement.note,

    created_at: movement.created_at,
    created_by: movement.created_by,

    product_name_snapshot:
      movement.product_name_snapshot,

    variant_name_snapshot:
      movement.variant_name_snapshot,

    product_sku_snapshot:
      movement.product_sku_snapshot,

    variant_sku_snapshot:
      movement.variant_sku_snapshot,
  }))
}


/*
 * =========================================================
 * STOCK ITEM UNTUK PERHITUNGAN / BARCODE SCAN
 * =========================================================
 */

export type StockItem = {
  id: string
  product_id: string | null
  variant_id: string | null

  name: string
  variant_name: string | null

  sku: string
  variant_sku: string | null

  barcode: string

  stock: number

  has_variant: boolean
}


/*
 * =========================================================
 * CARI ITEM BERDASARKAN BARCODE
 * =========================================================
 *
 * Barcode bisa berasal dari:
 *
 * products.barcode
 * atau
 * product_variants.barcode
 *
 * Hasil dibuat dalam bentuk StockItem
 * supaya halaman perhitungan tidak perlu
 * peduli apakah targetnya product atau variant.
 */

export async function findStockItemByBarcode(
  barcode: string
): Promise<StockItem | null> {

  const supabase = createClient()

  const cleanBarcode =
    barcode.trim()

  if (!cleanBarcode) {
    return null
  }


  /*
   * =======================================================
   * 1. CEK PRODUCT
   * =======================================================
   */

  const { data: product, error: productError } =
    await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        barcode,
        stock,
        has_variant,
        status,
        deleted_at
      `)
      .eq("barcode", cleanBarcode)
      .is("deleted_at", null)
      .maybeSingle()

  if (productError) {
    throw productError
  }

  if (product) {

    /*
     * Produk dengan variant seharusnya barcode
     * berada di variant.
     *
     * Tapi kalau barcode product ditemukan,
     * tetap kita kembalikan sebagai product.
     */

    return {
      id: product.id,

      product_id: product.id,
      variant_id: null,

      name: product.name,
      variant_name: null,

      sku: product.sku,
      variant_sku: null,

      barcode: product.barcode,

      stock: product.stock ?? 0,

      has_variant: product.has_variant,
    }
  }


  /*
   * =======================================================
   * 2. CEK VARIANT
   * =======================================================
   */

  const { data: variant, error: variantError } =
    await supabase
      .from("product_variants")
      .select(`
        id,
        product_id,
        name,
        sku,
        barcode,
        stock,
        status,
        deleted_at,
        products!inner (
          id,
          name,
          sku,
          has_variant,
          deleted_at
        )
      `)
      .eq("barcode", cleanBarcode)
      .is("deleted_at", null)
      .maybeSingle()

  if (variantError) {
    throw variantError
  }

  if (!variant) {
    return null
  }


  /*
   * =======================================================
   * PRODUCT DARI VARIANT
   * =======================================================
   */

  const productData =
    Array.isArray(variant.products)
      ? variant.products[0]
      : variant.products


  if (!productData) {
    throw new Error(
      "Produk dari variant tidak ditemukan"
    )
  }


  return {
    id: variant.id,

    product_id: variant.product_id,
    variant_id: variant.id,

    name: productData.name,
    variant_name: variant.name,

    sku: productData.sku,
    variant_sku: variant.sku,

    barcode: variant.barcode,

    stock: variant.stock ?? 0,

    has_variant: true,
  }
}