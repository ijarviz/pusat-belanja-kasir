import type { Transaction } from "./types"

/*
 * Status pengiriman order web, memakai id status Autolaris (sama dengan
 * autolaris-app lib/marketplace-status.ts), untuk badge di kolom Ekspedisi,
 * tab Order Web, dan badge sidebar (permintaan user 2026-10-17).
 *
 * H2H /advice tidak mengirim id, hanya teks `ket` (PAID, CREATE, PICKUP,
 * ON SHIPMENT, DELIVERED, RETURN, TROUBLE, CLAIM; FAILED/CANCEL/PENDING)
 * yang disinkron store tiap 10 menit ke shipping_order_status (huruf
 * kecil). Teks itu dipetakan ke id di SHIPMENT_TEXT_IDS; id yang tidak
 * pernah dikirim H2H (13-19, 100) ikut dipetakan dari padanan teksnya
 * kalau suatu saat muncul. Pembatalan dibedakan dari kolom kita sendiri:
 * tidak jadi dibayar (expired = lewat batas bayar 5 menit, atau failed)
 * jadi satu badge "Pembayaran Gagal" (10, permintaan user 2026-10-17; id 11
 * tidak dipakai), selain itu dibatalkan seller / di AL (12).
 *
 * Order sebelum integrasi AL (tanpa al_transaction_id, era AutoKirim)
 * tidak pernah disinkron: tanpa id, masuk tab "Arsip".
 */

export const SHIPMENT_STATUS: Record<number, { label: string; className: string }> = {
  1: { label: "Belum Dibayar", className: "bg-amber-100 text-amber-800" },
  2: { label: "Sudah Dibayar", className: "bg-red-100 text-red-700" },
  3: { label: "Belum Pickup", className: "bg-neutral-200 text-neutral-700" },
  4: { label: "Pickup", className: "bg-teal-100 text-teal-700" },
  5: { label: "Perjalanan", className: "bg-blue-100 text-blue-700" },
  6: { label: "Terkirim", className: "bg-emerald-100 text-emerald-700" },
  7: { label: "Retur", className: "bg-orange-100 text-orange-700" },
  8: { label: "Bermasalah", className: "bg-red-100 text-red-700" },
  9: { label: "Claim", className: "bg-purple-100 text-purple-700" },
  10: { label: "Pembayaran Gagal", className: "bg-amber-100 text-amber-800" },
  11: { label: "Dibatalkan Sistem", className: "bg-neutral-800 text-white" },
  12: { label: "Dibatalkan Seller", className: "bg-neutral-800 text-white" },
  13: { label: "Perjalanan Retur", className: "bg-orange-200 text-orange-800" },
  14: { label: "Menuju Penerima", className: "bg-emerald-50 text-emerald-600" },
  15: { label: "Bea Cukai", className: "bg-pink-100 text-pink-700" },
  16: { label: "Gagal Pickup", className: "bg-neutral-100 text-neutral-600" },
  17: { label: "Claim Rejected", className: "bg-purple-50 text-purple-600" },
  18: { label: "Claim Requested", className: "bg-purple-50 text-purple-600" },
  19: { label: "Dibatalkan Buyer", className: "bg-neutral-800 text-white" },
  100: { label: "Selesai", className: "bg-green-600 text-white" },
}

// shipping_order_status (dinormalisasi: huruf besar, "_" jadi spasi) -> id.
// Teks lain yang tidak dikenal dianggap 3 (belum pickup).
const SHIPMENT_TEXT_IDS: Record<string, number> = {
  "": 3,
  CREATE: 3,
  CREATED: 3,
  FAILED: 3, // /pickup gagal: resi lama tetap menunggu pickup
  PICKUP: 4,
  "ON SHIPMENT": 5,
  PERJALANAN: 5,
  DELIVERED: 6,
  TERKIRIM: 6,
  RETURN: 7,
  RETUR: 7,
  TROUBLE: 8,
  BERMASALAH: 8,
  CLAIM: 9,
  KLAIM: 9,
  "ON RETURN": 13,
  "RETURN SHIPMENT": 13,
  "PERJALANAN RETUR": 13,
  "MENUJU PENERIMA": 14,
  "OUT FOR DELIVERY": 14,
  "BEA CUKAI": 15,
  CUSTOMS: 15,
  "GAGAL PICKUP": 16,
  "PICKUP FAILED": 16,
  "FAILED PICKUP": 16,
  "CLAIM REJECTED": 17,
  "KLAIM DITOLAK": 17,
  "CLAIM REQUESTED": 18,
  SELESAI: 100,
  COMPLETED: 100,
  DONE: 100,
}

export const ORDER_TABS = [
  { key: "belum_bayar", label: "Belum Bayar", statusIds: [1] },
  { key: "perlu_dikirim", label: "Perlu Dikirim", statusIds: [2, 3, 16] },
  { key: "dikirim", label: "Dikirim", statusIds: [4, 5, 6, 8, 14] },
  { key: "selesai", label: "Selesai", statusIds: [100] },
  { key: "gagal", label: "Pengiriman Gagal", statusIds: [7, 9, 13, 15, 17, 18] },
  { key: "dibatalkan", label: "Batal", statusIds: [10, 11, 12, 19] },
  { key: "arsip", label: "Arsip", statusIds: [] as number[] },
] as const

export type OrderTab = (typeof ORDER_TABS)[number]["key"]

// Tab default Order Web dan yang dihitung di badge sidebar.
export const DEFAULT_ORDER_TAB: OrderTab = "perlu_dikirim"

type StageFields = Pick<
  Transaction,
  "status" | "payment_status" | "awb" | "shipping_order_status" | "al_transaction_id"
>

function normalize(text: string | null) {
  return (text ?? "").trim().toUpperCase().replace(/_/g, " ")
}

/** Id status pengiriman AL, atau null untuk order lama (Arsip). */
export function shipmentStatusId(t: StageFields): number | null {
  if (!t.al_transaction_id) return null

  if (t.status === "cancelled") {
    if (t.payment_status === "expired" || t.payment_status === "failed") return 10
    return 12
  }

  if (t.payment_status !== "paid") return 1
  if (!t.awb) return 2

  return SHIPMENT_TEXT_IDS[normalize(t.shipping_order_status)] ?? 3
}

export function shipmentStatus(t: StageFields) {
  const id = shipmentStatusId(t)
  return id === null ? null : { id, ...SHIPMENT_STATUS[id] }
}

export function orderTab(t: StageFields): OrderTab {
  const id = shipmentStatusId(t)
  if (id === null) return "arsip"
  return ORDER_TABS.find((tab) => (tab.statusIds as readonly number[]).includes(id))?.key ?? "dikirim"
}

/*
 * Padanan SQL orderTab() === "perlu_dikirim" (id 2, 3, 16) untuk hitungan
 * di sidebar: lunas, belum batal, dan resi belum ada atau statusnya bukan
 * status lanjut (teks tak dikenal = 3, sama seperti shipmentStatusId).
 */
const LATER_TEXTS = Object.entries(SHIPMENT_TEXT_IDS)
  .filter(([, id]) => id !== 3 && id !== 16)
  .map(([text]) => `'${text.replace(/'/g, "''")}'`)
  .join(", ")

export const NEEDS_SHIPPING_SQL = `
  channel = 'web' AND status <> 'cancelled' AND al_transaction_id IS NOT NULL
  AND payment_status = 'paid'
  AND (
    awb IS NULL
    OR UPPER(REPLACE(TRIM(COALESCE(shipping_order_status, '')), '_', ' ')) NOT IN (${LATER_TEXTS})
  )
`
