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

  return attachDestinationAreas(rows.map(normalizeTransaction))
}

/*
 * Data label resi (format autolaris-app): transaksi + outlet (logo kiri
 * atas), pengirim dari Alamat Pickup, dan logo kurir dari expedition_master.
 * Urutan mengikuti ids.
 */
export async function getShippingLabels(ids: string[]): Promise<LabelRow[]> {
  const { activeOutlet } = await requireOutletAccess()

  const [transactions, outlet, pickup, couriers] = await Promise.all([
    getTransactionsForPrint(ids),
    queryOne<{ name: string; image_url: string | null; phone: string | null }>(
      "SELECT name, image_url, phone FROM outlets WHERE id = ?",
      [activeOutlet.id]
    ),
    queryOne<{ pp_name: string | null; pp_phone: string | null }>(
      "SELECT pp_name, pp_phone FROM outlet_pickup_point WHERE outlet_id = ? LIMIT 1",
      [activeOutlet.id]
    ),
    query<{ code: string; name: string; image_url: string | null }>(
      "SELECT code, name, image_url FROM expedition_master"
    ),
  ])

  const courierByCode = new Map(couriers.map((c) => [c.code.toLowerCase(), c]))
  const order = new Map(ids.map((id, index) => [id, index]))

  return transactions
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((trx) => {
      const code = String(trx.shipping_courier_code ?? "").toLowerCase()
      const area = trx.destination_area
      const items = (trx.products ?? []).map((p) => ({
        name: String(p.name ?? p.snapshot?.name ?? "-"),
        variant: (p.variantName ?? p.snapshot?.variantName ?? null) as string | null,
        qty: Number(p.qty) || 1,
      }))

      return {
        id: trx.id,
        invoice: trx.channel === "web" ? `PB${trx.invoice}` : `INV ${trx.invoice}`,
        awb: trx.awb ?? "",
        courierCode: code,
        courierName: courierByCode.get(code)?.name ?? trx.shipping_courier ?? "-",
        courierLogo: courierByCode.get(code)?.image_url ?? null,
        service: trx.shipping_service ?? "",
        shippingCost: Number(trx.shipping_cost ?? 0),
        weight: Number(trx.shipping_weight ?? 0),
        receiverName: trx.buyer_name ?? "-",
        receiverPhone: trx.buyer_phone ?? "",
        receiverAddress: trx.buyer_address ?? "",
        district: area?.district_name ?? "",
        regency: area?.regency_name ?? "",
        province: area?.province_name ?? "",
        note: trx.note ?? "",
        outletName: outlet?.name ?? trx.outlet_name ?? "",
        outletLogo: outlet?.image_url ?? null,
        senderName: pickup?.pp_name || outlet?.name || trx.outlet_name || "",
        senderPhone: pickup?.pp_phone || outlet?.phone || "",
        items,
      }
    })
}

export type LabelRow = {
  id: string
  invoice: string
  awb: string
  courierCode: string
  courierName: string
  courierLogo: string | null
  service: string
  shippingCost: number
  weight: number
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  district: string
  regency: string
  province: string
  note: string
  outletName: string
  outletLogo: string | null
  senderName: string
  senderPhone: string
  items: { name: string; variant: string | null; qty: number }[]
}
