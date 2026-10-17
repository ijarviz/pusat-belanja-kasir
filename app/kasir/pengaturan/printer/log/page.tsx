import type { Metadata } from "next"

import { query } from "@/lib/db"
import { getActiveOutlet } from "@/lib/outlet"
import { cn } from "@/lib/utils"

import { CopyLogButton } from "./copy-log-button"

export const metadata: Metadata = {
  title: "Log Printer",
}

type LogRow = {
  id: number
  created_at: string
  logged_at: string | null
  session_id: string
  level: string
  message: string
  data: string | null
  client: string | null
}

const LIMIT = 500

const LEVEL_STYLE: Record<string, string> = {
  error: "bg-red-100 text-red-700",
  warn: "bg-amber-100 text-amber-700",
  info: "bg-sky-50 text-sky-700",
  debug: "bg-muted text-muted-foreground",
}

function formatTime(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// Log proses cetak user ini di outlet aktif (lib/printer/logger.ts), dikelompokkan
// per sesi halaman. ?level=error untuk error saja.
export default async function PrinterLogPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>
}) {
  const { user, activeOutlet } = await getActiveOutlet()
  const { level } = await searchParams
  const onlyErrors = level === "error"

  const rows = await query<LogRow>(
    `SELECT id, created_at, logged_at, session_id, level, message, data, client
     FROM printer_logs
     WHERE user_id = ? AND outlet_id = ? ${onlyErrors ? "AND level = 'error'" : ""}
     ORDER BY id DESC
     LIMIT ${LIMIT}`,
    [user.id, activeOutlet.id]
  )

  // Kelompokkan per sesi (urutan sesi terbaru dulu, isi sesi kronologis).
  const sessions = new Map<string, LogRow[]>()
  for (const row of rows) {
    const list = sessions.get(row.session_id) ?? []
    list.unshift(row)
    sessions.set(row.session_id, list)
  }

  const asText = (list: LogRow[]) =>
    list
      .map(
        (r) =>
          `${r.logged_at ?? r.created_at} ${r.level.toUpperCase()} ${r.message}${r.data ? ` ${r.data}` : ""}`
      )
      .join("\n")

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Log Printer</h1>
          <p className="text-sm text-muted-foreground">
            Catatan proses cetak dari perangkat ini dan perangkat lain dengan akun yang sama
            ({LIMIT} baris terakhir, disimpan 30 hari).
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <a
            href="/kasir/pengaturan/printer/log"
            className={cn("rounded-full border px-3 py-1", !onlyErrors && "bg-primary text-primary-foreground")}
          >
            Semua
          </a>
          <a
            href="/kasir/pengaturan/printer/log?level=error"
            className={cn("rounded-full border px-3 py-1", onlyErrors && "bg-primary text-primary-foreground")}
          >
            Error saja
          </a>
          <a href="/kasir/pengaturan/printer" className="rounded-full border px-3 py-1">
            Kembali
          </a>
        </div>
      </div>

      {sessions.size === 0 && (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Belum ada log. Coba sambungkan atau cetak ke printer, lalu buka halaman ini lagi.
        </div>
      )}

      {[...sessions.entries()].map(([sessionId, list]) => (
        <section key={sessionId} className="min-w-0 rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
            <div className="min-w-0">
              <div className="font-medium">
                Sesi {formatTime(list[0].logged_at ?? list[0].created_at)}
                {list.some((r) => r.level === "error") && (
                  <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-red-700">ada error</span>
                )}
              </div>
              <div className="truncate text-muted-foreground">{list[0].client ?? "-"}</div>
            </div>
            <CopyLogButton text={asText(list)} />
          </div>
          <ol className="divide-y font-mono text-xs">
            {list.map((row) => (
              <li key={row.id} className="flex gap-2 px-3 py-1.5">
                <span className="shrink-0 text-muted-foreground">
                  {formatTime(row.logged_at ?? row.created_at)}
                </span>
                <span className={cn("h-fit shrink-0 rounded px-1", LEVEL_STYLE[row.level] ?? LEVEL_STYLE.info)}>
                  {row.level}
                </span>
                <span className="min-w-0 break-words">
                  {row.message}
                  {row.data && <span className="block break-all text-muted-foreground">{row.data}</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
