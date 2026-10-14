import "server-only"

import { queryOne, type DbExecutor } from "@/lib/db"
import { requireOutletAccess } from "@/lib/outlet"

/*
 * Pengecekan kepemilikan data per outlet. Di Supabase ini ditangani
 * RLS; di MariaDB setiap server action harus memanggilnya sendiri
 * sebelum membaca/menulis row berdasarkan id dari client.
 */

export class AccessError extends Error {}

export { requireOutletAccess }

export async function assertTransactionInOutlet(
  transactionId: string,
  outletId: string,
  db?: DbExecutor
) {
  const transaction = await queryOne(
    "SELECT id FROM transactions WHERE id = ? AND outlet_id = ?",
    [transactionId, outletId],
    db
  )

  if (!transaction) {
    throw new AccessError("Transaksi tidak ditemukan di outlet ini")
  }
}
