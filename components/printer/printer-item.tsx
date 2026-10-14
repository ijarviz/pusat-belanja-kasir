"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  BluetoothIcon,
  PrinterIcon,
  UsbIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export type Printer = {
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

  created_at: string
  updated_at: string
}

type Props = {
  printer: Printer
  disabled: boolean
  onUsbTestPrint: (printer: Printer) => void
  onDelete: (printer: Printer) => void
  testPrintLoading: boolean
  deleteLoading: boolean
}

export default function PrinterItem({
  printer,
  disabled,
  onUsbTestPrint,
  onDelete,
  testPrintLoading,
  deleteLoading,
}: Props) {
  const isUsb = printer.connection_type === "usb"

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <HugeiconsIcon
            icon={PrinterIcon}
            className="size-5"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {printer.name}
            </p>

            {printer.is_default ? (
              <Badge variant="secondary">
                Default
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon
                icon={
                  isUsb
                    ? UsbIcon
                    : BluetoothIcon
                }
                className="size-4"
              />

              {isUsb
                ? "USB"
                : "Bluetooth"}
            </span>

            <span>
              {printer.paper_width} mm
            </span>

            {printer.printer_model ? (
              <span>
                {printer.printer_model}
              </span>
            ) : null}
          </div>

          {isUsb ? (
            <div className="mt-2 text-xs text-muted-foreground">
              VID: {printer.usb_vendor_id ?? "-"}{" "}
              · PID: {printer.usb_product_id ?? "-"}
              {printer.usb_serial_number ? (
                <>
                  {" "}
                  · SN:{" "}
                  {printer.usb_serial_number}
                </>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground">
              {printer.bluetooth_device_name ||
                "Bluetooth Printer"}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
  {isUsb ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={
        disabled ||
        testPrintLoading ||
        deleteLoading
      }
      onClick={() =>
        onUsbTestPrint(printer)
      }
    >
      {testPrintLoading
        ? "Mencetak..."
        : "Test Print"}
    </Button>
  ) : null}

  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={
          disabled ||
          testPrintLoading ||
          deleteLoading
        }
      >
        {deleteLoading
          ? "Menghapus..."
          : "Hapus"}
      </Button>
    </AlertDialogTrigger>

    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Hapus printer?
        </AlertDialogTitle>

        <AlertDialogDescription>
          Printer{" "}
          <span className="font-medium text-foreground">
            {printer.name}
          </span>{" "}
          akan dihapus dari pengaturan printer
          outlet ini.
          <br />
          <br />
          Tindakan ini tidak menghapus izin
          Bluetooth dari browser.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel>
          Batal
        </AlertDialogCancel>

        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() =>
            onDelete(printer)
          }
        >
          Hapus Printer
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
    </div>
  )
}