/*
 * Log proses cetak (USB / Bluetooth). Dipakai di lib/printer/* dan
 * components/printer/* menggantikan console.*: tetap menulis ke console,
 * dan juga dikirim berkala ke POST /api/printer-logs (tabel printer_logs)
 * supaya error di HP/APK kasir bisa ditelusuri dari server atau dari
 * halaman Pengaturan > Printer > Log. Hanya berjalan di browser.
 */

type Level = "debug" | "info" | "warn" | "error"

type Entry = {
  ts: string
  level: Level
  message: string
  data?: string
}

const MAX_BATCH = 50
const MAX_BUFFER = 500
const MAX_DATA = 4000
const FLUSH_DELAY_MS = 1500

let sessionId: string | null = null
let buffer: Entry[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let installed = false

function getSessionId() {
  if (!sessionId) {
    sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  return sessionId
}

// Error, DOMException (WebUSB/Web Bluetooth) dan objek biasa jadi teks.
function serialize(value: unknown): string {
  if (value instanceof Error) {
    return JSON.stringify({ name: value.name, message: value.message, stack: value.stack })
  }
  if (typeof value === "string") return value
  if (typeof DataView !== "undefined" && (value instanceof DataView || ArrayBuffer.isView(value))) {
    return `<${value.constructor.name} ${(value as ArrayBufferView).byteLength} bytes>`
  }
  try {
    const seen = new WeakSet()
    return JSON.stringify(value, (_key, v) => {
      if (v instanceof Error) return { name: v.name, message: v.message }
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[circular]"
        seen.add(v)
      }
      if (typeof v === "bigint") return v.toString()
      return v
    })
  } catch {
    return String(value)
  }
}

// APK (TWA) membuka situs dengan referrer android-app://<package>, tapi
// hanya di halaman pertama; tandanya disimpan untuk halaman berikutnya.
function openedFromApk() {
  try {
    if (document.referrer.startsWith("android-app://")) {
      sessionStorage.setItem("pb_twa", "1")
    }
    return sessionStorage.getItem("pb_twa") === "1"
  } catch {
    return document.referrer.startsWith("android-app://")
  }
}

// Info perangkat: dikirim sekali per sesi sebagai entri pertama.
function environment() {
  const nav = navigator as Navigator & { bluetooth?: unknown; usb?: unknown }
  const standalone =
    typeof matchMedia !== "undefined" && matchMedia("(display-mode: standalone)").matches
  return {
    userAgent: navigator.userAgent,
    twa: openedFromApk(),
    referrer: document.referrer || null,
    standalone,
    secureContext: window.isSecureContext,
    webBluetooth: Boolean(nav.bluetooth),
    webUsb: Boolean(nav.usb),
    url: location.pathname,
  }
}

function install() {
  if (installed || typeof window === "undefined") return
  installed = true

  push("info", "[Logger] sesi dimulai", [environment()])

  // Error yang tidak tertangkap di halaman printer/kasir juga dicatat.
  window.addEventListener("error", (event) => {
    push("error", `[window] ${event.message}`, [event.error ?? { file: event.filename, line: event.lineno }])
  })
  window.addEventListener("unhandledrejection", (event) => {
    push("error", "[window] unhandledrejection", [event.reason])
  })
  // Kirim sisa log saat halaman ditutup / app di-background.
  window.addEventListener("pagehide", () => flush(true))
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true)
  })
}

function push(level: Level, first: unknown, rest: unknown[]) {
  const message = (typeof first === "string" ? first : serialize(first)).slice(0, 1000)
  const data = rest.length ? rest.map(serialize).join(" ").slice(0, MAX_DATA) : undefined

  buffer.push({ ts: new Date().toISOString(), level, message, data })
  if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER)

  if (level === "error") {
    flush()
  } else if (!timer) {
    timer = setTimeout(() => flush(), FLUSH_DELAY_MS)
  }
}

function flush(unloading = false) {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!buffer.length || typeof window === "undefined") return

  while (buffer.length) {
    const batch = buffer.splice(0, MAX_BATCH)
    const body = JSON.stringify({ sessionId: getSessionId(), entries: batch })

    if (unloading && navigator.sendBeacon) {
      navigator.sendBeacon("/api/printer-logs", new Blob([body], { type: "application/json" }))
      continue
    }

    fetch("/api/printer-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Offline: kembalikan ke antrean, dicoba lagi pada log berikutnya.
      buffer = [...batch, ...buffer].slice(-MAX_BUFFER)
    })
  }
}

function logger(level: Level, consoleFn: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    consoleFn(...args)
    if (typeof window === "undefined") return
    install()
    push(level, args[0], args.slice(1))
  }
}

export const plog = {
  debug: logger("debug", console.debug.bind(console)),
  log: logger("info", console.log.bind(console)),
  info: logger("info", console.info.bind(console)),
  warn: logger("warn", console.warn.bind(console)),
  error: logger("error", console.error.bind(console)),
  /** Kirim log yang masih di antrean sekarang (mis. sebelum pindah halaman). */
  flush: () => flush(),
  sessionId: () => getSessionId(),
}
