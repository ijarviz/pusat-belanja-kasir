"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getKasirVouchersAction } from "@/lib/vouchers/actions"
import {
  voucherBlockReason,
  type KasirVoucher,
  type VoucherLine,
} from "@/lib/vouchers/kasir-voucher"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format-currency"

function benefitLabel(voucher: KasirVoucher) {
  if (voucher.product_discount_type === "percentage") {
    return `Diskon ${voucher.product_discount_value ?? 0}%${
      voucher.product_max_discount ? ` s/d ${formatCurrency(voucher.product_max_discount)}` : ""
    }`
  }
  return `Potongan ${formatCurrency(voucher.product_discount_value ?? 0)}`
}

/*
 * Pilih voucher produk di dialog konfirmasi kasir (dialog tingkat dua).
 * Layout sama dengan VoucherSelector di toko online (store), ditambah
 * pencarian. Hanya voucher channel Semua / Toko Saja; yang belum memenuhi
 * syarat tetap tampil tapi tidak bisa dipilih.
 */
export default function KasirVoucherDialog({
  open,
  onOpenChange,
  value,
  lines,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: KasirVoucher | null
  lines: VoucherLine[]
  onChange: (voucher: KasirVoucher | null) => void
}) {
  // Komponen di-mount ulang setiap dialog dibuka (lihat kasir-dialog.tsx),
  // jadi state awal selalu dari pilihan saat ini dan daftar dimuat ulang.
  const [vouchers, setVouchers] = useState<KasirVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tempId, setTempId] = useState<string>(value?.id ?? "none")

  useEffect(() => {
    getKasirVouchersAction()
      .then(setVouchers)
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vouchers.filter(
      (v) =>
        !q ||
        v.code.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q)
    )
  }, [vouchers, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voucher Produk</DialogTitle>
          <DialogDescription>Pilih satu voucher yang ingin digunakan.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama voucher"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-6 text-sm text-muted-foreground">Loading voucher...</div>
        ) : (
          <>
            <RadioGroup
              value={tempId}
              onValueChange={setTempId}
              className="max-h-[350px] space-y-1 overflow-y-auto"
            >
              {vouchers.length > 0 && (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="none" id="kasir-voucher-none" />
                    <Label htmlFor="kasir-voucher-none" className="flex-1 cursor-pointer">
                      Tanpa Voucher
                    </Label>
                  </div>
                </div>
              )}

              {filtered.map((voucher) => {
                const blocked = voucherBlockReason(voucher, lines)

                return (
                  <div key={voucher.id} className={cn("rounded-lg border p-3", blocked && "opacity-60")}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={voucher.id}
                        id={`kasir-voucher-${voucher.id}`}
                        disabled={!!blocked}
                      />
                      <Label
                        htmlFor={`kasir-voucher-${voucher.id}`}
                        className={cn("flex-1", blocked ? "cursor-not-allowed" : "cursor-pointer")}
                      >
                        <div className="flex flex-col">
                          <div className="font-medium">{voucher.code}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {voucher.description || benefitLabel(voucher)}
                          </div>
                          {!voucher.all_products && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Berlaku untuk {voucher.product_ids.length} produk tertentu
                            </div>
                          )}
                          {blocked && <div className="mt-1 text-xs text-red-600">{blocked}</div>}
                        </div>
                      </Label>
                    </div>
                  </div>
                )
              })}

              {!filtered.length && (
                <div className="py-4 text-sm text-muted-foreground">
                  {vouchers.length ? "Voucher tidak ditemukan" : "Belum ada voucher tersedia"}
                </div>
              )}
            </RadioGroup>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  onChange(vouchers.find((v) => v.id === tempId) ?? null)
                  onOpenChange(false)
                }}
              >
                Simpan
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
