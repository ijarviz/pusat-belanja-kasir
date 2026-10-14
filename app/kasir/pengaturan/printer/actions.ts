"use server"

import { revalidatePath } from "next/cache"

import { getActiveOutlet } from "@/lib/outlet"

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
    supabase,
    user,
    activeOutlet,
  } = await getActiveOutlet()

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

  const { data: outletUser, error: outletUserError } =
    await supabase
      .from("outlet_users")
      .select("id, role, status")
      .eq("user_id", user.id)
      .eq("outlet_id", activeOutlet.id)
      .eq("status", "active")
      .maybeSingle()

  if (outletUserError) {
    console.error(
      "[saveUsbPrinterAction] Outlet user error:",
      outletUserError
    )

    return {
      success: false,
      error:
        "Gagal memeriksa akses outlet.",
    }
  }

  if (!outletUser) {
    return {
      success: false,
      error:
        "Anda tidak memiliki akses aktif ke outlet ini.",
    }
  }

  /**
   * Kalau user memilih printer sebagai default,
   * lepaskan default yang lama terlebih dahulu.
   */
  if (isDefault) {
    const { error: clearDefaultError } =
      await supabase
        .from("printer_devices")
        .update({
          is_default: false,
        })
        .eq(
          "outlet_id",
          activeOutlet.id
        )
        .eq(
          "outlet_user_id",
          outletUser.id
        )
        .eq(
          "is_default",
          true
        )

    if (clearDefaultError) {
      console.error(
        "[saveUsbPrinterAction] Clear default error:",
        clearDefaultError
      )

      return {
        success: false,
        error:
          "Gagal mengatur printer default.",
      }
    }
  }

  /**
   * Kalau belum ada printer default,
   * printer pertama otomatis menjadi default.
   */
  let finalIsDefault = isDefault

  if (!isDefault) {
    const { data: existingDefault, error } =
      await supabase
        .from("printer_devices")
        .select("id")
        .eq(
          "outlet_id",
          activeOutlet.id
        )
        .eq(
          "outlet_user_id",
          outletUser.id
        )
        .eq(
          "is_default",
          true
        )
        .maybeSingle()

    if (error) {
      console.error(
        "[saveUsbPrinterAction] Check default error:",
        error
      )

      return {
        success: false,
        error:
          "Gagal memeriksa printer default.",
      }
    }

    if (!existingDefault) {
      finalIsDefault = true
    }
  }

  const { data: printer, error: insertError } =
    await supabase
      .from("printer_devices")
      .insert({
        outlet_id: activeOutlet.id,
        outlet_user_id: outletUser.id,

        name: name.trim(),

        connection_type: "usb",

        is_default: finalIsDefault,

        usb_vendor_id: vendorId,
        usb_product_id: productId,
        usb_serial_number:
          serialNumber?.trim() || null,

        paper_width: paperWidth,

        printer_model:
          printerModel?.trim() || null,
      })
      .select(
        `
        id,
        name,
        connection_type,
        is_default,
        usb_vendor_id,
        usb_product_id,
        usb_serial_number,
        paper_width,
        printer_model
        `
      )
      .single()

  if (insertError) {
    console.error(
      "[saveUsbPrinterAction] Insert error:",
      insertError
    )

    return {
      success: false,
      error:
        "Gagal menyimpan printer.",
    }
  }

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
    supabase,
    user,
    activeOutlet,
  } = await getActiveOutlet()

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

  const {
    data: outletUser,
    error: outletUserError,
  } = await supabase
    .from("outlet_users")
    .select("id, role, status")
    .eq("user_id", user.id)
    .eq("outlet_id", activeOutlet.id)
    .eq("status", "active")
    .maybeSingle()

  if (outletUserError) {
    console.error(
      "[saveBluetoothPrinterAction] Outlet user error:",
      outletUserError
    )

    return {
      success: false,
      error:
        "Gagal memeriksa akses outlet.",
    }
  }

  if (!outletUser) {
    return {
      success: false,
      error:
        "Anda tidak memiliki akses aktif ke outlet ini.",
    }
  }

  /**
   * Kalau user memilih printer sebagai default,
   * lepaskan default yang lama terlebih dahulu.
   */
  if (isDefault) {
    const {
      error: clearDefaultError,
    } = await supabase
      .from("printer_devices")
      .update({
        is_default: false,
      })
      .eq(
        "outlet_id",
        activeOutlet.id
      )
      .eq(
        "outlet_user_id",
        outletUser.id
      )
      .eq(
        "is_default",
        true
      )

    if (clearDefaultError) {
      console.error(
        "[saveBluetoothPrinterAction] Clear default error:",
        clearDefaultError
      )

      return {
        success: false,
        error:
          "Gagal mengatur printer default.",
      }
    }
  }

  /**
   * Kalau belum ada printer default,
   * printer pertama otomatis menjadi default.
   */
  let finalIsDefault = isDefault

  if (!isDefault) {
    const {
      data: existingDefault,
      error,
    } = await supabase
      .from("printer_devices")
      .select("id")
      .eq(
        "outlet_id",
        activeOutlet.id
      )
      .eq(
        "outlet_user_id",
        outletUser.id
      )
      .eq(
        "is_default",
        true
      )
      .maybeSingle()

    if (error) {
      console.error(
        "[saveBluetoothPrinterAction] Check default error:",
        error
      )

      return {
        success: false,
        error:
          "Gagal memeriksa printer default.",
      }
    }

    if (!existingDefault) {
      finalIsDefault = true
    }
  }

  const {
    data: printer,
    error: insertError,
  } = await supabase
    .from("printer_devices")
    .insert({
      outlet_id: activeOutlet.id,
      outlet_user_id: outletUser.id,

      name: name.trim(),

      connection_type:
        "bluetooth",

      is_default:
        finalIsDefault,

      bluetooth_device_name:
        deviceName?.trim() || null,

      bluetooth_device_id:
        deviceId.trim(),

      bluetooth_service_uuid:
        serviceUuid?.trim() || null,

      bluetooth_characteristic_uuid:
        characteristicUuid?.trim() || null,

      paper_width:
        paperWidth,

      printer_model:
        printerModel?.trim() || null,
    })
    .select(
      `
      id,
      name,
      connection_type,
      is_default,
      bluetooth_device_name,
      bluetooth_device_id,
      bluetooth_service_uuid,
      bluetooth_characteristic_uuid,
      paper_width,
      printer_model
      `
    )
    .single()

  if (insertError) {
    console.error(
      "[saveBluetoothPrinterAction] Insert error:",
      insertError
    )

    return {
      success: false,
      error:
        "Gagal menyimpan printer.",
    }
  }

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

  const {
    supabase,
    activeOutlet,
    user,
  } = await getActiveOutlet()

  // Cari outlet user yang aktif
  const {
    data: outletUser,
    error: outletUserError,
  } = await supabase
    .from("outlet_users")
    .select("id, role, status")
    .eq("user_id", user.id)
    .eq("outlet_id", activeOutlet.id)
    .eq("status", "active")
    .maybeSingle()

  if (outletUserError) {
    console.error(
      "[deletePrinterAction] Outlet user error:",
      outletUserError
    )

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
  const {
    data: printer,
    error: printerError,
  } = await supabase
    .from("printer_devices")
    .select(`
      id,
      outlet_id,
      outlet_user_id,
      is_default
    `)
    .eq("id", printerId)
    .eq("outlet_id", activeOutlet.id)
    .eq("outlet_user_id", outletUser.id)
    .maybeSingle()

  if (printerError) {
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
  const {
    error: deleteError,
  } = await supabase
    .from("printer_devices")
    .delete()
    .eq("id", printer.id)
    .eq("outlet_id", activeOutlet.id)
    .eq("outlet_user_id", outletUser.id)

  if (deleteError) {
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
    const {
      data: nextPrinter,
      error: nextPrinterError,
    } = await supabase
      .from("printer_devices")
      .select("id")
      .eq(
        "outlet_id",
        activeOutlet.id
      )
      .eq(
        "outlet_user_id",
        outletUser.id
      )
      .order("created_at", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle()

    if (nextPrinterError) {
      console.error(
        "[deletePrinterAction] Failed to find next default printer:",
        nextPrinterError
      )
    } else if (nextPrinter) {
      const {
        error: updateDefaultError,
      } = await supabase
        .from("printer_devices")
        .update({
          is_default: true,
        })
        .eq(
          "id",
          nextPrinter.id
        )

      if (updateDefaultError) {
        console.error(
          "[deletePrinterAction] Failed to set next default:",
          updateDefaultError
        )
      }
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

  const {
    supabase,
    activeOutlet,
    user,
  } = await getActiveOutlet()

  const {
    data: outletUser,
    error: outletUserError,
  } = await supabase
    .from("outlet_users")
    .select("id, role, status")
    .eq("user_id", user.id)
    .eq("outlet_id", activeOutlet.id)
    .eq("status", "active")
    .maybeSingle()

  if (outletUserError) {
    console.error(
      "[setDefaultPrinterAction] Outlet user error:",
      outletUserError
    )

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

  const {
    data: printer,
    error: printerError,
  } = await supabase
    .from("printer_devices")
    .select("id, name, is_default")
    .eq("id", printerId)
    .eq("outlet_id", activeOutlet.id)
    .eq("outlet_user_id", outletUser.id)
    .maybeSingle()

  if (printerError) {
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
  const {
    error: resetError,
  } = await supabase
    .from("printer_devices")
    .update({
      is_default: false,
    })
    .eq("outlet_id", activeOutlet.id)
    .eq("outlet_user_id", outletUser.id)
    .eq("is_default", true)

  if (resetError) {
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
  const {
    error: updateError,
  } = await supabase
    .from("printer_devices")
    .update({
      is_default: true,
    })
    .eq("id", printer.id)
    .eq("outlet_id", activeOutlet.id)
    .eq("outlet_user_id", outletUser.id)

  if (updateError) {
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