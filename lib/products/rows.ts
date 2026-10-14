import "server-only"

import { parseJson, query, type DbExecutor, type Row } from "@/lib/db"

/*
 * Pengganti select nested Supabase:
 *   *, category:categories(*), variants:product_variants(*),
 *   images:product_images(*)
 * Menempelkan relasi ke row produk dengan bentuk yang sama.
 */
export async function attachProductRelations(
  products: Row[],
  db?: DbExecutor
): Promise<Row[]> {
  if (!products.length) return []

  const productIds = products.map((product) => product.id)

  const categoryIds = [
    ...new Set(
      products
        .map((product) => product.category_id)
        .filter((id) => id !== null && id !== undefined)
    ),
  ]

  const [categories, variants, images] = await Promise.all([
    categoryIds.length
      ? query("SELECT * FROM categories WHERE id IN (?)", [categoryIds], db)
      : Promise.resolve([] as Row[]),
    query(
      `SELECT * FROM product_variants
       WHERE product_id IN (?)
       ORDER BY sort_order, created_at`,
      [productIds],
      db
    ),
    query(
      `SELECT * FROM product_images
       WHERE product_id IN (?)
       ORDER BY sort_order, created_at`,
      [productIds],
      db
    ),
  ])

  const categoryById = new Map(
    categories.map((category) => [String(category.id), category])
  )

  return products.map((product) => ({
    ...product,
    variant_config: parseJson(product.variant_config),
    category:
      product.category_id !== null && product.category_id !== undefined
        ? categoryById.get(String(product.category_id)) ?? null
        : null,
    variants: variants.filter((variant) => variant.product_id === product.id),
    images: images.filter((image) => image.product_id === product.id),
  }))
}
