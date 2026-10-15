import "server-only"

import { query, queryOne } from "@/lib/db"

/*
 * Autolaris H2H untuk panel/kasir: pencarian kecamatan (tabel
 * autolaris_distrik), API key per outlet, dan pembatalan pengiriman.
 * Alur bayar/AWB order web ada di store (store/lib/autolaris/).
 * File ini identik di panel dan kasir.
 */

export const AL_API_KEY_CREDENTIAL = "AL_H2H_API_KEY"

export async function getAlApiKey(outletId: string): Promise<string | null> {
  const row = await queryOne<{ credential_value: string | null }>(
    `SELECT credential_value FROM outlet_credentials
     WHERE outlet_id = ? AND credential_key = ?`,
    [outletId, AL_API_KEY_CREDENTIAL]
  )

  return row?.credential_value?.trim() || null
}

export type AlArea = {
  district_id: string
  district_name: string
  regency_name: string
  province_name: string
}

type DistrikRow = {
  id_distrik: number
  nama_distrik: string
  nama_regency: string
  nama_propinsi: string
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

function toArea(row: DistrikRow): AlArea {
  return {
    district_id: String(row.id_distrik),
    district_name: titleCase(row.nama_distrik),
    regency_name: titleCase(row.nama_regency),
    province_name: titleCase(row.nama_propinsi),
  }
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

// Setiap kata harus muncul di kolom area ("BUBUTAN,KOTA SURABAYA,JAWA TIMUR").
export async function searchAlAreas(q: string, limit = 15): Promise<AlArea[]> {
  const words = q.trim().split(/\s+/).filter(Boolean).slice(0, 5)
  if (!words.length) return []

  const rows = await query<DistrikRow>(
    `SELECT id_distrik, nama_distrik, nama_regency, nama_propinsi
     FROM autolaris_distrik
     WHERE ${words.map(() => "area LIKE ?").join(" AND ")}
     ORDER BY (nama_distrik LIKE ?) DESC, nama_distrik
     LIMIT ?`,
    [
      ...words.map((w) => `%${escapeLike(w)}%`),
      `${escapeLike(words[0])}%`,
      Math.min(Math.max(limit, 1), 50),
    ]
  )

  return rows.map(toArea)
}

export async function getAlAreasByIds(ids: (string | number)[]) {
  if (!ids.length) return new Map<string, AlArea>()

  const rows = await query<DistrikRow>(
    `SELECT id_distrik, nama_distrik, nama_regency, nama_propinsi
     FROM autolaris_distrik WHERE id_distrik IN (?)`,
    [ids]
  )

  return new Map(rows.map((row) => [String(row.id_distrik), toArea(row)]))
}

/*
 * POST /api/h2h/cancel — batalkan order pengiriman Autolaris.
 * Tidak melempar error; kegagalan jaringan dikembalikan sebagai rc "99".
 */
export async function cancelAlOrder(apiKey: string, transactionId: string) {
  const baseUrl = (
    process.env.AL_H2H_BASE_URL || "https://api-h2h.autolaris.com"
  ).replace(/\/$/, "")

  try {
    const res = await fetch(`${baseUrl}/api/h2h/cancel`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ transaction_id: transactionId }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    })

    const text = await res.text()
    let body: { rc?: unknown; ket?: unknown } | null = null
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }

    const rc = body?.rc != null ? String(body.rc) : null
    const ket = body?.ket != null ? String(body.ket) : null

    if (rc !== "00") {
      console.error(
        `[autolaris] POST /api/h2h/cancel -> HTTP ${res.status} rc=${rc} ket=${ket}`,
        text.slice(0, 2000)
      )
    }

    return { rc, ket }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[autolaris] POST /api/h2h/cancel gagal:", message)
    return { rc: "99", ket: message }
  }
}

export type AlTrackingEvent = {
  status: string
  desc: string
  date: string | null
  time: string | null
  image: string | null
}

export type AlTracking = {
  awb: string
  courierName: string | null
  service: string | null
  stats: string | null
  etd: string | null
  podImage: string | null
  podReceiver: string | null
  events: AlTrackingEvent[]
}

/*
 * POST /api/h2h/lacak — riwayat scan kurir satu AWB, terbaru di atas.
 * Bentuk respons (dilihat 2026-10-15): data.{stats, etd, pod_image,
 * pod_receiver, histories[{status, desc, date, time, image}]}.
 */
export async function trackAlAwb(
  apiKey: string,
  awb: string
): Promise<{ ok: true; tracking: AlTracking } | { ok: false; message: string }> {
  const baseUrl = (
    process.env.AL_H2H_BASE_URL || "https://api-h2h.autolaris.com"
  ).replace(/\/$/, "")

  try {
    const res = await fetch(`${baseUrl}/api/h2h/lacak`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ awb }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    })

    const body = await res.json().catch(() => null)

    if (body?.rc !== "00" || !body?.data) {
      return { ok: false, message: body?.ket || `Gagal melacak resi (HTTP ${res.status})` }
    }

    const d = body.data
    const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

    const events: AlTrackingEvent[] = (Array.isArray(d.histories) ? d.histories : [])
      .map((h: Record<string, unknown>) => ({
        status: text(h.status) ?? "",
        desc: text(h.desc) ?? text(h.keterangan) ?? "",
        date: text(h.date),
        time: text(h.time),
        image: text(h.image),
      }))
      .sort((a: AlTrackingEvent, b: AlTrackingEvent) =>
        `${b.date ?? ""} ${b.time ?? ""}`.localeCompare(`${a.date ?? ""} ${a.time ?? ""}`)
      )

    return {
      ok: true,
      tracking: {
        awb: text(d.awb) ?? awb,
        courierName: text(d.courier_name),
        service: text(d.service),
        stats: text(d.stats),
        etd: text(d.etd),
        podImage: text(d.pod_image),
        podReceiver: text(d.pod_receiver),
        events,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[autolaris] POST /api/h2h/lacak gagal:", message)
    return { ok: false, message: "Gagal menghubungi Autolaris" }
  }
}
