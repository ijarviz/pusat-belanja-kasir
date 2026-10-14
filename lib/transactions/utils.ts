// export function formatRupiah(value: number) {
//   return new Intl.NumberFormat("id-ID", {
//     style: "currency",
//     currency: "IDR",
//   }).format(value)
// }

export function getTotalItems(
  products: { qty: number }[]
) {
  return products.reduce((acc, item) => acc + item.qty, 0)
}

// Label metode pembayaran yang ramah dibaca.
//
// `payment_type` adalah channel asli dari Midtrans yang direkonsiliasi setelah
// bayar (mis. "bank_transfer", "gopay", "qris"). `payment_method` adalah pilihan
// awal saat checkout. Kita utamakan payment_type karena itu yang benar-benar
// dipakai pembeli; kalau belum ada, jatuh ke payment_method.
const PAYMENT_LABELS: Record<string, string> = {
  qris: "QRIS",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  bank_transfer: "Transfer Bank / VA",
  echannel: "Mandiri Bill",
  cstore: "Gerai Retail",
  credit_card: "Kartu Kredit",
}

export function formatPaymentMethod(
  paymentType?: string | null,
  paymentMethod?: string | null
): string {
  const raw = paymentType || paymentMethod
  if (!raw) return "-"

  if (PAYMENT_LABELS[raw]) return PAYMENT_LABELS[raw]

  // Nilai tak dikenal: ubah "va-bca" / "some_channel" jadi "Va Bca" / "Some Channel".
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}