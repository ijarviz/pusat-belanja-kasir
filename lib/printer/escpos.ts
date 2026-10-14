import type {
  ReceiptData,
} from "@/lib/transactions/receipt"

const encoder = new TextEncoder()

// Printer thermal 80mm umumnya sekitar 48 karakter
// pada font ESC/POS default.
const LINE_WIDTH = 48

function rupiah(amount: number) {
  return `Rp ${Math.round(amount)
    .toString()
    .replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "."
    )}`
}

function formatPaymentMethod(
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

function formatDate(value: string) {
  const date = new Date(value)

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ]

  return `${String(
    date.getDate()
  ).padStart(2, "0")} ${
    months[date.getMonth()]
  } ${date.getFullYear()} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`
}

function wrapText(
  text: string,
  width = LINE_WIDTH
) {
  const words = text.split(/\s+/)

  const lines: string[] = []

  let current = ""

  for (const word of words) {
    if (!current) {
      current = word
      continue
    }

    const next =
      `${current} ${word}`

    if (next.length <= width) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines
}

function text(value: string) {
  return encoder.encode(
    `${value}\n`
  )
}

function center(value: string) {
  return [
    0x1b,
    0x61,
    0x01,

    ...encoder.encode(
      `${value}\n`
    ),

    0x1b,
    0x61,
    0x00,
  ]
}

function divider() {
  return text(
    "-".repeat(LINE_WIDTH)
  )
}

function row(
  left: string,
  right: string
) {
  const available =
    LINE_WIDTH -
    left.length -
    right.length

  if (available >= 1) {
    return text(
      left +
        " ".repeat(available) +
        right
    )
  }

  return text(
    `${left} ${right}`
  )
}

/**
 * Convert gambar logo menjadi ESC/POS raster bitmap.
 *
 * width maksimal 384px cocok untuk printer
 * thermal 80mm dengan resolusi 203dpi.
 */
async function imageToEscPos(
  imageUrl: string,
  maxWidth = 384
) {
  const response =
    await fetch(imageUrl)

  if (!response.ok) {
    throw new Error(
      "Gagal mengambil logo outlet."
    )
  }

  const blob =
    await response.blob()

  const bitmap =
    await createImageBitmap(blob)

  const scale =
    Math.min(
      1,
      maxWidth / bitmap.width
    )

  const width =
    Math.floor(
      bitmap.width * scale
    )

  const height =
    Math.floor(
      bitmap.height * scale
    )

  const canvas =
    document.createElement(
      "canvas"
    )

  canvas.width = width
  canvas.height = height

  const ctx =
    canvas.getContext("2d", {
      willReadFrequently: true,
    })

  if (!ctx) {
    throw new Error(
      "Canvas tidak tersedia."
    )
  }

  ctx.drawImage(
    bitmap,
    0,
    0,
    width,
    height
  )

  const imageData =
    ctx.getImageData(
      0,
      0,
      width,
      height
    )

  const pixels =
    imageData.data

  /**
   * =====================================
   * GRAYSCALE + CONTRAST
   * =====================================
   *
   * Kita convert logo ke grayscale dulu.
   *
   * Ini lebih cocok untuk printer thermal
   * daripada langsung menggunakan RGB.
   */

  const gray =
    new Float32Array(
      width * height
    )

  for (
    let y = 0;
    y < height;
    y++
  ) {
    for (
      let x = 0;
      x < width;
      x++
    ) {
      const index =
        (y * width + x) * 4

      const r =
        pixels[index]

      const g =
        pixels[index + 1]

      const b =
        pixels[index + 2]

      const a =
        pixels[index + 3]

      /**
       * Background transparan
       * dianggap putih.
       */
      if (a < 20) {
        gray[
          y * width + x
        ] = 255

        continue
      }

      /**
       * Standard luminance.
       */
      let value =
        0.299 * r +
        0.587 * g +
        0.114 * b

      /**
       * Sedikit contrast enhancement.
       */
      value =
        ((value - 128) * 1.15) +
        128

      value =
        Math.max(
          0,
          Math.min(
            255,
            value
          )
        )

      gray[
        y * width + x
      ] = value
    }
  }

  /**
   * =====================================
   * FLOYD-STEINBERG DITHERING
   * =====================================
   *
   * Membantu detail kecil seperti
   * huruf di tengah logo tetap terbaca
   * setelah menjadi hitam/putih.
   */

  for (
    let y = 0;
    y < height;
    y++
  ) {
    for (
      let x = 0;
      x < width;
      x++
    ) {
      const index =
        y * width + x

      const oldValue =
        gray[index]

      const newValue =
        oldValue < 128
          ? 0
          : 255

      const error =
        oldValue - newValue

      gray[index] =
        newValue

      if (
        x + 1 <
        width
      ) {
        gray[
          index + 1
        ] +=
          error * 7 / 16
      }

      if (
        x > 0 &&
        y + 1 <
          height
      ) {
        gray[
          index +
          width -
          1
        ] +=
          error * 3 / 16
      }

      if (
        y + 1 <
        height
      ) {
        gray[
          index + width
        ] +=
          error * 5 / 16
      }

      if (
        x + 1 <
          width &&
        y + 1 <
          height
      ) {
        gray[
          index +
          width +
          1
        ] +=
          error * 1 / 16
      }
    }
  }

  const bytes: number[] = []

  const bytesPerRow =
    Math.ceil(
      width / 8
    )

  /**
   * Center
   */
  bytes.push(
    0x1b,
    0x61,
    0x01
  )

  /**
   * Raster bitmap
   *
   * GS v 0
   */
  bytes.push(
    0x1d,
    0x76,
    0x30,
    0x00,

    bytesPerRow & 0xff,
    (bytesPerRow >> 8) & 0xff,

    height & 0xff,
    (height >> 8) & 0xff
  )

  for (
    let y = 0;
    y < height;
    y++
  ) {
    for (
      let xByte = 0;
      xByte < bytesPerRow;
      xByte++
    ) {
      let byte = 0

      for (
        let bit = 0;
        bit < 8;
        bit++
      ) {
        const x =
          xByte * 8 + bit

        if (
          x >= width
        ) {
          continue
        }

        const value =
          gray[
            y * width + x
          ]

        /**
         * Hitam = 1
         * Putih = 0
         */
        if (
          value < 128
        ) {
          byte |=
            0x80 >> bit
        }
      }

      bytes.push(byte)
    }
  }

  /**
   * Kembali ke align kiri.
   */
  bytes.push(
    0x1b,
    0x61,
    0x00
  )

  return bytes
}

function productLines(
  product: ReceiptData["products"][number]
) {
  const bytes: number[] = []

  for (
    const line of wrapText(
      product.name
    )
  ) {
    bytes.push(
      ...text(line)
    )
  }

  if (product.variantName) {
    for (
      const line of wrapText(
        product.variantName
      )
    ) {
      bytes.push(
        ...text(line)
      )
    }
  }

  const subtotal =
    Number(product.price) *
    Number(product.qty)

  bytes.push(
    ...row(
      `${product.qty} x ${rupiah(
        product.price
      )}`,
      rupiah(subtotal)
    )
  )

  bytes.push(
    ...text("")
  )

  return bytes
}

export async function buildKasirReceipt(
  data: ReceiptData,
  logoUrl?: string | null
) {
  const bytes: number[] = []

  // =====================================
  // INITIALIZE
  // =====================================

  bytes.push(
    0x1b,
    0x40
  )

  // =====================================
  // LOGO
  // =====================================

  if (logoUrl) {
    try {
      bytes.push(
        ...await imageToEscPos(
          logoUrl,
          384
        )
      )

      bytes.push(
        ...text("")
      )
    } catch (error) {
      console.error(
        "[ESC/POS] Gagal print logo:",
        error
      )
    }
  }

  // =====================================
  // HEADER
  // =====================================

  // Nama outlet:

  // bytes.push(
  //   ...center(
  //     data.outletName
  //   )
  // )

  // Jarak antara nama outlet
  // dengan alamat
  bytes.push(
    ...text("")
  )

  if (data.outletAddress) {
    const addressLines =
      data.outletAddress
        .split("\n")
        .filter(Boolean)

    for (
      const address of addressLines
    ) {
      for (
        const line of wrapText(
          address
        )
      ) {
        bytes.push(
          ...center(line)
        )
      }
    }
  }

  // =====================================
  // TRANSACTION INFO
  // =====================================

  bytes.push(
    ...divider()
  )

  bytes.push(
    ...row(
      "Tanggal",
      formatDate(
        data.orderDate
      )
    )
  )

  bytes.push(
    ...row(
      "Pembeli",
      data.buyerName?.trim() ||
        "-"
    )
  )

  bytes.push(
    ...row(
      "Kasir",
      data.cashierName?.trim() ||
        "-"
    )
  )

  // =====================================
  // PRODUCTS
  // =====================================

  bytes.push(
    ...divider()
  )

  for (
    const product of data.products
  ) {
    bytes.push(
      ...productLines(
        product
      )
    )
  }

  // =====================================
  // SUMMARY
  // =====================================

  bytes.push(
    ...divider()
  )

  bytes.push(
    ...row(
      "Subtotal",
      rupiah(
        data.subtotal
      )
    )
  )

  if (
    data.discount > 0
  ) {
    bytes.push(
      ...row(
        "Diskon",
        `-${rupiah(
          data.discount
        )}`
      )
    )
  }

  if (
    data.shippingCost > 0
  ) {
    bytes.push(
      ...row(
        "Pengiriman",
        rupiah(
          data.shippingCost
        )
      )
    )
  }

  if (
    data.adminFee > 0
  ) {
    bytes.push(
      ...row(
        "Biaya Admin",
        rupiah(
          data.adminFee
        )
      )
    )
  }

  // =====================================
  // TOTAL
  // =====================================

  bytes.push(
    ...divider()
  )

  bytes.push(
    0x1b,
    0x45,
    0x01
  )

  bytes.push(
    ...row(
      "Total Bayar",
      rupiah(
        data.total
      )
    )
  )

  bytes.push(
    0x1b,
    0x45,
    0x00
  )

  bytes.push(
    ...row(
      "Pembayaran",
      formatPaymentMethod(
        data.paymentMethod
      )
    )
  )

  // =====================================
  // FOOTER
  // =====================================

  bytes.push(
    ...divider()
  )

  bytes.push(
    ...center(
      `Terima kasih telah berbelanja di ${data.outletName}`
    )
  )

  // =====================================
  // FEED + CUT
  // =====================================

  bytes.push(
    0x1b,
    0x64,
    0x08
  )

  bytes.push(
    0x1d,
    0x56,
    0x00
  )

  return new Uint8Array(
    bytes
  )
}