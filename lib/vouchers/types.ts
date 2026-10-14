export type VoucherType = "product" | "shipping"

export type ProductDiscountType = "percentage" | "nominal"

export type ShippingDiscountType =
  | "free_shipping"
  | "shipping_discount"

export type Voucher = {
  id: string
  outlet_id: string

  code: string
  name: string
  description: string | null

  voucher_type: "product" | "shipping"

  product_discount_type: "nominal" | "percentage" | null
  product_discount_value: number | null
  product_max_discount: number | null

  shipping_discount_type: "free_shipping" | "shipping_discount" | null
  shipping_discount_value: number | null

  start_at: string
  end_at: string | null
  is_no_expiry: boolean

  is_active: boolean

  min_purchase: number
  usage_limit: number | null

  created_at: string
  updated_at: string
}

export interface VoucherUsage {
  id: string

  voucher_id: string
  transaction_id: string

  discount_amount: number

  created_at: string
}