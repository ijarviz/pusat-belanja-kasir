"use client"

import { useLayoutEffect, useRef, useState } from "react"

import type { LabelRow } from "@/lib/transactions/queries"

import { LabelGeneric } from "./label-generic"
import { LabelJnt } from "./label-jnt"

// Format cetak autolaris-app: satu label per halaman A4 (margin 8mm). Label
// diperkecil (tidak pernah diperbesar) supaya muat satu halaman; route PDF
// menunggu data-print-ready="true" sebelum page.pdf(). Barcode dirender di
// server, jadi pengukuran di layout effect sudah final.
function LabelPage({ children, onMeasured }: { children: React.ReactNode; onMeasured: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    setScale(Math.min(1, container.clientHeight / content.scrollHeight))
    onMeasured()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={containerRef} className="label-page-frame">
      <div ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  )
}

export function PrintLabels({ rows }: { rows: LabelRow[] }) {
  const measured = useRef(0)
  const [ready, setReady] = useState(rows.length === 0)

  function handleMeasured() {
    measured.current += 1
    if (measured.current >= rows.length) setReady(true)
  }

  return (
    <div data-print-ready={ready ? "true" : "false"} className="bg-white">
      <style>{`
        @page { size: A4; margin: 8mm; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .label-page-frame {
          width: 100%;
          height: 281mm;
          overflow: hidden;
          position: relative;
          break-after: page;
        }
        .label-page-frame:last-child { break-after: auto; }
      `}</style>

      {rows.map((row) => (
        <LabelPage key={row.id} onMeasured={handleMeasured}>
          {row.courierCode === "jnt" ? (
            <LabelJnt row={row} />
          ) : (
            <LabelGeneric row={row} variant={rows.length === 1 ? "single" : "bulk"} />
          )}
        </LabelPage>
      ))}
    </div>
  )
}
