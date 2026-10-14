import { query, queryOne } from "@/lib/db"
import { getActiveOutlet } from "@/lib/outlet"
import PrinterClient, { type Printer } from "@/components/printer/printer-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pengaturan Printer",
}

export default async function PrinterPage() {
  const { user, activeOutlet } = await getActiveOutlet()

  let outletUser: { id: string; role: string; status: string } | null = null

  try {
    outletUser = await queryOne(
      `SELECT id, role, status
       FROM outlet_users
       WHERE user_id = ? AND outlet_id = ? AND status = 'active'`,
      [user.id, activeOutlet.id]
    )
  } catch (outletUserError) {
    console.error(
      "[PrinterPage] Failed to fetch outlet user:",
      outletUserError
    )
  }

  let printers: Printer[] = []

  if (outletUser) {
    try {
      printers = await query<Printer>(
        `SELECT
           id, name, connection_type, is_default,
           bluetooth_device_name, bluetooth_device_id,
           bluetooth_service_uuid, bluetooth_characteristic_uuid,
           usb_vendor_id, usb_product_id, usb_serial_number,
           paper_width, printer_model, created_at, updated_at
         FROM printer_devices
         WHERE outlet_id = ? AND outlet_user_id = ?
         ORDER BY is_default DESC, created_at DESC`,
        [activeOutlet.id, outletUser.id]
      )
    } catch (error) {
      console.error(
        "[PrinterPage] Failed to fetch printers:",
        error
      )
    }
  }

  return (
    <PrinterClient
      outlet={activeOutlet}
      outletUser={outletUser}
      printers={printers}
    />
  )
}