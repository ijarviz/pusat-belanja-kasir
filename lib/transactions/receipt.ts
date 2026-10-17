export type ReceiptProduct = {
  qty: number
  name: string
  price: number
  variantName?: string | null
  productId?: string
  variantId?: string
}

export type ReceiptData = {
  transactionId: string
  invoice: string | null

  outletName: string
  outletAddress: string | null
  // outlets.url (mis. https://sunnozy.id) untuk ajakan belanja online.
  outletUrl?: string | null

  orderDate: string

  buyerName: string | null
  cashierName: string | null

  paymentMethod: string | null

  products: ReceiptProduct[]

  subtotal: number
  discount: number
  shippingCost: number
  adminFee: number
  total: number
}

export function formatReceiptPaymentMethod(
  value: string | null
) {
  if (!value) {
    return "-"
  }

  const map: Record<string, string> = {
    cash: "Tunai",
    transfer: "Transfer",
    qris: "QRIS",
    debit: "Debit",
    credit: "Kartu Kredit",
  }

  return map[value] ?? value
}

/*
 * Teks penutup struk (cetak ESC/POS, /order/[id], dan /invoice di store):
 * "Terima kasih telah berbelanja di Sunnozy. Belanja online produk
 * lainnya di www.sunnozy.id".
 */
export function receiptFooterText(
  outletName: string,
  outletUrl?: string | null
) {
  const thanks = `Terima kasih telah berbelanja di ${outletName}.`
  const site = displaySite(outletUrl)

  return site
    ? `${thanks} Belanja online produk lainnya di ${site}`
    : thanks
}

// https://sunnozy.id/ -> www.sunnozy.id
function displaySite(url?: string | null) {
  if (!url) return null
  try {
    const host = new URL(url.includes("://") ? url : `https://${url}`).hostname
    return host.startsWith("www.") ? host : `www.${host}`
  } catch {
    return null
  }
}

export function createReceiptData(
  data: {
    id: string
    invoice?: string | null

    outletName: string
    outletAddress?: string | null

    orderDate: string

    buyerName?: string | null
    cashierName?: string | null

    paymentMethod?: string | null

    products?: ReceiptProduct[] | null

    subtotal?: number | string | null
    discount?: number | string | null
    shippingCost?: number | string | null
    adminFee?: number | string | null
    total?: number | string | null
  }
): ReceiptData {
  return {
    transactionId:
      data.id,

    invoice:
      data.invoice ?? null,

    outletName:
      data.outletName,

    outletAddress:
      data.outletAddress ?? null,

    orderDate:
      data.orderDate,

    buyerName:
      data.buyerName ?? null,

    cashierName:
      data.cashierName ?? null,

    paymentMethod:
      data.paymentMethod ?? null,

    products:
      Array.isArray(data.products)
        ? data.products
        : [],

    subtotal:
      Number(
        data.subtotal ?? 0
      ),

    discount:
      Number(
        data.discount ?? 0
      ),

    shippingCost:
      Number(
        data.shippingCost ?? 0
      ),

    adminFee:
      Number(
        data.adminFee ?? 0
      ),

    total:
      Number(
        data.total ?? 0
      ),
  }
}