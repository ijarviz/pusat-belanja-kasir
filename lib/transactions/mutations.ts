import { createClient } from "@/lib/supabase/client"

export async function updateTransactionField(
  id: string,
  payload: Partial<{
    status: string
    payment_status: string
  }>
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("transactions")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) throw error
}

// Batalkan pengiriman (void AWB) untuk satu transaksi lewat route handler server
// (API key shipment-service tidak boleh sampai ke browser). Route handler yang
// memanggil shipment-service dan menandai transaksi cancelled.
export async function cancelShipment(id: string): Promise<void> {
  const res = await fetch(`/api/shipment/cancel/${id}`, {
    method: "POST",
    cache: "no-store",
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Gagal membatalkan pengiriman (${res.status})`)
  }
}

// export async function cancelTransaction(params: {
//   id: string
//   reason?: string
//   cancelledBy?: string | null
//   status: "buyer_cancelled" | "outlet_cancelled"
// }) {
//   const supabase = createClient()

//   const { id, reason, cancelledBy, status } = params

//   const { error } = await supabase
//     .from("transactions")
//     .update({
//       status,
//       cancel_reason: reason ?? null,
//       cancelled_by: cancelledBy ?? null,
//       cancelled_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     })
//     .eq("id", id)

//   if (error) {
//     throw error
//   }
// }