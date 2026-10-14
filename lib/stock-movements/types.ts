export type StockMovementType =
  | "in"
  | "out"
  | "adjustment"

export type StockMovement = {
  id: string

  product_id: string | null
  variant_id: string | null

  type: StockMovementType

  quantity: number

  stock_before: number
  stock_after: number

  reference_type: string | null
  reference_id: string | null

  note: string | null

  created_at: string
  created_by: string | null

  product_name_snapshot: string | null
  variant_name_snapshot: string | null

  product_sku_snapshot: string | null
  variant_sku_snapshot: string | null
}