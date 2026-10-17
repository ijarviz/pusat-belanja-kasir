import { cookies } from "next/headers"

import { execute } from "@/lib/db"
import { fetchUserOutlets } from "@/lib/outlet-queries"
import { getSessionUser } from "@/lib/session"

// POST /api/printer-logs — batch log cetak dari lib/printer/logger.ts
// (juga dikirim lewat navigator.sendBeacon saat halaman ditutup). Harus
// login; outlet diambil dari cookie outlet_id kalau user anggotanya.
const MAX_ENTRIES = 50
const LEVELS = new Set(["debug", "info", "warn", "error"])
const RETENTION_DAYS = 30

type Entry = { ts?: unknown; level?: unknown; message?: unknown; data?: unknown }

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.slice(0, max) : value == null ? null : String(value).slice(0, max)

function toDbTime(value: unknown) {
  const date = typeof value === "string" ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 23).replace("T", " ") : null
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return Response.json({ ok: false }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { sessionId?: unknown; entries?: unknown } | null
  const sessionId = text(body?.sessionId, 64)
  const entries = Array.isArray(body?.entries) ? (body.entries as Entry[]).slice(0, MAX_ENTRIES) : []
  if (!sessionId || !entries.length) return Response.json({ ok: false }, { status: 400 })

  const outletId = (await cookies()).get("outlet_id")?.value
  const outlets = await fetchUserOutlets(user.id)
  const outlet = outlets.find((o) => o.id === outletId) ?? outlets[0]
  const client = text(req.headers.get("user-agent"), 500)

  const rows = entries.map((entry) => [
    toDbTime(entry.ts),
    outlet?.id ?? null,
    user.id,
    sessionId,
    LEVELS.has(String(entry.level)) ? String(entry.level) : "info",
    text(entry.message, 1000) || "-",
    text(entry.data, 4000),
    client,
  ])

  await execute(
    `INSERT INTO printer_logs (logged_at, outlet_id, user_id, session_id, level, message, data, client)
     VALUES ${rows.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}`,
    rows.flat()
  )

  // Bersih-bersih sesekali, tanpa cron terpisah.
  if (Math.random() < 0.02) {
    await execute(
      `DELETE FROM printer_logs WHERE created_at < NOW() - INTERVAL ${RETENTION_DAYS} DAY`
    ).catch((error) => console.error("printer-logs cleanup:", error))
  }

  return Response.json({ ok: true })
}
