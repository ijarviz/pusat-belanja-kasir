export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { searchAlAreas } from "@/lib/autolaris"

// Pencarian kecamatan (kode kecamatan Autolaris H2H, tabel autolaris_distrik).
// Dipakai oleh form Alamat Pickup untuk memilih kecamatan asal pengiriman.

// GET /api/shipment/area?q=...&limit=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const limit = Number(searchParams.get("limit") || 15)

  if (q.length < 3) {
    return Response.json({ ok: true, areas: [] })
  }

  try {
    return Response.json({ ok: true, areas: await searchAlAreas(q, limit) })
  } catch (err) {
    console.error("api/shipment/area error:", err)
    return Response.json(
      { ok: false, message: "Gagal mencari area", areas: [] },
      { status: 500 }
    )
  }
}
