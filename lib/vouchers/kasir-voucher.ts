/*
 * Voucher produk di kasir (permintaan user 2026-11-15): hanya channel 1
 * (web & toko) dan 3 (toko saja), lihat ../docs/migrations/
 * 2026-11-15-voucher-channel-products.sql. Perhitungan murni, dipakai di
 * dialog kasir (perkiraan) dan di createStoreTransactionAction (nilai final).
 */

export const KASIR_VOUCHER_CHANNELS = [1, 3] as const

export type KasirVoucher = {
  id: string
  code: string
  name: string
  description: string | null
  product_discount_type: "nominal" | "percentage" | null
  product_discount_value: number | null
  product_max_discount: number | null
  min_purchase: number | null
  start_at: string | null
  end_at: string | null
  is_no_expiry: boolean
  // false = hanya product_ids (voucher_products).
  all_products: boolean
  product_ids: string[]
}

export type VoucherLine = {
  productId: string
  price: number
  qty: number
}

// Masih dalam periode berlaku.
export function isVoucherInPeriod(voucher: KasirVoucher, now = new Date()) {
  if (voucher.start_at && new Date(voucher.start_at).getTime() > now.getTime()) return false
  if (!voucher.is_no_expiry && voucher.end_at && new Date(voucher.end_at).getTime() < now.getTime()) {
    return false
  }
  return true
}

// Subtotal item yang kena voucher (semua, atau hanya produk terpilih).
export function eligibleSubtotal(voucher: KasirVoucher, lines: VoucherLine[]) {
  const ids = voucher.all_products ? null : new Set(voucher.product_ids)
  return lines.reduce(
    (sum, line) => (ids && !ids.has(line.productId) ? sum : sum + line.price * line.qty),
    0
  )
}

// Alasan voucher tidak bisa dipakai, atau null kalau bisa.
export function voucherBlockReason(voucher: KasirVoucher, lines: VoucherLine[]) {
  if (!isVoucherInPeriod(voucher)) return "Voucher di luar periode berlaku"
  const base = eligibleSubtotal(voucher, lines)
  if (base <= 0) return "Tidak ada produk di keranjang yang berlaku untuk voucher ini"
  if (voucher.min_purchase && base < voucher.min_purchase) {
    return `Min. belanja ${voucher.min_purchase.toLocaleString("id-ID")}${voucher.all_products ? "" : " (produk yang berlaku)"}`
  }
  return null
}

export function voucherDiscount(voucher: KasirVoucher | null, lines: VoucherLine[]) {
  if (!voucher || voucherBlockReason(voucher, lines)) return 0

  const base = eligibleSubtotal(voucher, lines)
  const value = Number(voucher.product_discount_value ?? 0)

  if (voucher.product_discount_type === "percentage") {
    let discount = Math.floor((base * Math.min(value, 100)) / 100)
    if (voucher.product_max_discount) discount = Math.min(discount, voucher.product_max_discount)
    return Math.min(discount, base)
  }

  return Math.min(value, base)
}
