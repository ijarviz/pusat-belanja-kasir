import type { Transaction } from "./types"

/*
 * Tahap order web untuk tab filter Order Web dan badge "Create" di sidebar.
 * Status pengiriman berasal dari ket /advice Autolaris yang disinkron store
 * tiap 10 menit (store/app/api/cron/shipments), disimpan huruf kecil di
 * shipping_order_status. 'created' = nilai lama saat AWB baru terbit.
 * Order sebelum integrasi AL (tanpa al_transaction_id, era AutoKirim) tidak
 * pernah disinkron, jadi masuk "Arsip" dan tidak dihitung sebagai Create.
 */
export const ORDER_STAGES = [
  { key: "unpaid", label: "Belum Bayar" },
  { key: "awb_pending", label: "Menunggu Resi" },
  { key: "create", label: "Create" },
  { key: "pickup", label: "Pickup" },
  { key: "on_delivery", label: "On Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "return", label: "Return" },
  { key: "trouble", label: "Bermasalah" },
  { key: "cancelled", label: "Dibatalkan" },
  { key: "legacy", label: "Arsip" },
] as const

export type OrderStage = (typeof ORDER_STAGES)[number]["key"]

export const DEFAULT_ORDER_STAGE: OrderStage = "create"

export function orderStage(
  t: Pick<Transaction, "status" | "payment_status" | "awb" | "shipping_order_status" | "al_transaction_id">
): OrderStage {
  if (t.status === "cancelled") return "cancelled"
  if (!t.al_transaction_id) return "legacy"
  if (t.payment_status !== "paid") return "unpaid"
  if (!t.awb) return "awb_pending"

  switch ((t.shipping_order_status ?? "").toLowerCase()) {
    case "pickup":
      return "pickup"
    case "on shipment":
      return "on_delivery"
    case "delivered":
      return "delivered"
    case "return":
      return "return"
    case "trouble":
    case "claim":
      return "trouble"
    default:
      return "create"
  }
}

// Padanan SQL orderStage() === "create", untuk hitungan di sidebar.
export const CREATE_STAGE_SQL = `
  channel = 'web' AND status <> 'cancelled' AND al_transaction_id IS NOT NULL
  AND payment_status = 'paid' AND awb IS NOT NULL
  AND COALESCE(LOWER(shipping_order_status), '') NOT IN
    ('pickup', 'on shipment', 'delivered', 'return', 'trouble', 'claim')
`
