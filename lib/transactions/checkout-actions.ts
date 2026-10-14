"use server"

import { callProcedure, dbErrorMessage, queryOne, withUserConnection } from "@/lib/db"
import { requireOutletAccess } from "@/lib/outlet"
import { getSessionUser } from "@/lib/session"

import { normalizeTransaction } from "./queries"
import type { Transaction } from "./types"

/*
 * Server action untuk components/kasir/kasir-client.tsx (layar kasir).
 * Dulu dipanggil langsung dari browser lewat supabase.rpc().
 */

export async function getCurrentUserDisplayNameAction() {
  const user = await getSessionUser()

  return user?.name || user?.email || "-"
}

export type CreateStoreTransactionInput = {
  outletId: string
  buyerName: string
  buyerPhone: string
  paymentMethod: string
  // Snapshot item keranjang; minimal { productId, variantId, qty }.
  products: unknown[]
  subtotal: number
  total: number
}

export async function createStoreTransactionAction(
  input: CreateStoreTransactionInput
): Promise<
  | { success: true; transaction: Transaction }
  | { success: false; message: string }
> {
  const { user, activeOutlet } = await requireOutletAccess()

  // RPC Supabase tidak memeriksa ini; di sini transaksi hanya boleh
  // dibuat untuk outlet aktif milik user yang login.
  if (input.outletId !== activeOutlet.id) {
    return {
      success: false,
      message: "Outlet transaksi tidak sesuai dengan outlet aktif.",
    }
  }

  if (!Array.isArray(input.products)) {
    return { success: false, message: "Data produk tidak valid." }
  }

  let transactionId: string | null

  try {
    transactionId = await withUserConnection(user.id, async (conn) => {
      const [row] = await callProcedure<{ id: string }>(
        conn,
        "create_store_transaction",
        [
          activeOutlet.id,
          input.buyerName,
          input.buyerPhone,
          input.paymentMethod,
          JSON.stringify(input.products),
          input.subtotal,
          input.total,
        ]
      )

      return row?.id ?? null
    })
  } catch (error) {
    // Pesan dari procedure (mis. "Stok ... tidak mencukupi...")
    // dikembalikan apa adanya, seperti error Supabase dulu.
    return { success: false, message: dbErrorMessage(error) }
  }

  if (!transactionId) {
    return {
      success: false,
      message:
        "Transaksi berhasil dibuat tetapi ID transaksi tidak ditemukan.",
    }
  }

  const row = await queryOne(
    "SELECT * FROM transactions WHERE id = ? AND outlet_id = ?",
    [transactionId, activeOutlet.id]
  )

  if (!row) {
    return {
      success: false,
      message:
        "Transaksi berhasil dibuat, tetapi data transaksi gagal diambil.",
    }
  }

  return {
    success: true,
    transaction: {
      ...normalizeTransaction(row),
      destination_area: null,
    },
  }
}
