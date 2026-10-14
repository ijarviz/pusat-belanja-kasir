import { updateTransactionFieldAction } from "./actions"

export async function updateTransactionField(
  id: string,
  payload: Partial<{
    status: string
    payment_status: string
  }>
) {
  await updateTransactionFieldAction(id, payload)
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
