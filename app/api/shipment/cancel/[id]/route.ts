export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"

// Batalkan / void pengiriman (AWB) untuk satu transaksi.
//
// API key shipment-service WAJIB tetap di server — route handler ini jadi proxy:
// baca shipping_ref1 (referensi AutoKirim yang disimpan saat buat AWB), panggil
// shipment-service POST /api/v1/shipment/cancel, lalu tandai transaksi cancelled.
//
// Hanya dipakai dari dashboard admin (gudang-import), bukan storefront.

type TrxRow = {
  id: string
  awb: string | null
  shipping_ref1: number | null
  status: string | null
}

function shipmentConfig() {
  const baseUrl = process.env.SHIPMENT_SERVICE_URL
  const apiKey = process.env.SHIPMENT_API_KEY

  if (!baseUrl || !apiKey) {
    throw new Error("SHIPMENT_SERVICE_URL / SHIPMENT_API_KEY belum diset di env")
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()

  const { data: trx, error } = await supabase
    .from("transactions")
    .select("id, awb, shipping_ref1, status")
    .eq("id", id)
    .single<TrxRow>()

  if (error || !trx) {
    return Response.json(
      { success: false, message: "Transaksi tidak ditemukan" },
      { status: 404 }
    )
  }

  // Tidak ada AWB → tidak ada yang perlu dibatalkan di AutoKirim. Idempoten:
  // langsung tandai cancelled saja.
  if (!trx.awb && !trx.shipping_ref1) {
    return Response.json(
      { success: false, message: "Transaksi belum punya pengiriman (AWB)" },
      { status: 422 }
    )
  }

  if (!trx.shipping_ref1) {
    return Response.json(
      {
        success: false,
        message: "Referensi pengiriman (reff_1) tidak tersedia untuk dibatalkan",
      },
      { status: 422 }
    )
  }

  // Panggil shipment-service untuk void AWB di AutoKirim.
  let result: { baseUrl: string; apiKey: string }
  try {
    result = shipmentConfig()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Konfigurasi shipment tidak lengkap"
    return Response.json({ success: false, message }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch(`${result.baseUrl}/api/v1/shipment/cancel`, {
      method: "POST",
      headers: {
        "X-API-KEY": result.apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ reff_1: trx.shipping_ref1 }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menghubungi shipment-service"
    return Response.json({ success: false, message }, { status: 502 })
  }

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    // 400 = validasi, 422 = AutoKirim menolak (rc != "00"), 502 = transport.
    const message =
      json?.errors?.message ||
      json?.message ||
      `pembatalan pengiriman gagal (${res.status})`
    return Response.json({ success: false, message }, { status: res.status || 502 })
  }

  // Sukses void → bersihkan AWB & referensi, tandai cancelled. Simpan agar tidak
  // bisa dibatalkan/cetak ulang dan supaya status konsisten dengan AutoKirim.
  const { error: updateErr } = await supabase
    .from("transactions")
    .update({
      status: "cancelled",
      awb: null,
      shipping_ref1: null,
      shipping_ref2: null,
      shipping_ref3: null,
      shipping_order_status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (updateErr) {
    // AWB sudah dibatalkan di AutoKirim tapi gagal disimpan — log keras agar bisa
    // direkonsiliasi manual (jangan batalkan ulang).
    console.error(
      `cancelShipment: AWB trx ${id} dibatalkan tapi gagal update Supabase:`,
      updateErr.message
    )
    return Response.json(
      { success: false, message: "Pengiriman dibatalkan tapi gagal disimpan" },
      { status: 500 }
    )
  }

  return Response.json({ success: true, message: "Pengiriman dibatalkan" })
}
