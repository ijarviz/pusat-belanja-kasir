"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  connectBluetoothPrinter,
  connectSavedBluetoothPrinter,
  disconnectBluetoothPrinter,
  printBluetoothTest,
  type BluetoothPrinterConnection,
} from "@/lib/printer/bluetooth"

import {
  connectUsbPrinter,
  connectSavedUsbPrinter,
  printUsbTest,
  disconnectUsbPrinter,
  type UsbPrinterConnection,
} from "@/lib/printer/usb"

import {
  saveUsbPrinterAction,
  deletePrinterAction,
  saveBluetoothPrinterAction,
  setDefaultPrinterAction,
} from "@/app/kasir/pengaturan/printer/actions"

import AddPrinterDialog from "./add-printer-dialog"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConnectionType =
  | "usb"
  | "bluetooth"

type UsbDeviceResult = {
  vendorId: number
  productId: number
  serialNumber: string | null
  manufacturerName?: string
  productName?: string
}

type BluetoothResult = {
  name: string | null
  id: string
  serviceCount: number
  writableCharacteristicUuid: string | null
}

export type Printer = {
  id: string
  name: string
  connection_type: ConnectionType
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
  outlet: any

  outletUser: {
    id: string
    role: string
    status: string
  } | null

  printers: Printer[]
}

export default function PrinterClient({
  outlet,
  outletUser,
  printers,
}: Props) {
  const router = useRouter()

  const [addDialogOpen, setAddDialogOpen] =
    useState(false)

  const [selectedConnection, setSelectedConnection] =
    useState<ConnectionType | null>(null)

  // =========================================================
  // DELETE PRINTER
  // =========================================================

  const [deletePrinterId, setDeletePrinterId] =
    useState<string | null>(null)

  const [deleteDialogPrinter, setDeleteDialogPrinter] =
    useState<Printer | null>(null)

  const [defaultPrinterId, setDefaultPrinterId] =
    useState<string | null>(null)

  // =========================================================
  // USB
  // =========================================================

  const [usbConnection, setUsbConnection] =
    useState<UsbPrinterConnection | null>(null)

  const [usbDevice, setUsbDevice] =
    useState<UsbDeviceResult | null>(null)

  const [usbConnected, setUsbConnected] =
    useState(false)

  const [usbLoading, setUsbLoading] =
    useState(false)

  const [usbTestPrintLoading, setUsbTestPrintLoading] =
    useState(false)

  const [usbPrinterName, setUsbPrinterName] =
    useState("Printer Kasir USB")

  const [usbPaperWidth, setUsbPaperWidth] =
    useState(80)

  const [usbIsDefault, setUsbIsDefault] =
    useState(true)

  const [usbSaveLoading, setUsbSaveLoading] =
    useState(false)

  const [usbError, setUsbError] =
    useState<string | null>(null)

  const [usbSaveError, setUsbSaveError] =
    useState<string | null>(null)

  const [usbSaveSuccess, setUsbSaveSuccess] =
    useState(false)

  // =========================================================
  // BLUETOOTH
  // =========================================================

  const [bluetoothLoading, setBluetoothLoading] =
    useState(false)

  const [bluetoothResult, setBluetoothResult] =
    useState<BluetoothResult | null>(null)

  const [bluetoothError, setBluetoothError] =
    useState<string | null>(null)

  const [bluetoothConnected, setBluetoothConnected] =
    useState(false)

  const [bluetoothConnection, setBluetoothConnection] =
    useState<BluetoothPrinterConnection | null>(null)

  const [bluetoothPrinterName, setBluetoothPrinterName] =
    useState("Printer Kasir Bluetooth")

  const [bluetoothPaperWidth, setBluetoothPaperWidth] =
    useState(80)

  const [bluetoothIsDefault, setBluetoothIsDefault] =
    useState(true)

  const [bluetoothTestPrintLoading, setBluetoothTestPrintLoading] =
    useState(false)

  const [bluetoothSaveLoading, setBluetoothSaveLoading] =
    useState(false)

  const [bluetoothSaveError, setBluetoothSaveError] =
    useState<string | null>(null)

  const [bluetoothSaveSuccess, setBluetoothSaveSuccess] =
    useState(false)

  // =========================================================
  // SAVED PRINTER TEST
  // =========================================================

  const [savedPrinterTestLoading, setSavedPrinterTestLoading] =
    useState<string | null>(null)

  // =========================================================
  // PERMISSION
  // =========================================================

  const canManagePrinter =
  !!outletUser &&
  ["super_admin", "owner", "admin", "kasir"].includes(outletUser.role)

  // =========================================================
  // DELETE PRINTER
  // =========================================================

  async function handleDeletePrinter(
    printer: Printer
  ) {
    const toastId =
      `delete-printer-${printer.id}`

    try {
      setDeletePrinterId(
        printer.id
      )

      toast.loading(
        "Menghapus printer...",
        {
          id: toastId,
        }
      )

      const result =
        await deletePrinterAction(
          printer.id
        )

      if (!result.success) {
        throw new Error(
          result.error ||
            "Gagal menghapus printer."
        )
      }

      toast.success(
        "Printer berhasil dihapus.",
        {
          id: toastId,
        }
      )

      router.refresh()

      return true
    } catch (error) {
      console.error(
        "[Delete Printer]",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menghapus printer.",
        {
          id: toastId,
        }
      )

      return false
    } finally {
      setDeletePrinterId(null)
    }
  }

  async function handleSetDefaultPrinter(
    printer: Printer
  ) {
    const toastId =
      `default-printer-${printer.id}`

    try {
      setDefaultPrinterId(
        printer.id
      )

      toast.loading(
        "Mengubah printer default...",
        {
          id: toastId,
        }
      )

      const result =
        await setDefaultPrinterAction(
          printer.id
        )

      if (!result.success) {
        throw new Error(
          result.error ||
            "Gagal mengubah printer default."
        )
      }

      toast.success(
        `"${printer.name}" sekarang menjadi printer default.`,
        {
          id: toastId,
        }
      )

      router.refresh()
    } catch (error) {
      console.error(
        "[Set Default Printer]",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengubah printer default.",
        {
          id: toastId,
        }
      )
    } finally {
      setDefaultPrinterId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteDialogPrinter) {
      return
    }

    const success =
      await handleDeletePrinter(
        deleteDialogPrinter
      )

    if (success) {
      setDeleteDialogPrinter(
        null
      )
    }
  }

  // =========================================================
  // OPEN ADD PRINTER
  // =========================================================

  function handleOpenAddPrinter() {
    if (!canManagePrinter) return

    setSelectedConnection(null)

    // Bluetooth reset
    setBluetoothResult(null)
    setBluetoothError(null)
    setBluetoothConnected(false)
    setBluetoothConnection(null)
    setBluetoothSaveError(null)
    setBluetoothSaveSuccess(false)
    setBluetoothPrinterName(
      "Printer Kasir Bluetooth"
    )
    setBluetoothPaperWidth(80)
    setBluetoothIsDefault(
      printers.length === 0
    )

    // USB reset
    setUsbDevice(null)
    setUsbConnection(null)
    setUsbConnected(false)
    setUsbError(null)
    setUsbSaveError(null)
    setUsbSaveSuccess(false)
    setUsbPrinterName(
      "Printer Kasir USB"
    )
    setUsbPaperWidth(80)
    setUsbIsDefault(
      printers.length === 0
    )

    setAddDialogOpen(true)
  }

  // =========================================================
  // CLOSE ADD PRINTER
  // =========================================================

  async function handleCloseAddPrinter(
    open: boolean
  ) {
    if (open) {
      setAddDialogOpen(true)
      return
    }

    try {
      if (usbConnection) {
        await disconnectUsbPrinter(
          usbConnection
        )
      }
    } catch (error) {
      console.error(
        "[USB] Disconnect error:",
        error
      )
    }

    try {
      if (bluetoothConnection) {
        await disconnectBluetoothPrinter(
          bluetoothConnection.device
        )
      }
    } catch (error) {
      console.error(
        "[Bluetooth] Disconnect error:",
        error
      )
    }

    setUsbConnection(null)
    setUsbConnected(false)

    setBluetoothConnection(null)
    setBluetoothConnected(false)

    setAddDialogOpen(false)
  }

  // =========================================================
  // CONNECTION SELECT
  // =========================================================

  function handleSelectConnection(
    type: ConnectionType | null
  ) {
    setSelectedConnection(type)
  }

  // =========================================================
  // USB CONNECT
  // =========================================================

  async function handleConnectUsb() {
    setUsbLoading(true)
    setUsbError(null)

    try {
      if (usbConnection) {
        await disconnectUsbPrinter(
          usbConnection
        )

        setUsbConnection(null)
        setUsbConnected(false)
      }

      const connection =
        await connectUsbPrinter()

      setUsbConnection(
        connection
      )

      setUsbConnected(true)

      setUsbDevice({
        vendorId:
          connection.device.vendorId,

        productId:
          connection.device.productId,

        serialNumber:
          connection.device.serialNumber ??
          null,

        manufacturerName:
          connection.device.manufacturerName,

        productName:
          connection.device.productName,
      })
    } catch (error) {
      console.error(
        "[USB] Connect error:",
        error
      )

      setUsbError(
        error instanceof Error
          ? error.message
          : "Gagal menghubungkan printer USB."
      )

      setUsbConnected(false)
      setUsbConnection(null)
      setUsbDevice(null)
    } finally {
      setUsbLoading(false)
    }
  }

  // =========================================================
  // USB TEST PRINT
  // =========================================================

  async function handleUsbTestPrint() {
    if (!usbConnection) return

    setUsbTestPrintLoading(true)
    setUsbError(null)

    try {
      await printUsbTest(
        usbConnection
      )
    } catch (error) {
      console.error(
        "[USB] Test print error:",
        error
      )

      setUsbError(
        error instanceof Error
          ? error.message
          : "Gagal mencetak test print."
      )
    } finally {
      setUsbTestPrintLoading(
        false
      )
    }
  }

  // =========================================================
  // USB SAVE
  // =========================================================

  async function handleSaveUsbPrinter() {
    if (!usbDevice) {
      setUsbSaveError(
        "Printer USB belum dipilih."
      )
      return
    }

    if (!usbPrinterName.trim()) {
      setUsbSaveError(
        "Nama printer wajib diisi."
      )
      return
    }

    setUsbSaveLoading(true)
    setUsbSaveError(null)
    setUsbSaveSuccess(false)

    try {
      const result =
        await saveUsbPrinterAction({
          name:
            usbPrinterName.trim(),

          vendorId:
            usbDevice.vendorId,

          productId:
            usbDevice.productId,

          serialNumber:
            usbDevice.serialNumber,

          printerModel:
            usbDevice.productName ??
            usbDevice.manufacturerName ??
            null,

          paperWidth:
            usbPaperWidth,

          isDefault:
            usbIsDefault,
        })

      if (!result.success) {
        throw new Error(
          result.error ||
            "Gagal menyimpan printer."
        )
      }

      setUsbSaveSuccess(true)

      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error(
        "[USB] Save printer error:",
        error
      )

      setUsbSaveError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan printer."
      )
    } finally {
      setUsbSaveLoading(
        false
      )
    }
  }

  // =========================================================
  // BLUETOOTH CONNECT
  // =========================================================

  async function handleConnectBluetooth() {
    setBluetoothLoading(true)
    setBluetoothError(null)

    try {
      if (bluetoothConnection) {
        await disconnectBluetoothPrinter(
          bluetoothConnection.device
        )

        setBluetoothConnection(null)
        setBluetoothConnected(false)
      }

      const connection =
        await connectBluetoothPrinter()

      setBluetoothConnection(
        connection
      )

      setBluetoothConnected(true)

      setBluetoothResult({
        name:
          connection.device.name ??
          null,

        id:
          connection.device.id,

        serviceCount:
          connection.services.length,

        writableCharacteristicUuid:
          connection
            .writableCharacteristic
            ?.uuid ?? null,
      })
    } catch (error) {
      console.error(
        "[Bluetooth] Connect error:",
        error
      )

      setBluetoothError(
        error instanceof Error
          ? error.message
          : "Gagal menghubungkan printer Bluetooth."
      )

      setBluetoothConnected(false)
      setBluetoothConnection(null)
      setBluetoothResult(null)
    } finally {
      setBluetoothLoading(false)
    }
  }

  // =========================================================
  // BLUETOOTH TEST PRINT
  // =========================================================

  async function handleBluetoothTestPrint() {
    if (!bluetoothConnection) return

    setBluetoothTestPrintLoading(
      true
    )

    setBluetoothError(null)

    try {
      await printBluetoothTest(
        bluetoothConnection
      )
    } catch (error) {
      console.error(
        "[Bluetooth] Test print error:",
        error
      )

      setBluetoothError(
        error instanceof Error
          ? error.message
          : "Gagal mencetak test print."
      )
    } finally {
      setBluetoothTestPrintLoading(
        false
      )
    }
  }

  // =========================================================
  // BLUETOOTH SAVE
  // =========================================================

  async function handleSaveBluetoothPrinter() {
    if (!bluetoothResult) {
      setBluetoothSaveError(
        "Printer Bluetooth belum dipilih."
      )
      return
    }

    if (!bluetoothPrinterName.trim()) {
      setBluetoothSaveError(
        "Nama printer wajib diisi."
      )
      return
    }

    if (
      !bluetoothResult
        .writableCharacteristicUuid
    ) {
      setBluetoothSaveError(
        "Characteristic Bluetooth untuk print tidak ditemukan."
      )
      return
    }

    setBluetoothSaveLoading(
      true
    )

    setBluetoothSaveError(null)
    setBluetoothSaveSuccess(
      false
    )

    try {
      const serviceUuid =
        bluetoothConnection?.services.find(
          (service) =>
            service.characteristics.some(
              (characteristic) =>
                characteristic.uuid ===
                bluetoothResult.writableCharacteristicUuid
            )
        )?.uuid ?? null

      const result =
        await saveBluetoothPrinterAction({
          name:
            bluetoothPrinterName.trim(),

          deviceName:
            bluetoothResult.name,

          deviceId:
            bluetoothResult.id,

          serviceUuid,

          characteristicUuid:
            bluetoothResult.writableCharacteristicUuid,

          printerModel:
            bluetoothResult.name ??
            null,

          paperWidth:
            bluetoothPaperWidth,

          isDefault:
            bluetoothIsDefault,
        })

      if (!result.success) {
        throw new Error(
          result.error ||
            "Gagal menyimpan printer."
        )
      }

      setBluetoothSaveSuccess(
        true
      )

      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error(
        "[Bluetooth] Save printer error:",
        error
      )

      setBluetoothSaveError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan printer."
      )
    } finally {
      setBluetoothSaveLoading(
        false
      )
    }
  }

  // =========================================================
  // SAVED USB TEST PRINT
  // =========================================================

  async function handleSavedUsbTestPrint(
    printer: Printer
  ) {
    if (
      printer.usb_vendor_id == null ||
      printer.usb_product_id == null
    ) {
      return
    }

    setSavedPrinterTestLoading(
      printer.id
    )

    try {
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
        await printUsbTest(
          connection
        )
      } finally {
        await disconnectUsbPrinter(
          connection
        )
      }
    } catch (error) {
      console.error(
        "[Saved USB Printer] Test print error:",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mencetak test print."
      )
    } finally {
      setSavedPrinterTestLoading(
        null
      )
    }
  }

  async function handleSavedBluetoothTestPrint(
    printer: Printer
  ) {
    if (
      !printer.bluetooth_device_id ||
      !printer.bluetooth_characteristic_uuid
    ) {
      toast.error(
        "Konfigurasi Bluetooth printer tidak lengkap."
      )
      return
    }

    setSavedPrinterTestLoading(
      printer.id
    )

    try {
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
        await printBluetoothTest(
          connection
        )
      } finally {
        await disconnectBluetoothPrinter(
          connection.device
        )
      }

      toast.success(
        "Test print berhasil dikirim."
      )
    } catch (error) {
      console.error(
        "[Saved Bluetooth Printer] Test print error:",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mencetak test print Bluetooth."
      )
    } finally {
      setSavedPrinterTestLoading(
        null
      )
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Printer
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola printer kasir untuk outlet ini.
          </p>
        </div>

        {canManagePrinter ? (
          <Button
            type="button"
            onClick={
              handleOpenAddPrinter
            }
          >
            Tambah Printer
          </Button>
        ) : null}
      </div>

      {printers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Belum ada printer
            </CardTitle>

            <CardDescription>
              Tambahkan printer USB atau Bluetooth
              untuk digunakan sebagai printer kasir.
            </CardDescription>
          </CardHeader>

          {canManagePrinter ? (
            <CardContent>
              <Button
                type="button"
                onClick={
                  handleOpenAddPrinter
                }
              >
                Tambah Printer
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : (
        <div className="grid gap-4">
          {printers.map(
            (printer) => (
              <Card key={printer.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        {printer.name}

                        {printer.is_default ? (
                          <Badge>
                            Default
                          </Badge>
                        ) : null}
                      </CardTitle>

                      <CardDescription className="mt-1">
                        {printer.connection_type ===
                        "usb"
                          ? "USB"
                          : "Bluetooth"}

                        {" • "}

                        {printer.paper_width}mm

                        {printer.printer_model
                          ? ` • ${printer.printer_model}`
                          : ""}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    {printer.connection_type === "usb" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        savedPrinterTestLoading === printer.id ||
                        deletePrinterId === printer.id ||
                        defaultPrinterId !== null
                      }
                      onClick={() =>
                        handleSavedUsbTestPrint(printer)
                      }
                    >
                      {savedPrinterTestLoading === printer.id
                        ? "Mencetak..."
                        : "Test Print"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        savedPrinterTestLoading === printer.id ||
                        deletePrinterId === printer.id ||
                        defaultPrinterId !== null
                      }
                      onClick={() =>
                        handleSavedBluetoothTestPrint(printer)
                      }
                    >
                      {savedPrinterTestLoading === printer.id
                        ? "Mencetak..."
                        : "Test Print"}
                    </Button>
                  )}

                    {canManagePrinter &&
                    !printer.is_default ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          defaultPrinterId ===
                            printer.id ||
                          deletePrinterId !== null
                        }
                        onClick={() =>
                          handleSetDefaultPrinter(
                            printer
                          )
                        }
                      >
                        {defaultPrinterId ===
                        printer.id
                          ? "Mengubah..."
                          : "Jadikan Default"}
                      </Button>
                    ) : null}

                    {canManagePrinter ? (
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={
                          deletePrinterId ===
                            printer.id ||
                          defaultPrinterId !== null
                        }
                        onClick={() =>
                          setDeleteDialogPrinter(
                            printer
                          )
                        }
                      >
                        {deletePrinterId ===
                        printer.id
                          ? "Menghapus..."
                          : "Hapus"}
                      </Button>
                    ) : null}
                  </div>

                  {printer.connection_type ===
                  "usb" ? (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Vendor ID:{" "}
                      {printer.usb_vendor_id ??
                        "-"}

                      {" • "}

                      Product ID:{" "}
                      {printer.usb_product_id ??
                        "-"}

                      {" • "}

                      Serial:{" "}
                      {printer.usb_serial_number ??
                        "-"}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div>
                        Device:{" "}
                        {printer.bluetooth_device_name ??
                          "-"}
                      </div>

                      <div className="break-all">
                        Device ID:{" "}
                        {printer.bluetooth_device_id ??
                          "-"}
                      </div>

                      <div className="break-all">
                        Characteristic:{" "}
                        {printer.bluetooth_characteristic_uuid ??
                          "-"}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      <AddPrinterDialog
        open={addDialogOpen}
        onOpenChange={
          handleCloseAddPrinter
        }
        selectedConnection={
          selectedConnection
        }
        onSelectConnection={
          handleSelectConnection
        }

        // =====================================================
        // USB
        // =====================================================

        usbDevice={usbDevice}
        usbConnected={
          usbConnected
        }
        usbLoading={usbLoading}
        usbTestPrintLoading={
          usbTestPrintLoading
        }
        usbPrinterName={
          usbPrinterName
        }
        usbPaperWidth={
          usbPaperWidth
        }
        usbIsDefault={
          usbIsDefault
        }
        usbSaveLoading={
          usbSaveLoading
        }
        usbError={usbError}
        usbSaveError={
          usbSaveError
        }
        usbSaveSuccess={
          usbSaveSuccess
        }
        onUsbPrinterNameChange={
          setUsbPrinterName
        }
        onUsbPaperWidthChange={
          setUsbPaperWidth
        }
        onUsbDefaultChange={
          setUsbIsDefault
        }
        onUsbConnect={
          handleConnectUsb
        }
        onUsbTestPrint={
          handleUsbTestPrint
        }
        onUsbSave={
          handleSaveUsbPrinter
        }

        // =====================================================
        // BLUETOOTH
        // =====================================================

        bluetoothResult={
          bluetoothResult
        }
        bluetoothConnected={
          bluetoothConnected
        }
        bluetoothLoading={
          bluetoothLoading
        }
        bluetoothTestPrintLoading={
          bluetoothTestPrintLoading
        }
        bluetoothError={
          bluetoothError
        }
        bluetoothPrinterName={
          bluetoothPrinterName
        }
        bluetoothPaperWidth={
          bluetoothPaperWidth
        }
        bluetoothIsDefault={
          bluetoothIsDefault
        }
        bluetoothSaveLoading={
          bluetoothSaveLoading
        }
        bluetoothSaveError={
          bluetoothSaveError
        }
        bluetoothSaveSuccess={
          bluetoothSaveSuccess
        }
        onBluetoothPrinterNameChange={
          setBluetoothPrinterName
        }
        onBluetoothPaperWidthChange={
          setBluetoothPaperWidth
        }
        onBluetoothDefaultChange={
          setBluetoothIsDefault
        }
        onBluetoothConnect={
          handleConnectBluetooth
        }
        onBluetoothTestPrint={
          handleBluetoothTestPrint
        }
        onBluetoothSave={
          handleSaveBluetoothPrinter
        }
      />

      {/* =====================================================
          DELETE PRINTER CONFIRMATION
          ===================================================== */}

      <AlertDialog
        open={
          deleteDialogPrinter !== null
        }
        onOpenChange={(open) => {
          if (
            !open &&
            deletePrinterId === null
          ) {
            setDeleteDialogPrinter(
              null
            )
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus printer?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Printer{" "}
              <span className="font-medium text-foreground">
                "{deleteDialogPrinter?.name}"
              </span>{" "}
              akan dihapus dari konfigurasi
              outlet ini. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                deletePrinterId !== null
              }
            >
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              disabled={
                deletePrinterId !== null
              }
              onClick={
                handleConfirmDelete
              }
            >
              {deletePrinterId !== null
                ? "Menghapus..."
                : "Hapus Printer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}