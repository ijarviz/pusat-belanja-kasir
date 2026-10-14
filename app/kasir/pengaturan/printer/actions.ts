"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"

import { execute, queryOne } from "@/lib/db"
import { requireOutletAccess } from "@/lib/outlet"

type OutletUser = {
  id: string
  role: string
  status: string
}

const PRINTER_COLUMNS = `
  id,
  name,
  connection_type,
  is_default,
  bluetooth_device_name,
  bluetooth_device_id,
  bluetooth_service_uuid,
  bluetooth_characteristic_uuid,
  usb_vendor_id,
  usb_product_id,
  usb_serial_number,
  paper_width,
  printer_model
`

/*
 * Membership aktif user di outlet aktif. Printer disimpan per
 * membership (outlet_user_id), bukan per outlet.
 */
async function getActiveOutletUser(context: string) {
  const { user, activeOutlet } = await requireOutletAccess()

  try {
    const outletUser = await queryOne<OutletUser>(
      `SELECT id, role, status
       FROM outlet_users
       WHERE user_id = ? AND outlet_id = ? AND status = 'active'`,
      [user.id, activeOutlet.id]
    )

    return { activeOutlet, outletUser, error: null }
  } catch (error) {
    console.error(`[${context}] Outlet user error:`, error)
    return { activeOutlet, outletUser: null, error }
  }
}

/*
 * Printer pertama otomatis menjadi default; kalau user memilih
 * printer baru sebagai default, default lama dilepas dulu.
 */
async function resolveDefaultFlag(
  outletId: string,
  outletUserId: string,
  isDefault: boolean
) {
  if (isDefault) {
    await execute(
      `UPDATE printer_devices
       SET is_default = FALSE
       WHERE outlet_id = ? AND outlet_user_id = ? AND is_default = TRUE`,
      [outletId, outletUserId]
    )

    return true
  }

  const existingDefault = await queryOne(
    `SELECT id FROM printer_devices
     WHERE outlet_id = ? AND outlet_user_id = ? AND is_default = TRUE
     LIMIT 1`,
    [outletId, outletUserId]
  )

  return !existingDefault
}

type SaveUsbPrinterInput = {
  name: string
  vendorId: number
  productId: number
  serialNumber: string | null
  printerModel: string | null
  paperWidth: number
  isDefault: boolean
}

export async function saveUsbPrinterAction(
  input: SaveUsbPrinterInput
) {
  const {
    name,
    vendorId,
    productId,
    serialNumber,
    printerModel,
    paperWidth,
    isDefault,
  } = input

  if (!name.trim()) {
    return {
      success: false,
      error: "Nama printer wajib diisi.",
    }
  }

  if (!Number.isInteger(vendorId)) {
    return {
      success: false,
      error: "Vendor ID tidak valid.",
    }
  }

  if (!Number.isInteger(productId)) {
    return {
      success: false,
      error: "Product ID tidak valid.",
    }
  }

  if (![58, 80].includes(paperWidth)) {
    return {
      success: false,
      error: "Lebar kertas harus 58mm atau 80mm.",
    }
  }

  const { activeOutlet, outletUser, error } =
    await getActiveOutletUser("saveUsbPrinterAction")

  if (error) {
    return {
      success: false,
      error: "Gagal memeriksa akses outlet.",
    }
  }

  if (!outletUser) {
    return {
      success: false,
      error: "Anda tidak memiliki akses aktif ke outlet ini.",
    }
  }

  let finalIsDefault: boolean

  try {
    finalIsDefault = await resolveDefaultFlag(
      activeOutlet.id,
      outletUser.id,
      isDefault
    )
  } catch (defaultError) {
    console.error(
      "[saveUsbPrinterAction] Default printer error:",
      defaultError
    )

    return {
      success: false,
      error: "Gagal mengatur printer default.",
    }
  }

  const printerId = randomUUID()

  try {
    await execute(
      `INSERT INTO printer_devices (
         id, outlet_id, outlet_user_id, name, connection_type, is_default,
         usb_vendor_id, usb_product_id, usb_serial_number,
         paper_width, printer_model
       ) VALUES (?, ?, ?, ?, 'usb', ?, ?, ?, ?, ?, ?)`,
      [
        printerId,
        activeOutlet.id,
        outletUser.id,
        name.trim(),
        finalIsDefault,
        vendorId,
        productId,
        serialNumber?.trim() || null,
        paperWidth,
        printerModel?.trim() || null,
      ]
    )
  } catch (insertError) {
    console.error(
      "[saveUsbPrinterAction] Insert error:",
      insertError
    )

    return {
      success: false,
      error: "Gagal menyimpan printer.",
    }
  }

  const printer = await queryOne(
    `SELECT ${PRINTER_COLUMNS} FROM printer_devices WHERE id = ?`,
    [printerId]
  )

  revalidatePath(
    "/pengaturan/printer"
  )

  return {
    success: true,
    printer,
  }
}

type SaveBluetoothPrinterInput = {
  name: string
  deviceName: string | null
  deviceId: string
  serviceUuid: string | null
  characteristicUuid: string | null
  printerModel: string | null
  paperWidth: number
  isDefault: boolean
}

export async function saveBluetoothPrinterAction(
  input: SaveBluetoothPrinterInput
) {
  const {
    name,
    deviceName,
    deviceId,
    serviceUuid,
    characteristicUuid,
    printerModel,
    paperWidth,
    isDefault,
  } = input

  if (!name.trim()) {
    return {
      success: false,
      error: "Nama printer wajib diisi.",
    }
  }

  if (!deviceId.trim()) {
    return {
      success: false,
      error: "ID perangkat Bluetooth tidak ditemukan.",
    }
  }

  if (![58, 80].includes(paperWidth)) {
    return {
      success: false,
      error:
        "Lebar kertas harus 58mm atau 80mm.",
    }
  }

  const { activeOutlet, outletUser, error } =
    await getActiveOutletUser("saveBluetoothPrinterAction")

  if (error) {
    return {
      success: false,
      error: "Gagal memeriksa akses outlet.",
    }
  }

  if (!outletUser) {
    return {
      success: false,
      error: "Anda tidak memiliki akses aktif ke outlet ini.",
    }
  }

  let finalIsDefault: boolean

  try {
    finalIsDefault = await resolveDefaultFlag(
      activeOutlet.id,
      outletUser.id,
      isDefault
    )
  } catch (defaultError) {
    console.error(
      "[saveBluetoothPrinterAction] Default printer error:",
      defaultError
    )

    return {
      success: false,
      error: "Gagal mengatur printer default.",
    }
  }

  const printerId = randomUUID()

  try {
    await execute(
      `INSERT INTO printer_devices (
         id, outlet_id, outlet_user_id, name, connection_type, is_default,
         bluetooth_device_name, bluetooth_device_id,
         bluetooth_service_uuid, bluetooth_characteristic_uuid,
         paper_width, printer_model
       ) VALUES (?, ?, ?, ?, 'bluetooth', ?, ?, ?, ?, ?, ?, ?)`,
      [
        printerId,
        activeOutlet.id,
        outletUser.id,
        name.trim(),
        finalIsDefault,
        deviceName?.trim() || null,
        deviceId.trim(),
        serviceUuid?.trim() || null,
        characteristicUuid?.trim() || null,
        paperWidth,
        printerModel?.trim() || null,
      ]
    )
  } catch (insertError) {
    console.error(
      "[saveBluetoothPrinterAction] Insert error:",
      insertError
    )

    return {
      success: false,
      error: "Gagal menyimpan printer.",
    }
  }

  const printer = await queryOne(
    `SELECT ${PRINTER_COLUMNS} FROM printer_devices WHERE id = ?`,
    [printerId]
  )

  revalidatePath(
    "/pengaturan/printer"
  )

  return {
    success: true,
    printer,
  }
}

export async function deletePrinterAction(
  printerId: string
) {
  if (!printerId) {
    return {
      success: false,
      error: "Printer tidak valid.",
    }
  }

  const { activeOutlet, outletUser, error } =
    await getActiveOutletUser("deletePrinterAction")

  if (error) {
    return {
      success: false,
      error: "Gagal memeriksa akses pengguna.",
    }
  }

  if (!outletUser) {
    return {
      success: false,
      error: "Anda tidak memiliki akses ke outlet ini.",
    }
  }

  // Ambil printer yang akan dihapus
  let printer: { id: string; is_default: boolean } | null

  try {
    printer = await queryOne(
      `SELECT id, is_default
       FROM printer_devices
       WHERE id = ? AND outlet_id = ? AND outlet_user_id = ?`,
      [printerId, activeOutlet.id, outletUser.id]
    )
  } catch (printerError) {
    console.error(
      "[deletePrinterAction] Printer lookup error:",
      printerError
    )

    return {
      success: false,
      error: "Gagal mengambil data printer.",
    }
  }

  if (!printer) {
    return {
      success: false,
      error: "Printer tidak ditemukan.",
    }
  }

  // Hapus printer
  try {
    await execute(
      `DELETE FROM printer_devices
       WHERE id = ? AND outlet_id = ? AND outlet_user_id = ?`,
      [printer.id, activeOutlet.id, outletUser.id]
    )
  } catch (deleteError) {
    console.error(
      "[deletePrinterAction] Delete error:",
      deleteError
    )

    return {
      success: false,
      error: "Gagal menghapus printer.",
    }
  }

  // Kalau printer yang dihapus adalah default,
  // pilih printer lain sebagai default.
  if (printer.is_default) {
    try {
      await execute(
        `UPDATE printer_devices
         SET is_default = TRUE
         WHERE outlet_id = ? AND outlet_user_id = ?
         ORDER BY created_at ASC
         LIMIT 1`,
        [activeOutlet.id, outletUser.id]
      )
    } catch (nextDefaultError) {
      console.error(
        "[deletePrinterAction] Failed to set next default:",
        nextDefaultError
      )
    }
  }

  revalidatePath(
    "/pengaturan/printer"
  )

  return {
    success: true,
  }
}

export async function setDefaultPrinterAction(
  printerId: string
) {
  if (!printerId) {
    return {
      success: false,
      error: "Printer tidak valid.",
    }
  }

  const { activeOutlet, outletUser, error } =
    await getActiveOutletUser("setDefaultPrinterAction")

  if (error) {
    return {
      success: false,
      error: "Gagal memeriksa akses pengguna.",
    }
  }

  if (!outletUser) {
    return {
      success: false,
      error: "Anda tidak memiliki akses ke outlet ini.",
    }
  }

  // Sama seperti versi Supabase: hanya role "owner" (dan "admin",
  // role yang tidak ada di enum) yang boleh mengganti default.
  if (
    !["owner", "admin"].includes(
      outletUser.role
    )
  ) {
    return {
      success: false,
      error: "Anda tidak memiliki izin untuk mengubah printer default.",
    }
  }

  let printer: { id: string; is_default: boolean } | null

  try {
    printer = await queryOne(
      `SELECT id, name, is_default
       FROM printer_devices
       WHERE id = ? AND outlet_id = ? AND outlet_user_id = ?`,
      [printerId, activeOutlet.id, outletUser.id]
    )
  } catch (printerError) {
    console.error(
      "[setDefaultPrinterAction] Printer lookup error:",
      printerError
    )

    return {
      success: false,
      error: "Gagal mengambil data printer.",
    }
  }

  if (!printer) {
    return {
      success: false,
      error: "Printer tidak ditemukan.",
    }
  }

  if (printer.is_default) {
    return {
      success: true,
    }
  }

  // Lepaskan default dari semua printer
  try {
    await execute(
      `UPDATE printer_devices
       SET is_default = FALSE
       WHERE outlet_id = ? AND outlet_user_id = ? AND is_default = TRUE`,
      [activeOutlet.id, outletUser.id]
    )
  } catch (resetError) {
    console.error(
      "[setDefaultPrinterAction] Reset default error:",
      resetError
    )

    return {
      success: false,
      error: "Gagal mengubah printer default.",
    }
  }

  // Jadikan printer yang dipilih sebagai default
  try {
    await execute(
      `UPDATE printer_devices
       SET is_default = TRUE
       WHERE id = ? AND outlet_id = ? AND outlet_user_id = ?`,
      [printer.id, activeOutlet.id, outletUser.id]
    )
  } catch (updateError) {
    console.error(
      "[setDefaultPrinterAction] Set default error:",
      updateError
    )

    return {
      success: false,
      error: "Gagal menetapkan printer sebagai default.",
    }
  }

  revalidatePath(
    "/pengaturan/printer"
  )

  return {
    success: true,
  }
}
