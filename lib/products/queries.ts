import { createClient } from "@/lib/supabase/server"
// import { getCurrentOutletCode } from "@/lib/current-outlet"
import { getCurrentOutletId } from "@/lib/current-outlet"

import type { Product } from "./types"
import { mapProduct } from "./transformers"

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  // const outletCode =
    // await getCurrentOutletCode()
  const outletId =
    await getCurrentOutletId()

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories!products_category_id_fkey(*),
      variants: product_variants!product_id(*),
      images: product_images!product_images_product_id_fkey(*)
    `)
    // .eq("outlet_code", outletCode)
    .eq("outlet_id", outletId)
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    console.error(error)
    return []
  }

  return (data ?? []).map(mapProduct)
}

export async function getProductById(
  id: string
): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories!products_category_id_fkey(*),
      variants: product_variants!product_id(*),
      images: product_images!product_images_product_id_fkey(*)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return mapProduct(data)
}