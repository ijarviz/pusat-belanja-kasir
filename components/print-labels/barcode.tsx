import { encodeCode128B } from "@/lib/barcode/code128"

// Barcode Code128 AWB sebagai SVG penuh lebar, dirender di server (tanpa JS
// di Chromium). Karakter di luar Code Set B jatuh ke teks biasa.
export function Barcode({ value, height = 60 }: { value: string; height?: number }) {
  const widths = encodeCode128B(value)

  if (!widths) {
    return (
      <div className="flex items-center justify-center font-mono text-2xl font-bold tracking-widest" style={{ height }}>
        {value || "RESI BELUM TERBIT"}
      </div>
    )
  }

  // Quiet zone minimal 10 modul kiri & kanan supaya terbaca scanner.
  const QUIET = 10
  const total = widths.reduce((sum, w) => sum + w, 0) + QUIET * 2

  // Posisi x tiap modul = quiet zone + jumlah lebar sebelumnya.
  const offsets = widths.map((_, i) => QUIET + widths.slice(0, i).reduce((sum, w) => sum + w, 0))
  const rects = widths.map((w, i) =>
    i % 2 === 0 ? <rect key={i} x={offsets[i]} y={0} width={w} height={100} fill="#000" /> : null
  )

  return (
    <svg
      className="block w-full"
      style={{ height }}
      viewBox={`0 0 ${total} 100`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  )
}
