"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Image01Icon,
  QrCode01Icon,
} from "@hugeicons/core-free-icons"

import KasirVoucherDialog from "@/components/kasir/kasir-voucher-dialog"
import type { KasirVoucher, VoucherLine } from "@/lib/vouchers/kasir-voucher"

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
  // subtotal = sebelum voucher, total = yang dibayar (subtotal - discount).
  subtotal: number
  discount: number
  total: number
  totalQuantity: number

  voucher: KasirVoucher | null
  voucherLines: VoucherLine[]
  onVoucherChange: (voucher: KasirVoucher | null) => void

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
  subtotal,
  discount,
  total,
  voucher,
  voucherLines,
  onVoucherChange,
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

  const [voucherOpen, setVoucherOpen] = useState(false)

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

            <div className="text-right">
              {discount > 0 && (
                <div className="text-xs text-muted-foreground line-through">
                  {formatCurrency(subtotal)}
                </div>
              )}
              <span className="text-xl font-bold">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <Separator />

          {/* VOUCHER: dialog kedua (KasirVoucherDialog) */}
          <button
            type="button"
            onClick={() => setVoucherOpen(true)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
          >
            <span className="text-sm text-muted-foreground">
              Voucher
            </span>

            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              {voucher ? (
                <>
                  <span className="font-medium text-foreground">
                    {voucher.code}
                  </span>
                  {discount > 0 && (
                    <span className="text-green-600">
                      -{formatCurrency(discount)}
                    </span>
                  )}
                </>
              ) : (
                "Pilih"
              )}
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </span>
          </button>

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

      {voucherOpen && (
        <KasirVoucherDialog
          open
          onOpenChange={setVoucherOpen}
          value={voucher}
          lines={voucherLines}
          onChange={onVoucherChange}
        />
      )}
    </Dialog>
  )
}