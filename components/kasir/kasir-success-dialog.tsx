"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  onPrint: () => void
  isPrinting?: boolean
}

export default function KasirSuccessDialog({
  open,
  onClose,
  onPrint,
  isPrinting = false,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center text-center mt-3">
            <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-green-100">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={40}
                className="text-green-600"
              />
            </div>

            <DialogTitle className="text-xl">
              Pembayaran Berhasil
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full"
            onClick={onPrint}
            disabled={isPrinting}
          >
            <HugeiconsIcon
              icon={PrinterIcon}
              size={18}
              className="mr-1"
            />

            {isPrinting
              ? "Membuka Struk..."
              : "Cetak Struk"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
            disabled={isPrinting}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}