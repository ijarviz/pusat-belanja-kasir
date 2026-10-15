/* eslint-disable @next/next/no-img-element */
import type { LabelRow } from "@/lib/transactions/queries"
import { formatCurrency } from "@/lib/utils/format-currency"

import { Barcode } from "./barcode"
import { OutletLogo } from "./outlet-logo"
import { maskPhone, titleCase } from "./utils"

// Port label-generic.tsx autolaris-app (cetak/default.php & multiplex.php
// non-J&T): dipakai semua kurir selain J&T. Order web selalu NON COD.
export function LabelGeneric({ row, variant }: { row: LabelRow; variant: "single" | "bulk" }) {
  const area = [row.district, row.regency, row.province].filter(Boolean).join(", ")

  return (
    <div
      className="w-full border border-black bg-white p-3 font-medium text-black"
      style={{ fontSize: variant === "single" ? 11 : 16 }}
    >
      <div className="flex items-center justify-between border-b p-2">
        <OutletLogo src={row.outletLogo} name={row.outletName} />
        <span className="text-2xl font-bold">{row.outletName}</span>
      </div>

      <div className="flex justify-center px-2 pb-2 pt-4">
        <Barcode value={row.awb} height={62} />
      </div>

      <div className="flex justify-between border-b px-2 pb-4 text-xl">
        <span>{row.invoice}</span>
        <span>AWB:&nbsp;{row.awb.toUpperCase()}</span>
      </div>

      <div className="my-4 flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          {row.courierLogo && (
            <img src={row.courierLogo} alt={row.courierName} className="h-12 w-auto max-w-36 object-contain" />
          )}
          <span className="text-xl font-bold">
            {row.courierName} - {row.service}
          </span>
        </div>
        <div className="rounded border border-black px-5 py-1 text-3xl font-bold">NON COD</div>
      </div>

      <div className="mb-1 px-2">
        <div className="rounded border border-black p-4">
          <div className="text-xs">Penerima tidak perlu bayar apapun ke kurir.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-b p-2">
        <div>
          <div className="pb-1 text-lg">Penerima</div>
          <div className="mb-1 text-2xl font-bold">{row.receiverName}</div>
          <div className="text-lg">{maskPhone(row.receiverPhone)}</div>
          {area && <div className="text-lg">{area}</div>}
          <div className="text-lg">{row.receiverAddress}</div>
          {row.note && <div className="pt-1 text-lg">Catatan: {row.note}</div>}
        </div>
        <div className="border-t pt-2">
          <div className="text-lg">Pengirim</div>
          <div className="flex gap-1">
            <div className="text-lg font-bold">{row.senderName}</div>
            <div className="text-lg">{maskPhone(row.senderPhone)}</div>
          </div>
        </div>
      </div>

      <div className="border-b py-2 text-center text-lg">
        Harap melakukan video unboxing saat membuka paket
      </div>

      <div className="pt-2">
        {row.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1">
            <div>
              <div className="text-lg">{titleCase(item.name)}</div>
              {item.variant && <div className="text-lg">{item.variant}</div>}
            </div>
            <div className="text-lg">Qty: {item.qty}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 text-right text-sm">Ongkir: {formatCurrency(row.shippingCost)}</div>
    </div>
  )
}
