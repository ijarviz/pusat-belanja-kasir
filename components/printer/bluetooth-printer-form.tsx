"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  BluetoothIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Checkbox,
} from "@/components/ui/checkbox"

type BluetoothResult = {
  name: string | null
  id: string
  serviceCount: number
  writableCharacteristicUuid: string | null
}

type Props = {
  result:
    | BluetoothResult
    | null

  connected: boolean
  loading: boolean
  testPrintLoading: boolean
  error: string | null

  printerName: string
  paperWidth: number
  isDefault: boolean

  saveLoading: boolean
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

export default function BluetoothPrinterForm({
  result,
  connected,
  loading,
  testPrintLoading,
  error,

  printerName,
  paperWidth,
  isDefault,

  saveLoading,
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
            icon={BluetoothIcon}
            className="size-5"
          />
        </div>

        <div>
          <p className="font-medium">
            Printer Bluetooth
          </p>

          <p className="text-sm text-muted-foreground">
            Hubungkan printer thermal melalui
            Bluetooth.
          </p>
        </div>
      </div>

      {!result ? (
        <div className="rounded-lg border border-dashed p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada printer Bluetooth
            yang dipilih.
          </p>

          <Button
            type="button"
            className="mt-3"
            onClick={onConnect}
            disabled={loading}
          >
            {loading
              ? "Mencari..."
              : "Pilih Printer Bluetooth"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {result.name ||
                    "Bluetooth Printer"}
                </p>

                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {result.id}
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

            <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="font-medium">
                  Services
                </span>

                <br />

                {result.serviceCount}
              </div>

              <div>
                <span className="font-medium">
                  Writable Characteristic
                </span>

                <br />

                <span className="break-all">
                  {result.writableCharacteristicUuid ||
                    "-"}
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bluetooth-printer-name">
                Nama Printer
              </Label>

              <Input
                id="bluetooth-printer-name"
                value={printerName}
                onChange={(event) =>
                  onPrinterNameChange(
                    event.target.value
                  )
                }
                placeholder="Contoh: Printer Kasir Bluetooth"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bluetooth-paper-width">
                Lebar Kertas
              </Label>

              <select
                id="bluetooth-paper-width"
                value={paperWidth}
                onChange={(event) =>
                  onPaperWidthChange(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value={58}>
                  58mm
                </option>

                <option value={80}>
                  80mm
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="bluetooth-is-default"
                checked={isDefault}
                onCheckedChange={(checked) =>
                  onDefaultChange(
                    checked === true
                  )
                }
              />

              <Label
                htmlFor="bluetooth-is-default"
                className="cursor-pointer"
              >
                Jadikan printer default
              </Label>
            </div>
          </div>

          {saveError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {saveError}
            </div>
          ) : null}

          {saveSuccess ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-600">
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
              onClick={
                onTestPrint
              }
              disabled={
                !connected ||
                testPrintLoading ||
                !result.writableCharacteristicUuid
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
                !printerName.trim() ||
                !result.writableCharacteristicUuid
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