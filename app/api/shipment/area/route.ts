export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Pencarian area (kecamatan/kota tujuan) untuk dashboard.
//
// API key shipment-service WAJIB tetap di server — route handler ini jadi proxy
// ke shipment-service GET /api/v1/shipment/area, sama seperti storefront BFF.
// Dipakai oleh form Alamat Pickup untuk memilih district_id area pickup.

type Area = {
  district_id: string
  autokirim_district_id: number
  district_name: string
  regency_name: string
  province_name: string
}

function shipmentConfig() {
  const baseUrl = process.env.SHIPMENT_SERVICE_URL
  const apiKey = process.env.SHIPMENT_API_KEY

  if (!baseUrl || !apiKey) {
    throw new Error("SHIPMENT_SERVICE_URL / SHIPMENT_API_KEY belum diset di env")
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey }
}

// GET /api/shipment/area?q=...&limit=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const limit = searchParams.get("limit") || "20"

  if (!q) {
    return Response.json({ ok: true, areas: [] as Area[] })
  }

  let cfg: { baseUrl: string; apiKey: string }
  try {
    cfg = shipmentConfig()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Konfigurasi shipment tidak lengkap"
    return Response.json({ ok: false, message, areas: [] }, { status: 500 })
  }

  const url = new URL(`${cfg.baseUrl}/api/v1/shipment/area`)
  url.searchParams.set("q", q)
  url.searchParams.set("limit", limit)

  let res: Response
  try {
    res = await fetch(url, {
      headers: { "X-API-KEY": cfg.apiKey },
      cache: "no-store",
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal menghubungi shipment-service"
    return Response.json({ ok: false, message, areas: [] }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json(
      { ok: false, message: `pencarian area gagal (${res.status})`, areas: [] },
      { status: res.status || 502 }
    )
  }

  const json = await res.json().catch(() => null)
  const areas: Area[] = json?.data?.areas ?? []

  return Response.json({ ok: true, areas })
}
