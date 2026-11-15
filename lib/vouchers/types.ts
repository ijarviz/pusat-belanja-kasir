export type VoucherType = "product" | "shipping"

export type ProductDiscountType = "percentage" | "nominal"

export type ShippingDiscountType =
  | "free_shipping"
  | "shipping_discount"

/*
 * vouchers.channel (voucher produk saja, ../docs/migrations/
 * 2026-11-15-voucher-channel-products.sql). Disimpan sebagai angka supaya
 * store (web) dan kasir (toko) cukup memfilter id-nya.
 */
export const VOUCHER_CHANNELS = [
  { id: 1, label: "Untuk Pembelian Web dan Toko", short: "Semua" },
  { id: 2, label: "Pembelian Web Saja", short: "Web" },
  { id: 3, label: "Pembelian Toko Saja", short: "Toko" },
] as const

export type VoucherChannel = (typeof VOUCHER_CHANNELS)[number]["id"]

export type Voucher = {
  id: string
  outlet_id: string

  code: string
  name: string
  description: string | null

  voucher_type: "product" | "shipping"

  channel: VoucherChannel
  // true = semua produk outlet; false = hanya product_ids (voucher_products).
  all_products: boolean
  product_ids?: string[]
  // Jumlah produk yang kena voucher (daftar voucher).
  product_count?: number

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
// Produk untuk pilihan "Pilih Produk" di form voucher.
export type VoucherProductOption = {
  id: string
  name: string
  sku: string | null
  image: string | null
  status: string
}
