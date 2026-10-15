export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { requireOutletAccess } from "@/lib/access"
import { getAlApiKey, trackAlAwb } from "@/lib/autolaris"
import { queryOne } from "@/lib/db"

// GET /api/shipment/track/:id — riwayat pengiriman (Autolaris /lacak) untuk
// popup "Lacak Pengiriman" di Order Web. Transaksi harus milik outlet aktif.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { activeOutlet } = await requireOutletAccess()

  const trx = await queryOne<{ awb: string | null }>(
    "SELECT awb FROM transactions WHERE id = ? AND outlet_id = ?",
    [id, activeOutlet.id]
  )

  if (!trx) {
    return Response.json({ ok: false, message: "Transaksi tidak ditemukan" }, { status: 404 })
  }

  if (!trx.awb) {
    return Response.json({ ok: false, message: "Resi belum terbit" }, { status: 422 })
  }

  const apiKey = await getAlApiKey(activeOutlet.id)
  if (!apiKey) {
    return Response.json(
      { ok: false, message: "API key Autolaris outlet belum diatur (Pengaturan > Metode Order)" },
      { status: 500 }
    )
  }

  const result = await trackAlAwb(apiKey, trx.awb)

  if (!result.ok) {
    return Response.json({ ok: false, message: result.message }, { status: 502 })
  }

  return Response.json({ ok: true, tracking: result.tracking })
}
