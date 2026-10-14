"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Image01Icon,
  QrCode01Icon,
} from "@hugeicons/core-free-icons"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import { formatCurrency } from "@/lib/utils/format-currency"

import type {
  Product,
  Variant,
} from "@/lib/products/types"

type SelectedItem = {
  product: Product
  variant: Variant | null
  quantity: number
}

type PaymentMethod =
  | "cash"
  | "transfer"
  | "qris"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void

  items: SelectedItem[]
  total: number
  totalQuantity: number

  paymentMethod: PaymentMethod

  paymentOptions: {
    id: PaymentMethod
    label: string
    icon: typeof QrCode01Icon
  }[]

  adminName: string

  buyerName: string
  buyerPhone: string

  setBuyerName: (value: string) => void
  setBuyerPhone: (value: string) => void

  getPrice: (
    product: Product,
    variant: Variant | null
  ) => number

  onConfirm: () => void
  isProcessingPayment: boolean
}

export default function KasirDialog({
  open,
  onOpenChange,
  items,
  total,
  paymentMethod,
  paymentOptions,
  adminName,
  buyerName,
  buyerPhone,
  setBuyerName,
  setBuyerPhone,
  getPrice,
  onConfirm,
  isProcessingPayment,
}: Props) {
  const selectedPayment = paymentOptions.find(
    (option) => option.id === paymentMethod
  )

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Konfirmasi Pembayaran
          </DialogTitle>
        </DialogHeader>

        <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
            <Field>
                <FieldLabel htmlFor="buyer-name">
                Nama Pembeli
                </FieldLabel>

                <Input
                id="buyer-name"
                placeholder="Nama pembeli (opsional)"
                value={buyerName}
                onChange={(event) =>
                    setBuyerName(event.target.value)
                }
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="buyer-phone">
                Nomor WhatsApp
                </FieldLabel>

                <Input
                id="buyer-phone"
                type="tel"
                inputMode="tel"
                placeholder="08xxxxxxxxxx"
                value={buyerPhone}
                onChange={(event) =>
                    setBuyerPhone(event.target.value)
                }
                />
            </Field>
            </div>
        </FieldGroup>

        <ScrollArea className="max-h-[28vh] pr-4">
          <div className="space-y-6">

            {/* PRODUK */}
            <div>
              <div className="divide-y rounded-lg border">
                {items.map((item) => {
                  const price = getPrice(
                    item.product,
                    item.variant
                  )

                  const itemTotal =
                    price * item.quantity

                  const variantName =
                    item.variant?.name

                  const image =
                    item.variant?.urlImage ||
                    item.product.urlImage ||
                    null

                  return (
                    <div
                      key={`${item.product.id}-${item.variant?.id ?? "default"}`}
                      className="flex items-center gap-3 p-3"
                    >
                      <div className="size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {image ? (
                          <img
                            src={image}
                            alt={item.product.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <HugeiconsIcon
                              icon={Image01Icon}
                              size={18}
                              className="text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.product.name}
                        </p>

                        {variantName && (
                          <p className="truncate text-xs text-muted-foreground">
                            {variantName}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(price)} ×{" "}
                          {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatCurrency(itemTotal)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* PAYMENT SUMMARY */}
        <div className="rounded-lg border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Total Pembayaran
            </span>

            <span className="text-xl font-bold">
              {formatCurrency(total)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Metode Pembayaran
            </span>

            <span className="font-medium">
              {selectedPayment?.label}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Kasir
            </span>

            <span className="font-medium">
              {adminName || "Memuat..."}
            </span>
          </div>
        </div>

        <DialogFooter className="pt-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Kembali
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment
              ? "Memproses..."
              : "Pembeli Sudah Bayar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}