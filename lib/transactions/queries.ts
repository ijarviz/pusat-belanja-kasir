import "server-only"

import { parseJson, query, queryOne, type Row } from "@/lib/db"
import { requireOutletAccess } from "@/lib/outlet"

import type {
  Transaction,
  TransactionArea,
  TransactionProduct,
} from "./types"

type TransactionRow = Omit<Transaction, "autokirim_area">

/*
 * Kolom JSON `products` disimpan sebagai teks di MariaDB.
 */
export function normalizeTransaction(row: Row): TransactionRow {
  return {
    ...row,
    products: parseJson<TransactionProduct[]>(row.products) ?? [],
  } as TransactionRow
}

export async function getTransactions(
  channel?: string
) {
  const { activeOutlet } = await requireOutletAccess()

  const params: unknown[] = [activeOutlet.id]
  let sql = "SELECT * FROM transactions WHERE outlet_id = ?"

  if (channel) {
    sql += " AND channel = ?"
    params.push(channel)
  }

  sql += " ORDER BY created_at DESC"

  let transactions: TransactionRow[]

  try {
    transactions = (await query(sql, params)).map(normalizeTransaction)
  } catch (error) {
    console.error(
      "[getTransactions] transaction error:",
      error
    )

    throw error
  }

  const destinationIds = [
    ...new Set(
      transactions
        .map(
          (transaction) =>
            transaction.shipping_destination_id
        )
        .filter(
          (id): id is number =>
            id !== null &&
            id !== undefined
        )
    ),
  ]

  if (destinationIds.length === 0) {
    return transactions.map((transaction) => ({
      ...transaction,
      autokirim_area: null,
    }))
  }

  let areas: TransactionArea[]

  try {
    areas = await query<TransactionArea>(
      `SELECT district_id, district_name, regency_name, province_name, postcode
       FROM autokirim_area
       WHERE district_id IN (?)`,
      [destinationIds]
    )
  } catch (error) {
    console.error(
      "[getTransactions] area error:",
      error
    )

    throw error
  }

  const areaMap = new Map(
    areas.map((area) => [
      String(area.district_id),
      area,
    ])
  )

  return transactions.map((transaction): Transaction => {
    const destinationId =
      transaction.shipping_destination_id

    const area =
      destinationId !== null &&
      destinationId !== undefined
        ? areaMap.get(
            String(destinationId)
          ) ?? null
        : null

    return {
      ...transaction,
      autokirim_area: area,
    }
  })
}

export async function getTransactionById(
  id: string
) {
  const { activeOutlet } = await requireOutletAccess()

  const row = await queryOne(
    "SELECT * FROM transactions WHERE id = ? AND outlet_id = ?",
    [id, activeOutlet.id]
  )

  if (!row) {
    throw new Error("Transaksi tidak ditemukan")
  }

  const data = normalizeTransaction(row)

  let autokirim_area: TransactionArea | null = null

  if (
    data.shipping_destination_id !== null &&
    data.shipping_destination_id !== undefined
  ) {
    autokirim_area = await queryOne<TransactionArea>(
      `SELECT district_id, district_name, regency_name, province_name, postcode
       FROM autokirim_area
       WHERE district_id = ?`,
      [data.shipping_destination_id]
    )
  }

  return {
    ...data,
    autokirim_area,
  }
}

/*
 * Transaksi untuk halaman cetak resi, dibatasi ke outlet aktif.
 */
export async function getTransactionsForPrint(ids: string[]) {
  const { activeOutlet } = await requireOutletAccess()

  if (!ids.length) return []

  const rows = await query(
    "SELECT * FROM transactions WHERE id IN (?) AND outlet_id = ?",
    [ids, activeOutlet.id]
  )

  return rows.map(normalizeTransaction)
}
