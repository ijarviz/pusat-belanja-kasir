import { encodeCode128B } from "@/lib/barcode/code128"

type ShippingLabelProps = {
  trx: any
}

// Barcode Code128 asli (scannable) dari nomor AWB, dirender sebagai SVG penuh
// lebar. Tanpa dependensi eksternal supaya aman saat dicetak via Puppeteer.
// viewBox memakai satuan modul sehingga barcode otomatis melar ke full width
// kontainer; bila AWB memuat karakter di luar Code Set B, fallback ke teks.
function Barcode({ value }: { value: string }) {
  const widths = encodeCode128B(value)

  if (!widths) {
    return (
      <div className="font-mono font-bold text-base tracking-widest h-10 flex items-center justify-center">
        {value}
      </div>
    )
  }

  // Quiet zone (margin putih) wajib agar scanner bisa membaca; spec Code128
  // minimal 10 modul di kiri & kanan.
  const QUIET = 10
  const barsTotal = widths.reduce((sum, w) => sum + w, 0)
  const total = barsTotal + QUIET * 2

  // Gambar bar gelap saja (elemen index genap = gelap, diawali bar gelap).
  let x = QUIET
  const rects = widths.map((w, i) => {
    const rx = x
    x += w
    if (i % 2 !== 0) return null // index ganjil = spasi (terang)
    return <rect key={i} x={rx} y={0} width={w} height={100} fill="#000" />
  })

  return (
    <svg
      className="w-full h-10"
      viewBox={`0 0 ${total} 100`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects}
    </svg>
  )
}

export default function ShippingLabel({
  trx,
}: ShippingLabelProps) {
  return (
    <div
      className="
        w-[100mm]
        h-[150mm]
        bg-white
        text-black
        p-3
        text-sm
      "
    >
      {/* HEADER */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="border h-16 flex items-center justify-center font-bold">
          {trx.shipping_courier}
        </div>

        <div className="border h-16 flex items-center justify-center font-bold">
          {trx.outlet_name}
        </div>
      </div>

      {/* AWB / RESI */}
      <div className="border p-2 mb-3 text-center">
        <div className="text-[10px] text-gray-600 uppercase tracking-wide">
          {trx.shipping_service || "No. Resi"}
        </div>
        {trx.awb ? (
          <>
            <Barcode value={trx.awb} />
            <div className="font-mono font-bold text-base tracking-widest mt-1">
              {trx.awb}
            </div>
          </>
        ) : (
          <div className="font-bold text-base text-red-600 py-3">
            RESI BELUM TERBIT
          </div>
        )}
      </div>

      {/* PAYMENT */}
      <div className="border p-2 mb-3 flex justify-between">
        <div className="font-bold text-lg">
          NON COD
        </div>

        <div>
          Rp{" "}
          {Number(
            trx.shipping_cost || 0
          ).toLocaleString("id-ID")}
        </div>
      </div>

      {/* RECEIVER */}
      <div className="border p-2 mb-3">
        <div className="font-bold mb-2">
          PENERIMA
        </div>

        <div className="font-bold text-xl">
          {trx.buyer_name}
        </div>

        <div>
          {trx.buyer_phone}
        </div>

        <div className="mt-2">
          {trx.buyer_address}
        </div>
      </div>

      {/* SENDER */}
      <div className="border p-2 mb-3">
        <div className="font-bold mb-2">
          PENGIRIM
        </div>

        <div className="font-semibold">
          {trx.outlet_name}
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="border p-2">
        <div className="font-bold mb-2">
          PRODUK
        </div>

        <div className="text-[11px] space-y-1">
          {(trx.products || []).map(
            (
              item: any,
              index: number
            ) => (
              <div key={index}>
                • {item.name}

                {(item.variantName ||
                  item.snapshot
                    ?.variantName) &&
                  ` (${
                    item.variantName ||
                    item.snapshot
                      ?.variantName
                  })`}

                {" × "}
                {item.qty}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}