import "server-only"

import { getAlAreasByIds } from "@/lib/autolaris"
import { parseJson, query, queryOne, type Row } from "@/lib/db"
import { requireOutletAccess } from "@/lib/outlet"

import type {
  Transaction,
  TransactionArea,
  TransactionProduct,
} from "./types"

type TransactionRow = Omit<Transaction, "destination_area">

/*
 * Nama kecamatan tujuan. Order Autolaris H2H (al_transaction_id terisi)
 * menyimpan id_distrik AL di shipping_destination_id; order lama dari
 * AutoKirim menyimpan district_id tabel autokirim_area.
 */
async function attachDestinationAreas(
  transactions: TransactionRow[]
): Promise<Transaction[]> {
  const isAl = (t: TransactionRow) => Boolean(t.al_transaction_id)
  const idsOf = (rows: TransactionRow[]) => [
    ...new Set(
      rows
        .map((t) => t.shipping_destination_id)
        .filter((id): id is number => id !== null && id !== undefined)
    ),
  ]

  const alIds = idsOf(transactions.filter(isAl))
  const legacyIds = idsOf(transactions.filter((t) => !isAl(t)))

  const [alAreas, legacyAreas] = await Promise.all([
    getAlAreasByIds(alIds),
    legacyIds.length
      ? query<TransactionArea>(
          `SELECT district_id, district_name, regency_name, province_name, postcode
           FROM autokirim_area
           WHERE district_id IN (?)`,
          [legacyIds]
        )
      : Promise.resolve([] as TransactionArea[]),
  ])

  const legacyMap = new Map(
    legacyAreas.map((area) => [String(area.district_id), area])
  )

  return transactions.map((transaction) => {
    const id = transaction.shipping_destination_id
    const key = id !== null && id !== undefined ? String(id) : null
    const alArea = key && isAl(transaction) ? alAreas.get(key) : undefined

    return {
      ...transaction,
      destination_area: !key
        ? null
        : alArea
          ? { ...alArea, postcode: null }
          : isAl(transaction)
            ? null
            : legacyMap.get(key) ?? null,
    }
  })
}

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

  try {
    return await attachDestinationAreas(transactions)
  } catch (error) {
    console.error(
      "[getTransactions] area error:",
      error
    )

    throw error
  }
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

  const [transaction] = await attachDestinationAreas([
    normalizeTransaction(row),
  ])

  return transaction
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
