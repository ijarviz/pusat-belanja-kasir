"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

import ConnectionOption from "./connection-option"
import UsbPrinterForm from "./usb-printer-form"
import BluetoothPrinterForm from "./bluetooth-printer-form"

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

type Props = {
  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  selectedConnection:
    | ConnectionType
    | null

  onSelectConnection: (
    type: ConnectionType | null
  ) => void

  // =========================
  // USB
  // =========================

  usbDevice:
    | UsbDeviceResult
    | null

  usbConnected: boolean

  usbLoading: boolean

  usbTestPrintLoading: boolean

  usbPrinterName: string

  usbPaperWidth: number

  usbIsDefault: boolean

  usbSaveLoading: boolean

  usbError: string | null

  usbSaveError: string | null

  usbSaveSuccess: boolean

  onUsbPrinterNameChange: (
    value: string
  ) => void

  onUsbPaperWidthChange: (
    value: number
  ) => void

  onUsbDefaultChange: (
    value: boolean
  ) => void

  onUsbConnect: () => void

  onUsbTestPrint: () => void

  onUsbSave: () => void

  // =========================
  // BLUETOOTH
  // =========================

  bluetoothResult:
    | BluetoothResult
    | null

  bluetoothConnected: boolean

  bluetoothLoading: boolean

  bluetoothTestPrintLoading: boolean

  bluetoothError: string | null

  bluetoothPrinterName: string

  bluetoothPaperWidth: number

  bluetoothIsDefault: boolean

  bluetoothSaveLoading: boolean

  bluetoothSaveError: string | null

  bluetoothSaveSuccess: boolean

  onBluetoothPrinterNameChange: (
    value: string
  ) => void

  onBluetoothPaperWidthChange: (
    value: number
  ) => void

  onBluetoothDefaultChange: (
    value: boolean
  ) => void

  onBluetoothConnect: () => void

  onBluetoothTestPrint: () => void

  onBluetoothSave: () => void
}

export default function AddPrinterDialog({
  open,
  onOpenChange,

  selectedConnection,
  onSelectConnection,

  // =========================
  // USB
  // =========================

  usbDevice,
  usbConnected,
  usbLoading,
  usbTestPrintLoading,
  usbPrinterName,
  usbPaperWidth,
  usbIsDefault,
  usbSaveLoading,
  usbError,
  usbSaveError,
  usbSaveSuccess,

  onUsbPrinterNameChange,
  onUsbPaperWidthChange,
  onUsbDefaultChange,
  onUsbConnect,
  onUsbTestPrint,
  onUsbSave,

  // =========================
  // BLUETOOTH
  // =========================

  bluetoothResult,
  bluetoothConnected,
  bluetoothLoading,
  bluetoothTestPrintLoading,
  bluetoothError,

  bluetoothPrinterName,
  bluetoothPaperWidth,
  bluetoothIsDefault,
  bluetoothSaveLoading,
  bluetoothSaveError,
  bluetoothSaveSuccess,

  onBluetoothPrinterNameChange,
  onBluetoothPaperWidthChange,
  onBluetoothDefaultChange,
  onBluetoothConnect,
  onBluetoothTestPrint,
  onBluetoothSave,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Tambah Printer
          </DialogTitle>

          <DialogDescription>
            Pilih jenis koneksi printer yang
            ingin digunakan.
          </DialogDescription>
        </DialogHeader>

        {!selectedConnection ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ConnectionOption
              type="usb"
              title="USB"
              description="Hubungkan printer thermal melalui kabel USB."
              selected={false}
              onClick={() =>
                onSelectConnection(
                  "usb"
                )
              }
            />

            <ConnectionOption
              type="bluetooth"
              title="Bluetooth"
              description="Hubungkan printer thermal melalui Bluetooth."
              selected={false}
              onClick={() =>
                onSelectConnection(
                  "bluetooth"
                )
              }
            />
          </div>
        ) : null}

        {/* =========================
            USB
        ========================= */}

        {selectedConnection ===
        "usb" ? (
          <UsbPrinterForm
            device={usbDevice}
            connected={
              usbConnected
            }
            loading={
              usbLoading
            }
            testPrintLoading={
              usbTestPrintLoading
            }
            printerName={
              usbPrinterName
            }
            paperWidth={
              usbPaperWidth
            }
            isDefault={
              usbIsDefault
            }
            saveLoading={
              usbSaveLoading
            }
            error={
              usbError
            }
            saveError={
              usbSaveError
            }
            saveSuccess={
              usbSaveSuccess
            }
            onPrinterNameChange={
              onUsbPrinterNameChange
            }
            onPaperWidthChange={
              onUsbPaperWidthChange
            }
            onDefaultChange={
              onUsbDefaultChange
            }
            onConnect={
              onUsbConnect
            }
            onTestPrint={
              onUsbTestPrint
            }
            onSave={
              onUsbSave
            }
          />
        ) : null}

        {/* =========================
            BLUETOOTH
        ========================= */}

        {selectedConnection ===
        "bluetooth" ? (
          <BluetoothPrinterForm
            result={
              bluetoothResult
            }
            connected={
              bluetoothConnected
            }
            loading={
              bluetoothLoading
            }
            testPrintLoading={
              bluetoothTestPrintLoading
            }
            error={
              bluetoothError
            }
            printerName={
              bluetoothPrinterName
            }
            paperWidth={
              bluetoothPaperWidth
            }
            isDefault={
              bluetoothIsDefault
            }
            saveLoading={
              bluetoothSaveLoading
            }
            saveError={
              bluetoothSaveError
            }
            saveSuccess={
              bluetoothSaveSuccess
            }
            onPrinterNameChange={
              onBluetoothPrinterNameChange
            }
            onPaperWidthChange={
              onBluetoothPaperWidthChange
            }
            onDefaultChange={
              onBluetoothDefaultChange
            }
            onConnect={
              onBluetoothConnect
            }
            onTestPrint={
              onBluetoothTestPrint
            }
            onSave={
              onBluetoothSave
            }
          />
        ) : null}

        <DialogFooter>
          {selectedConnection ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                onSelectConnection(
                  null
                )
              }
            >
              Kembali
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}