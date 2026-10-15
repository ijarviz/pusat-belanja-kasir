/* eslint-disable @next/next/no-img-element */
import type { LabelRow } from "@/lib/transactions/queries"
import { formatCurrency } from "@/lib/utils/format-currency"

import { Barcode } from "./barcode"
import { OutletLogo } from "./outlet-logo"
import { BLACK_CELL, maskPhone } from "./utils"

// Port label-jnt.tsx autolaris-app (cabang J&T cetak/multiplex.php): format
// label J&T dengan blok kecamatan, tabel biaya, footer J&T, dan potongan
// "LEMBAR PENGIRIM". Logo Autolaris diganti logo outlet. Order web NON COD.
export function LabelJnt({ row }: { row: LabelRow }) {
  const qty = row.items.reduce((sum, item) => sum + item.qty, 0)
  const products = row.items
    .map((item) => [item.name, item.variant].filter(Boolean).join(" - "))
    .join(", ")
  const fullAddress = [row.receiverAddress, row.district, row.regency].filter(Boolean).join(" ")
  const logo = row.courierLogo ? (
    <img src={row.courierLogo} alt={row.courierName} className="h-8 w-auto object-contain" />
  ) : (
    <span className="font-bold">{row.courierName}</span>
  )

  return (
    <div className="border-2 border-black bg-white font-sans text-base text-black">
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="w-[45%] border-l-2 border-t-2 border-black p-2">
              <OutletLogo src={row.outletLogo} name={row.outletName} />
            </td>
            <td className="w-[45%] border-t-2 border-black p-2 text-left">{logo}</td>
            <td
              className="w-[10%] border-r-2 border-t-2 border-black bg-black p-2 text-center text-2xl font-black text-white"
              style={BLACK_CELL}
            >
              {row.service}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="border-x-2 border-t-2 border-black p-3">
              <Barcode value={row.awb} height={72} />
            </td>
          </tr>
          <tr>
            <td className="border-x-2 border-black p-1 text-center text-2xl font-bold">
              {row.awb.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td
              className="border-x-2 border-black bg-black p-1 text-center text-lg font-bold text-white"
              style={BLACK_CELL}
            >
              KEC. {row.district.toUpperCase()}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border-l-2 border-t-2 border-black p-2">Penerima: {row.receiverName}</td>
            <td className="border-r-2 border-t-2 border-black p-2 text-right">
              {maskPhone(row.receiverPhone)}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="border-x-2 border-black p-2">
              Alamat Lengkap: {fullAddress}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border-l-2 border-t-2 border-black p-2">Pengirim: {row.senderName}</td>
            <td className="border-t-2 border-black p-2 text-right">{maskPhone(row.senderPhone)}</td>
            <td
              className="w-2 border-x-2 border-t-2 border-black bg-black p-2 text-center align-middle text-2xl font-black text-white"
              style={BLACK_CELL}
            >
              NON COD
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-center text-sm">
        <tbody>
          <tr>
            <td className="border-l-2 border-t-2 border-black bg-black p-1 font-bold text-white" style={BLACK_CELL}>
              BIAYA PENGIRIMAN
            </td>
            <td rowSpan={3} className="border-l-2 border-t-2 border-black p-1 font-bold">
              BULANAN
            </td>
            <td rowSpan={3} className="border-l-2 border-t-2 border-black p-1 font-bold">
              {(row.weight / 1000).toFixed(1)} Kg
            </td>
            <td rowSpan={3} className="border-x-2 border-t-2 border-black p-1 font-bold">
              Order No.
              <br />
              {row.invoice}
            </td>
          </tr>
          <tr>
            <td className="border-l-2 border-black p-1 font-bold">{formatCurrency(row.shippingCost)}</td>
          </tr>
          <tr>
            <td className="border-l-2 border-black p-1">Sudah Termasuk PPN</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border-l-2 border-t-2 border-black p-2 font-bold">Notes: {row.note}</td>
            <td rowSpan={3} className="w-[16%] border-r-2 border-t-2 border-black px-2">
              <img src="/assets/images/ekspedisi/jet.png" alt="J&T" width={80} height={80} />
            </td>
          </tr>
          <tr>
            <td className="border-l-2 border-black px-2 font-bold">
              Syarat dan ketentuan pengiriman di www.jet.co.id
            </td>
          </tr>
          <tr>
            <td className="border-l-2 border-black px-2 text-xs">
              PT. GLOBAL JET EXPRESS
              <br />
              LANMARK PLUIT TOWER BLOK B1, LANTAI 8, 9A. 10A,
              <br />
              JL. PLUIT SELATAN RAYA, PENJARINGAN, JAKARTA UTARA, DKI JAKARTA
            </td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-5 border-t-2 border-dashed border-black">
        <div className="col-span-2 border-l-2 border-black p-2 pt-5">{logo}</div>
        <div className="col-span-3">
          <div className="border-r-2 border-black p-2 pt-5">
            <Barcode value={row.awb} height={52} />
          </div>
          <div className="border-r-2 border-black p-2 text-left text-sm font-bold">{row.awb}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border-x-2 border-t-2 border-black px-2">
              <strong>Pengirim:</strong> {row.senderName}
            </td>
          </tr>
          <tr>
            <td className="border-x-2 border-black px-2">
              <strong>Penerima:</strong> {row.receiverName}
            </td>
          </tr>
          <tr>
            <td className="border-x-2 border-black px-2">
              <strong>Alamat Lengkap</strong> {fullAddress}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="w-[30%] border-l-2 border-t-2 border-black p-2 text-center font-bold">TOTAL BIAYA</td>
            <td className="border-x-2 border-t-2 border-black p-2 font-bold">
              Qty: {qty}, Barang: {products}
            </td>
          </tr>
          <tr>
            <td className="border-l-2 border-black p-2 text-center font-bold">
              {formatCurrency(row.shippingCost)}
            </td>
            <td className="border-x-2 border-black p-2 font-bold">Notes: {row.note}</td>
          </tr>
          <tr>
            <td className="border-l-2 border-black p-2 text-center">Sudah Termasuk PPN</td>
            <td className="border-x-2 border-black p-2" />
          </tr>
          <tr>
            <td
              className="border-b-2 border-l-2 border-black bg-black p-2 text-center font-bold text-white"
              style={BLACK_CELL}
            >
              LEMBAR PENGIRIM
              <br />
              <span className="text-2xl">NON COD</span>
            </td>
            <td className="border-x-2 border-b-2 border-black p-2" />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
