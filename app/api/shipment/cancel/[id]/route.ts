export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { requireOutletAccess } from "@/lib/access"
import { cancelAlOrder, getAlApiKey } from "@/lib/autolaris"
import { execute, queryOne } from "@/lib/db"

// Batalkan pengiriman satu transaksi web lewat Autolaris H2H POST /api/h2h/cancel
// (transaction_id dari /submit, kolom al_transaction_id), lalu tandai
// transaksi cancelled. API key outlet tetap di server.

type TrxRow = {
  id: string
  awb: string | null
  al_transaction_id: string | null
  shipping_ref1: number | null
  status: string | null
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { activeOutlet } = await requireOutletAccess()

  const trx = await queryOne<TrxRow>(
    `SELECT id, awb, al_transaction_id, shipping_ref1, status
     FROM transactions
     WHERE id = ? AND outlet_id = ?`,
    [id, activeOutlet.id]
  )

  if (!trx) {
    return Response.json(
      { success: false, message: "Transaksi tidak ditemukan" },
      { status: 404 }
    )
  }

  if (trx.status === "cancelled") {
    return Response.json(
      { success: false, message: "Transaksi sudah dibatalkan" },
      { status: 422 }
    )
  }

  if (!trx.al_transaction_id) {
    return Response.json(
      {
        success: false,
        message: trx.shipping_ref1
          ? "Pengiriman ini dibuat lewat AutoKirim (sistem lama); batalkan langsung di AutoKirim"
          : "Transaksi belum punya pengiriman Autolaris",
      },
      { status: 422 }
    )
  }

  const apiKey = await getAlApiKey(activeOutlet.id)
  if (!apiKey) {
    return Response.json(
      { success: false, message: "API key Autolaris outlet belum diatur (Pengaturan > Metode Order)" },
      { status: 500 }
    )
  }

  const result = await cancelAlOrder(apiKey, trx.al_transaction_id)

  if (result.rc !== "00") {
    return Response.json(
      { success: false, message: `Pembatalan ditolak Autolaris: ${result.ket || "kesalahan tidak diketahui"}` },
      { status: 422 }
    )
  }

  // Sukses → tandai cancelled dan lepas AWB supaya tidak bisa dicetak ulang.
  try {
    await execute(
      `UPDATE transactions
       SET status = 'cancelled',
           awb = NULL,
           shipping_order_status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP(6),
           updated_at = CURRENT_TIMESTAMP(6)
       WHERE id = ?`,
      [id]
    )
  } catch (updateErr) {
    // Sudah dibatalkan di Autolaris tapi gagal disimpan — log keras agar bisa
    // direkonsiliasi manual (jangan batalkan ulang).
    console.error(
      `cancelShipment: trx ${id} dibatalkan di Autolaris tapi gagal update database:`,
      updateErr instanceof Error ? updateErr.message : updateErr
    )
    return Response.json(
      { success: false, message: "Pengiriman dibatalkan tapi gagal disimpan" },
      { status: 500 }
    )
  }

  return Response.json({ success: true, message: "Pengiriman dibatalkan" })
}
