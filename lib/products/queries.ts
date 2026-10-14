import "server-only"

import { query } from "@/lib/db"
import { getCurrentOutletId } from "@/lib/current-outlet"

import type { Product } from "./types"
import { attachProductRelations } from "./rows"
import { mapProduct } from "./transformers"

export async function getProducts(): Promise<Product[]> {
  const outletId = await getCurrentOutletId()

  try {
    const products = await query(
      `SELECT * FROM products
       WHERE outlet_id = ?
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [outletId]
    )

    return (await attachProductRelations(products)).map(mapProduct)
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getProductById(
  id: string
): Promise<Product | null> {
  const outletId = await getCurrentOutletId()

  try {
    const products = await query(
      `SELECT * FROM products
       WHERE id = ?
         AND outlet_id = ?
         AND deleted_at IS NULL`,
      [id, outletId]
    )

    const [product] = await attachProductRelations(products)

    return product ? mapProduct(product) : null
  } catch (error) {
    console.error(error)
    return null
  }
}
