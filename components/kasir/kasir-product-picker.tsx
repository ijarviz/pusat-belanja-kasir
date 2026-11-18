"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Product, Variant } from "@/lib/products/types"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format-currency"

const PAGE_SIZE = 40

type PickerRow = {
  key: string
  product: Product
  variant: Variant | null
  name: string
  image: string | null
  sku: string
  barcode: string
  stock: number
  price: number
  search: string
}

/*
 * Cari produk tanpa scan barcode (tombol di sebelah tombol scan kasir):
 * semua produk aktif outlet, satu baris per varian aktif ("Nama - Varian").
 * Cari berdasarkan nama, varian, SKU, atau barcode. Klik baris = tambah ke
 * daftar transaksi; stok habis tidak bisa dipilih. Komponen di-mount saat
 * dialog dibuka (lihat kasir-client.tsx).
 */
export default function KasirProductPicker({
  products,
  onOpenChange,
  onPick,
  getPrice,
}: {
  products: Product[]
  onOpenChange: (open: boolean) => void
  onPick: (product: Product, variant: Variant | null) => void
  getPrice: (product: Product, variant: Variant | null) => number
}) {
  const [search, setSearch] = useState("")
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinel = useRef<HTMLDivElement>(null)

  const rows = useMemo<PickerRow[]>(() => {
    const out: PickerRow[] = []

    for (const product of products) {
      if (product.status !== "active") continue

      const variants = product.has_variant
        ? (product.variants ?? []).filter((v) => v.status === "active" && !v.deletedAt)
        : []

      if (product.has_variant) {
        for (const variant of variants) {
          out.push({
            key: `${product.id}:${variant.id}`,
            product,
            variant,
            name: `${product.name} - ${variant.name}`,
            image: variant.urlImage || product.urlImage || null,
            sku: variant.sku || "",
            barcode: variant.barcode || "",
            stock: Number(variant.stock ?? 0),
            price: getPrice(product, variant),
            search: [product.name, variant.name, variant.sku, variant.barcode].join(" ").toLowerCase(),
          })
        }
        continue
      }

      out.push({
        key: product.id,
        product,
        variant: null,
        name: product.name,
        image: product.urlImage || null,
        sku: product.sku || "",
        barcode: product.barcode || "",
        stock: Number(product.stock ?? 0),
        price: getPrice(product, null),
        search: [product.name, product.sku, product.barcode].join(" ").toLowerCase(),
      })
    }

    return out
  }, [products, getPrice])

  const filtered = useMemo(() => {
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return rows
    return rows.filter((row) => terms.every((t) => row.search.includes(t)))
  }, [rows, search])

  // Muat baris berikutnya saat daftar di-scroll ke bawah.
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => v + PAGE_SIZE)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [filtered])

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cari Produk</DialogTitle>
          <DialogDescription>Klik produk untuk menambahkannya ke daftar transaksi.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            autoFocus
            placeholder="Cari nama, varian, SKU, atau barcode"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setVisible(PAGE_SIZE)
            }}
          />
        </div>

        <div className="text-xs text-muted-foreground">{filtered.length} produk</div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Produk tidak ditemukan</div>
          ) : (
            <ul className="divide-y">
              {filtered.slice(0, visible).map((row) => {
                const empty = row.stock <= 0

                return (
                  <li key={row.key}>
                    <button
                      type="button"
                      disabled={empty}
                      onClick={() => onPick(row.product, row.variant)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left",
                        empty ? "cursor-not-allowed opacity-50 grayscale" : "hover:bg-muted/60"
                      )}
                    >
                      <div className="size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {row.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.image} alt={row.name} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <HugeiconsIcon icon={Image01Icon} size={18} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{row.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          SKU: {row.sku || "-"} · Barcode: {row.barcode || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(row.price)}</div>
                      </div>

                      <div className={cn("shrink-0 text-right text-xs", empty ? "text-destructive" : "text-muted-foreground")}>
                        {empty ? "Stok habis" : `Stok ${row.stock}`}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {visible < filtered.length && (
            <div ref={sentinel} className="py-3 text-center text-xs text-muted-foreground">
              Memuat produk...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
