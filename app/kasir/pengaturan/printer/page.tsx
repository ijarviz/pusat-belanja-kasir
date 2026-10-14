import { getActiveOutlet } from "@/lib/outlet"
import PrinterClient from "@/components/printer/printer-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pengaturan Printer",
}

export default async function PrinterPage() {
  const { supabase, user, activeOutlet } = await getActiveOutlet()

  const { data: outletUser, error: outletUserError } = await supabase
    .from("outlet_users")
    .select("id, role, status")
    .eq("user_id", user.id)
    .eq("outlet_id", activeOutlet.id)
    .eq("status", "active")
    .maybeSingle()

  if (outletUserError) {
    console.error(
      "[PrinterPage] Failed to fetch outlet user:",
      outletUserError
    )
  }

  let printers: any[] = []

  if (outletUser) {
    const { data, error } = await supabase
      .from("printer_devices")
      .select(`
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
        printer_model,
        created_at,
        updated_at
      `)
      .eq("outlet_id", activeOutlet.id)
      .eq("outlet_user_id", outletUser.id)
      .order("is_default", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      console.error(
        "[PrinterPage] Failed to fetch printers:",
        error
      )
    } else {
      printers = data ?? []
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