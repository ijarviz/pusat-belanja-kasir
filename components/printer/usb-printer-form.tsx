"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { UsbIcon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type UsbDeviceResult = {
  vendorId: number
  productId: number
  serialNumber: string | null
  manufacturerName?: string
  productName?: string
}

type Props = {
  device: UsbDeviceResult | null
  connected: boolean
  loading: boolean
  testPrintLoading: boolean
  printerName: string
  paperWidth: number
  isDefault: boolean
  saveLoading: boolean
  error: string | null
  saveError: string | null
  saveSuccess: boolean

  onPrinterNameChange: (
    value: string
  ) => void

  onPaperWidthChange: (
    value: number
  ) => void

  onDefaultChange: (
    value: boolean
  ) => void

  onConnect: () => void
  onTestPrint: () => void
  onSave: () => void
}

export default function UsbPrinterForm({
  device,
  connected,
  loading,
  testPrintLoading,
  printerName,
  paperWidth,
  isDefault,
  saveLoading,
  error,
  saveError,
  saveSuccess,
  onPrinterNameChange,
  onPaperWidthChange,
  onDefaultChange,
  onConnect,
  onTestPrint,
  onSave,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-lg border p-4">
        <div className="flex size-10 items-center justify-center rounded-md border">
          <HugeiconsIcon
            icon={UsbIcon}
            className="size-5"
          />
        </div>

        <div className="min-w-0">
          <p className="font-medium">
            Printer USB
          </p>

          <p className="text-sm text-muted-foreground">
            Hubungkan printer thermal melalui
            USB.
          </p>
        </div>
      </div>

      {!device ? (
        <div className="rounded-lg border border-dashed p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada printer USB yang dipilih.
          </p>

          <Button
            type="button"
            className="mt-3"
            onClick={onConnect}
            disabled={loading}
          >
            {loading
              ? "Menghubungkan..."
              : "Pilih Printer USB"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {device.productName ||
                    "USB Printer"}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {device.manufacturerName ||
                    "Unknown manufacturer"}
                </p>
              </div>

              <Badge
                variant={
                  connected
                    ? "default"
                    : "secondary"
                }
              >
                {connected
                  ? "Terhubung"
                  : "Terdeteksi"}
              </Badge>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div>
                <span className="font-medium">
                  Vendor ID
                </span>
                <br />
                {device.vendorId}
              </div>

              <div>
                <span className="font-medium">
                  Product ID
                </span>
                <br />
                {device.productId}
              </div>

              <div>
                <span className="font-medium">
                  Serial
                </span>
                <br />
                {device.serialNumber || "-"}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="printer-name"
                className="text-sm font-medium"
              >
                Nama Printer
              </label>

              <Input
                id="printer-name"
                value={printerName}
                onChange={(event) =>
                  onPrinterNameChange(
                    event.target.value
                  )
                }
                placeholder="Printer Kasir USB"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="paper-width"
                className="text-sm font-medium"
              >
                Lebar Kertas
              </label>

              <Input
                id="paper-width"
                type="number"
                min={58}
                max={80}
                value={paperWidth}
                onChange={(event) =>
                  onPaperWidthChange(
                    Number(event.target.value)
                  )
                }
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) =>
                onDefaultChange(
                  event.target.checked
                )
              }
              className="mt-1"
            />

            <div>
              <p className="text-sm font-medium">
                Jadikan printer default
              </p>

              <p className="text-sm text-muted-foreground">
                Printer ini akan digunakan untuk
                print otomatis.
              </p>
            </div>
          </label>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {saveError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {saveError}
            </div>
          ) : null}

          {saveSuccess ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm">
              Printer berhasil disimpan.
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onConnect}
              disabled={loading}
            >
              {loading
                ? "Menghubungkan..."
                : "Hubungkan Ulang"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onTestPrint}
              disabled={
                !connected ||
                testPrintLoading
              }
            >
              {testPrintLoading
                ? "Mencetak..."
                : "Test Print"}
            </Button>

            <Button
              type="button"
              onClick={onSave}
              disabled={
                !connected ||
                saveLoading ||
                !printerName.trim()
              }
            >
              {saveLoading
                ? "Menyimpan..."
                : "Simpan Printer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}