"use client"

import { plog } from "@/lib/printer/logger"

import {
  connectSavedUsbPrinter,
  disconnectUsbPrinter,
} from "@/lib/printer/usb"

import {
  connectSavedBluetoothPrinter,
  disconnectBluetoothPrinter,
  writeBluetoothData,
} from "@/lib/printer/bluetooth"

import {
  buildKasirReceipt,
} from "@/lib/printer/escpos"

import type {
  Transaction,
} from "@/lib/transactions/types"

import type {
  ReceiptData,
} from "@/lib/transactions/receipt"

import {
  getDefaultPrinterAction,
  getReceiptOutletAction,
} from "./actions"

type PrinterConfig = {
  id: string
  name: string
  connection_type: "usb" | "bluetooth"
  is_default: boolean

  bluetooth_device_name: string | null
  bluetooth_device_id: string | null
  bluetooth_service_uuid: string | null
  bluetooth_characteristic_uuid: string | null

  usb_vendor_id: number | null
  usb_product_id: number | null
  usb_serial_number: string | null

  paper_width: number
  printer_model: string | null
}

// ======================================================
// GET DEFAULT PRINTER
// ======================================================

async function getDefaultPrinter(
  outletId: string
): Promise<PrinterConfig | null> {
  let data

  try {
    data = await getDefaultPrinterAction(outletId)
  } catch (error) {
    plog.error(
      "[Print] Gagal mengambil printer default:",
      error
    )

    throw new Error(
      "Gagal mengambil konfigurasi printer."
    )
  }

  return data as PrinterConfig | null
}

// ======================================================
// BUILD RECEIPT
// ======================================================

async function buildTransactionReceipt(
  data: Transaction
) {
  // =====================================
  // AMBIL OUTLET ASLI
  // =====================================

  let outlet

  try {
    outlet = data.outlet_id
      ? await getReceiptOutletAction(data.outlet_id)
      : null
  } catch (outletError) {
    plog.error(
      "[Print] Gagal mengambil outlet:",
      outletError
    )

    throw new Error(
      "Gagal mengambil data outlet."
    )
  }

  if (!outlet) {
    throw new Error(
      "Data outlet tidak ditemukan."
    )
  }

  // =====================================
  // PRODUCTS
  // =====================================

  const products =
    Array.isArray(
      data.products
    )
      ? data.products
      : []

  // =====================================
  // RECEIPT DATA
  // =====================================

  const receipt: ReceiptData = {
    transactionId:
      data.id,

    invoice:
      data.invoice ?? null,

    outletName:
      outlet.name,

    outletAddress:
      outlet.address ?? null,

    outletUrl:
      outlet.url ?? null,

    orderDate:
      data.order_date,

    buyerName:
      data.buyer_name ?? null,

    cashierName:
      data.processed_by_name ?? null,

    paymentMethod:
      data.payment_method ?? null,

    products:
      products.map(
        (product: any) => ({
          qty:
            Number(
              product.qty ?? 0
            ),

          name:
            product.name ??
            product.snapshot?.name ??
            "-",

          price:
            Number(
              product.price ??
              product.snapshot?.price ??
              0
            ),

          variantName:
            product.variantName ??
            product.snapshot?.variantName ??
            null,

          productId:
            product.productId,

          variantId:
            product.variantId,
        })
      ),

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
        data.shipping_cost ?? 0
      ),

    adminFee:
      Number(
        data.admin_fee ?? 0
      ),

    total:
      Number(
        data.total ?? 0
      ),
  }

  // =====================================
  // BUILD ESC/POS
  // =====================================

  const receiptBytes =
    await buildKasirReceipt(
      receipt,
      outlet.image_url
    )

  return receiptBytes
}

// ======================================================
// PRINT USB
// ======================================================

async function printTransactionUsb(
  data: Transaction,
  printer: PrinterConfig
) {
  if (
    printer.usb_vendor_id === null ||
    printer.usb_product_id === null
  ) {
    throw new Error(
      "Konfigurasi USB printer belum lengkap."
    )
  }

  const receiptBytes =
    await buildTransactionReceipt(
      data
    )

  plog.log(
    "[USB Print] Printer:",
    {
      id:
        printer.id,

      name:
        printer.name,

      vendorId:
        printer.usb_vendor_id,

      productId:
        printer.usb_product_id,

      serialNumber:
        printer.usb_serial_number,
    }
  )

  plog.log(
    "[USB Print] Receipt bytes:",
    receiptBytes.byteLength
  )

  // =====================================
  // CONNECT USB
  // =====================================

  const connection =
    await connectSavedUsbPrinter({
      vendorId:
        printer.usb_vendor_id,

      productId:
        printer.usb_product_id,

      serialNumber:
        printer.usb_serial_number,
    })

  try {
    await connection.device.transferOut(
      connection.endpointNumber,
      receiptBytes
    )

    plog.log(
      "[USB Print] Receipt berhasil dikirim."
    )
  } finally {
    await disconnectUsbPrinter(
      connection
    )
  }
}

// ======================================================
// PRINT BLUETOOTH
// ======================================================

async function printTransactionBluetooth(
  data: Transaction,
  printer: PrinterConfig
) {
  if (
    !printer.bluetooth_device_id
  ) {
    throw new Error(
      "ID printer Bluetooth belum tersimpan. Silakan hubungkan ulang printer dari Pengaturan → Printer."
    )
  }

  const receiptBytes =
    await buildTransactionReceipt(
      data
    )

  plog.log(
    "[Bluetooth Print] Printer:",
    {
      id:
        printer.id,

      name:
        printer.name,

      deviceName:
        printer.bluetooth_device_name,

      deviceId:
        printer.bluetooth_device_id,

      serviceUuid:
        printer.bluetooth_service_uuid,

      characteristicUuid:
        printer.bluetooth_characteristic_uuid,
    }
  )

  plog.log(
    "[Bluetooth Print] Receipt bytes:",
    receiptBytes.byteLength
  )

  // =====================================
  // CONNECT SAVED BLUETOOTH
  // =====================================

  const connection =
    await connectSavedBluetoothPrinter({
      deviceId:
        printer.bluetooth_device_id,

      deviceName:
        printer.bluetooth_device_name,

      serviceUuid:
        printer.bluetooth_service_uuid,

      characteristicUuid:
        printer.bluetooth_characteristic_uuid,
    })

  try {
    await writeBluetoothData(
      connection,
      receiptBytes
    )

    plog.log(
      "[Bluetooth Print] Receipt berhasil dikirim."
    )
  } finally {
    await disconnectBluetoothPrinter(
      connection.device
    )
  }
}

// ======================================================
// PUBLIC PRINT FUNCTION
// ======================================================

export async function printTransaction(
  data: Transaction
) {
  if (!data.outlet_id) {
    throw new Error(
      "Transaksi tidak memiliki outlet."
    )
  }

  // =====================================
  // AMBIL PRINTER DEFAULT
  // =====================================

  const printer =
    await getDefaultPrinter(
      data.outlet_id
    )

  if (!printer) {
    throw new Error(
      "Printer default belum dikonfigurasi. Silakan atur printer di Pengaturan → Printer."
    )
  }

  plog.log(
    "[Print Transaction] Default printer:",
    {
      id:
        printer.id,

      name:
        printer.name,

      connectionType:
        printer.connection_type,
    }
  )

  // =====================================
  // USB
  // =====================================

  if (
    printer.connection_type ===
    "usb"
  ) {
    return printTransactionUsb(
      data,
      printer
    )
  }

  // =====================================
  // BLUETOOTH
  // =====================================

  if (
    printer.connection_type ===
    "bluetooth"
  ) {
    return printTransactionBluetooth(
      data,
      printer
    )
  }

  // =====================================
  // UNKNOWN
  // =====================================

  throw new Error(
    `Jenis koneksi printer "${printer.connection_type}" tidak didukung.`
  )
}