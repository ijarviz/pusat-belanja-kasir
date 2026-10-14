"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { Check, Loader2, MapPin, Search, X } from "lucide-react"

// Kecamatan Autolaris H2H (district_id = id_distrik, kode BPS).
export type Area = {
  district_id: string
  district_name: string
  regency_name: string
  province_name: string
}

// Nilai pickup yang tersimpan: hanya district_id + nama gabungan yang di-cache
// di outlet_pickup_point (pp_district_id / pp_district_name). Dipakai untuk
// menampilkan area terpilih tanpa perlu lookup ulang ke database.
export type PickupArea = {
  district_id: string
  district_name: string
}

function fullName(a: Area) {
  return `${a.district_name}, ${a.regency_name}, ${a.province_name}`
}

export default function AreaSearchSelect({
  value,
  onChange,
}: {
  value: PickupArea | null
  onChange: (area: PickupArea | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Area[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState({ left: 0, top: 0, width: 0 })
  const boxRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Dropdown dirender lewat portal dengan position:fixed agar lepas dari
  // overflow-hidden / stacking context Card. Posisinya disinkronkan ke input.
  function syncCoords() {
    const el = boxRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setCoords({ left: r.left, top: r.bottom + 4, width: r.width })
  }

  useLayoutEffect(() => {
    if (!open) return
    syncCoords()
    window.addEventListener("scroll", syncCoords, true)
    window.addEventListener("resize", syncCoords)
    return () => {
      window.removeEventListener("scroll", syncCoords, true)
      window.removeEventListener("resize", syncCoords)
    }
  }, [open])

  // Tutup dropdown saat klik di luar (input maupun dropdown portal).
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (boxRef.current?.contains(t) || dropdownRef.current?.contains(t)) {
        return
      }
      setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  // Debounced search ke route handler proxy.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/shipment/area?q=${encodeURIComponent(q)}&limit=15`,
          { signal: ctrl.signal }
        )
        const data = await res.json()
        setResults(data.areas ?? [])
      } catch {
        // abort / network — biarkan
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  function pick(area: Area) {
    onChange({ district_id: area.district_id, district_name: fullName(area) })
    setOpen(false)
    setQuery("")
    setResults([])
  }

  // Area sudah terpilih → tampilkan ringkas + tombol ganti.
  if (value && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border rounded-lg p-3 flex items-start gap-2 text-left hover:bg-muted/50"
      >
        <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <div className="flex-1">
          <div className="font-medium text-sm">{value.district_name}</div>
          <div className="text-xs text-muted-foreground">
            Kode area: {value.district_id}
          </div>
        </div>
        <span className="text-xs text-primary">Ganti</span>
      </button>
    )
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus={open}
          value={query}
          placeholder="Cari kecamatan / kota pickup…"
          className="pl-9"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Hapus area"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.top,
              width: coords.width,
            }}
            className="z-[100] bg-popover text-popover-foreground border rounded-lg shadow-lg max-h-72 overflow-auto"
          >
            {query.trim().length < 3 ? (
              <div className="p-3 text-sm text-muted-foreground">
                Ketik minimal 3 huruf nama kecamatan/kota.
              </div>
            ) : loading ? (
              <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Mencari…
              </div>
            ) : results.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                Area tidak ditemukan.
              </div>
            ) : (
              results.map((a) => {
                const selected = value?.district_id === a.district_id
                return (
                  <button
                    key={a.district_id}
                    type="button"
                    onClick={() => pick(a)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-start gap-2"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {a.district_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.regency_name}, {a.province_name}
                      </div>
                    </div>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                )
              })
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
