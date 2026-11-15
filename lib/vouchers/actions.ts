"use server"

import { requireOutletAccess } from "@/lib/outlet"

import { getKasirVouchers } from "./queries"

// Voucher produk aktif untuk dialog kasir (channel Semua / Toko Saja).
export async function getKasirVouchersAction() {
  const { activeOutlet } = await requireOutletAccess()
  return getKasirVouchers(activeOutlet.id)
}
