"use server"

import { queryOne } from "@/lib/db"
import { requireOutletAccess } from "@/lib/outlet"

/*
 * Data yang dibutuhkan lib/printer/transaction-print.ts (client)
 * untuk mencetak struk. Dulu diambil langsung dari browser lewat
 * supabase-js.
 */

/*
 * Printer default milik user yang login di outlet aktif. Printer
 * disimpan per anggota outlet (outlet_user_id), jadi tiap kasir
 * punya default sendiri.
 */
export async function getDefaultPrinterAction(outletId: string) {
  const { user, activeOutlet } = await requireOutletAccess()

  if (outletId !== activeOutlet.id) return null

  return queryOne(
    `SELECT
       pd.id, pd.name, pd.connection_type, pd.is_default,
       pd.bluetooth_device_name, pd.bluetooth_device_id,
       pd.bluetooth_service_uuid, pd.bluetooth_characteristic_uuid,
       pd.usb_vendor_id, pd.usb_product_id, pd.usb_serial_number,
       pd.paper_width, pd.printer_model
     FROM printer_devices pd
     JOIN outlet_users ou ON ou.id = pd.outlet_user_id
     WHERE pd.outlet_id = ?
       AND pd.is_default = TRUE
       AND ou.user_id = ?
     LIMIT 1`,
    [activeOutlet.id, user.id]
  )
}

export async function getReceiptOutletAction(outletId: string) {
  const { activeOutlet } = await requireOutletAccess()

  if (outletId !== activeOutlet.id) return null

  return queryOne<{
    id: string
    name: string
    address: string | null
    image_url: string | null
  }>(
    "SELECT id, name, address, image_url FROM outlets WHERE id = ?",
    [activeOutlet.id]
  )
}
