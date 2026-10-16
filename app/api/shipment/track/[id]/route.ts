export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { requireOutletAccess } from "@/lib/access"
import { getAlApiKey, trackAlAwb, type AlTracking, type AlTrackingEvent } from "@/lib/autolaris"
import { queryOne } from "@/lib/db"

type TrackRow = {
  awb: string | null
  status: string | null
  shipping_courier: string | null
  shipping_service: string | null
  shipping_order_status: string | null
  awb_created_at: string | null
  cancelled_at: string | null
}

// GET /api/shipment/track/:id — riwayat pengiriman (Autolaris /lacak) untuk
// popup "Lacak Pengiriman" di Order Web. Transaksi harus milik outlet aktif.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { activeOutlet } = await requireOutletAccess()

  const trx = await queryOne<TrackRow>(
    `SELECT awb, status, shipping_courier, shipping_service, shipping_order_status,
            awb_created_at, cancelled_at
     FROM transactions WHERE id = ? AND outlet_id = ?`,
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

  if (result.ok) {
    return Response.json({ ok: true, tracking: withCancel(result.tracking, trx) })
  }

  // /lacak H2H hanya meneruskan data kurir: resi yang belum pernah discan
  // (mis. dibatalkan sebelum pickup) dijawab "Not available". Riwayat
  // internal AL (yang tampil di autolaris-app) tidak tersedia lewat H2H,
  // jadi susun dari catatan kita sendiri.
  if (result.notAvailable) {
    return Response.json({ ok: true, tracking: localTracking(trx) })
  }

  return Response.json({ ok: false, message: result.message }, { status: 502 })
}

// DATETIME dari lib/db.ts sudah ISO UTC ("...T10:31:02.733000Z"); tampilkan
// WIB seperti AL.
function wibEvent(utc: string | null, status: string, desc: string): AlTrackingEvent | null {
  if (!utc) return null
  const date = new Date(utc)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return {
    status,
    desc,
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
    image: null,
  }
}

function cancelEvent(trx: TrackRow) {
  return trx.status === "cancelled"
    ? wibEvent(trx.cancelled_at, "CANCEL", "Pengiriman dibatalkan")
    : null
}

function withCancel(tracking: AlTracking, trx: TrackRow): AlTracking {
  const cancel = cancelEvent(trx)
  if (!cancel || tracking.events.some((e) => e.status.toUpperCase().includes("CANCEL"))) {
    return tracking
  }
  return { ...tracking, stats: tracking.stats ?? "CANCEL", events: [cancel, ...tracking.events] }
}

function localTracking(trx: TrackRow): AlTracking {
  const events = [cancelEvent(trx), wibEvent(trx.awb_created_at, "CREATE", "Manifes")].filter(
    (e): e is AlTrackingEvent => e !== null
  )
  return {
    awb: trx.awb ?? "",
    courierName: trx.shipping_courier,
    service: trx.shipping_service,
    stats: trx.status === "cancelled" ? "CANCEL" : (trx.shipping_order_status?.toUpperCase() ?? null),
    etd: null,
    podImage: null,
    podReceiver: null,
    events,
  }
}
