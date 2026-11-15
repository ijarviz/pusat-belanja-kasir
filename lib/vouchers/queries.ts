import "server-only"

import { query, queryOne } from "@/lib/db"

import { KASIR_VOUCHER_CHANNELS, type KasirVoucher } from "./kasir-voucher"

const COLUMNS = `id, code, name, description, product_discount_type, product_discount_value,
  product_max_discount, min_purchase, start_at, end_at, is_no_expiry, all_products`

async function withProductIds(vouchers: Omit<KasirVoucher, "product_ids">[]): Promise<KasirVoucher[]> {
  const scoped = vouchers.filter((v) => !v.all_products).map((v) => v.id)
  const rows = scoped.length
    ? await query<{ voucher_id: string; product_id: string }>(
        "SELECT voucher_id, product_id FROM voucher_products WHERE voucher_id IN (?)",
        [scoped]
      )
    : []

  return vouchers.map((v) => ({
    ...v,
    product_ids: rows.filter((r) => r.voucher_id === v.id).map((r) => r.product_id),
  }))
}

// Voucher produk aktif yang boleh dipakai di kasir (channel 1 dan 3).
export async function getKasirVouchers(outletId: string): Promise<KasirVoucher[]> {
  const rows = await query<Omit<KasirVoucher, "product_ids">>(
    `SELECT ${COLUMNS} FROM vouchers
     WHERE outlet_id = ? AND is_active = TRUE AND voucher_type = 'product'
       AND channel IN (${KASIR_VOUCHER_CHANNELS.join(", ")})
     ORDER BY created_at DESC`,
    [outletId]
  )
  return withProductIds(rows)
}

export async function getKasirVoucher(outletId: string, id: string): Promise<KasirVoucher | null> {
  const row = await queryOne<Omit<KasirVoucher, "product_ids">>(
    `SELECT ${COLUMNS} FROM vouchers
     WHERE id = ? AND outlet_id = ? AND is_active = TRUE AND voucher_type = 'product'
       AND channel IN (${KASIR_VOUCHER_CHANNELS.join(", ")})`,
    [id, outletId]
  )
  return row ? (await withProductIds([row]))[0] : null
}
