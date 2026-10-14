export type TransactionStatus =
  | "order"
  | "pending"
  | "process"
  | "completed"
  | "refund"
  | "cancelled"

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "expired"

export type TransactionChannel =
  | "web"
  | "offline"
  | "ads"
  | "whatsapp"
  | "others"
  | string

export type TransactionProduct = {
  qty: number
  name: string
  image: string
  price: number

  stock?: number
  lowStock?: boolean
  message?: string

  variantId?: string | null
  variantName?: string | null

  productId?: string

  availableStock?: number

  snapshot?: {
    name: string
    image: string
    price: number
    variantName?: string | null
  }
}

export type Transaction = {
  id: string

  outlet_id: string | null
  outlet_name: string | null

  order_date: string
  invoice: string | null
  status: TransactionStatus
  payment_status: PaymentStatus

  payment_method: string | null
  payment_type: string | null
  shipping_method: string | null

  shipping_courier: string | null
  shipping_service: string | null
  shipping_order_status: string | null

  awb: string | null
  awb_created_at: string | null
  shipping_ref1: number | null

  buyer_name: string | null
  buyer_phone: string | null
  buyer_address: string | null

  shipping_destination_id: number | null
  shipping_district_name: string | null
  shipping_regency_name: string | null
  shipping_province_name: string | null

  autokirim_area: TransactionArea | null
  products: TransactionProduct[]

  subtotal: number
  shipping_cost: number
  admin_fee: number
  discount: number
  insurance_fee: number
  total: number

  processed_by_name: string | null

  insurance: boolean

  payment_code: string | null

  note: string | null

  channel: TransactionChannel | null

  expired_at: string | null

  created_at: string
  updated_at: string
}

export type TransactionArea = {
  district_id: number
  district_name: string
  regency_name: string
  province_name: string
  postcode: string | null
}