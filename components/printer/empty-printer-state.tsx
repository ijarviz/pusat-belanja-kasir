"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { PrinterIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"

type Props = {
  disabled: boolean
  onAdd: () => void
}

export default function EmptyPrinterState({
  disabled,
  onAdd,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon
          icon={PrinterIcon}
          className="size-6 text-muted-foreground"
        />
      </div>

      <h3 className="font-medium">
        Belum ada printer
      </h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Tambahkan printer USB atau Bluetooth
        untuk digunakan sebagai printer kasir.
      </p>

      <Button
        type="button"
        className="mt-4"
        disabled={disabled}
        onClick={onAdd}
      >
        Tambah Printer
      </Button>
    </div>
  )
}