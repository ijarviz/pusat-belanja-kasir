"use client"

import * as React from "react"

import {
  Package,
} from "lucide-react"

import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

import { formatCurrency } from "@/lib/utils/format-currency"

import type {
  Product,
  Variant,
} from "@/lib/products/types"

type ProductResult = {
  product: Product
  variant: Variant | null
}

type Props = {
  initialProducts: Product[]
}

export default function CekHargaClient({
  initialProducts,
}: Props) {
  const inputRef =
    React.useRef<HTMLInputElement>(null)

  const [search, setSearch] =
    React.useState("")

  const [error, setError] =
    React.useState("")

  const [selectedItem, setSelectedItem] =
    React.useState<ProductResult | null>(null)

  const [searchResults, setSearchResults] =
    React.useState<ProductResult[]>([])

  const [showResults, setShowResults] =
    React.useState(false)

  const getPrice = (
    product: Product,
    variant: Variant | null
  ) => {
    const price =
      variant?.price ??
      product.price

    const priceDisc =
      variant?.priceDisc ??
      product.priceDisc

    if (
      priceDisc !== null &&
      priceDisc !== undefined &&
      priceDisc > 0
    ) {
      return priceDisc
    }

    return price
  }

  const searchProducts = (
    value: string
  ): ProductResult[] => {
    const keyword =
      value.trim().toLowerCase()

    if (!keyword) {
      return []
    }

    const results: ProductResult[] = []

    for (const product of initialProducts) {
      const productName =
        product.name?.toLowerCase() ?? ""

      const productSku =
        product.sku?.toLowerCase() ?? ""

      const productBarcode =
        product.barcode?.toLowerCase() ?? ""

      /*
       * Produk tanpa variant
       */
      if (!product.has_variant) {
        const matched =
          productName.includes(keyword) ||
          productSku.includes(keyword) ||
          productBarcode === keyword

        if (matched) {
          results.push({
            product,
            variant: null,
          })
        }

        continue
      }

      /*
       * Produk dengan variant
       */
      if (product.variants?.length) {
        for (const variant of product.variants) {
          const variantName =
            variant.name?.toLowerCase() ?? ""

          const variantSku =
            variant.sku?.toLowerCase() ?? ""

          const variantBarcode =
            variant.barcode?.toLowerCase() ?? ""

          const matched =
            productName.includes(keyword) ||
            productSku.includes(keyword) ||
            variantName.includes(keyword) ||
            variantSku.includes(keyword) ||
            productBarcode === keyword ||
            variantBarcode === keyword

          if (matched) {
            results.push({
              product,
              variant,
            })
          }
        }
      }
    }

    return results
  }

  const handleSearch = (
    value?: string
  ) => {
    const keyword =
      (value ?? search).trim()

    if (!keyword) {
      return
    }

    const results =
      searchProducts(keyword)

    if (results.length === 0) {
      setError(
        `Produk "${keyword}" tidak ditemukan.`
      )

      setSelectedItem(null)
      setSearchResults([])
      setShowResults(false)

      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })

      return
    }

    setError("")

    /*
     * Kalau cuma ketemu 1 hasil,
     * langsung buka detail.
     */
    if (results.length === 1) {
      setSelectedItem(results[0])
      setSearchResults([])
      setShowResults(false)
    } else {
      /*
       * Kalau banyak hasil,
       * tampilkan pilihan.
       */
      setSelectedItem(null)
      setSearchResults(results)
      setShowResults(true)
    }
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()

    handleSearch()
  }

  const closeDialog = () => {
    setSelectedItem(null)
    setSearchResults([])
    setShowResults(false)
    setSearch("")

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const selectResult = (
    result: ProductResult
  ) => {
    setShowResults(false)
    setSearchResults([])
    setSelectedItem(result)
  }

  return (
    <>
      <div className="min-h-[calc(100vh-2rem)]">

        <div className="flex">

          <Card className="w-full max-w-3xl gap-2">
            <CardHeader>
              <CardDescription>
                Cari nama produk atau kode barcode untuk cek harga
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                  <InputGroup className="h-12 ps-2 !rounded-5xl">
                    <InputGroupInput
                      ref={inputRef}
                      autoFocus
                      value={search}
                      onChange={(event) => {
                        setSearch(
                          event.target.value
                        )

                        if (error) {
                          setError("")
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Scan barcode, nama produk, variant, atau SKU"
                      className="!text-lg"
                    />
                    <InputGroupAddon>
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={20}
                        className="text-muted-foreground"
                      />
                    </InputGroupAddon>
                  </InputGroup>
                  <Button
                    type="button"
                    className="size-12 w-18"
                    onClick={() =>
                      handleSearch()
                    }
                  >
                    Cari
                  </Button>
                </div>

                {/* <div className="flex gap-2">

                  <div className="relative flex-1">

                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={112}
                      className="!h-6 !w-6" 
                    />

                    <Input
                      ref={inputRef}
                      autoFocus
                      value={search}
                      onChange={(event) => {
                        setSearch(
                          event.target.value
                        )

                        if (error) {
                          setError("")
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Scan barcode, nama produk, variant, atau SKU"
                      className="h-14 pl-12 pr-4 text-lg"
                    />

                  </div>

                  <Button
                    type="button"
                    className="size-14 w-18"
                    onClick={() =>
                      handleSearch()
                    }
                  >
                    Cari
                  </Button>

                </div> */}

                {error && (
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                )}

              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {/* =========================
          HASIL PENCARIAN
      ========================= */}

      <Dialog
        open={showResults}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
      >
        <DialogContent className="max-w-lg">

          <DialogHeader>
            <DialogTitle>
              Pilih Produk
            </DialogTitle>

            <DialogDescription>
              Ditemukan {searchResults.length} produk.
              Pilih produk untuk melihat detailnya.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">

            <div className="divide-y">

              {searchResults.map(
                (result, index) => {
                  const image =
                    result.variant
                      ?.urlImage ||
                    result.product.urlImage ||
                    null

                  const price =
                    getPrice(
                      result.product,
                      result.variant
                    )

                  return (
                    <button
                      key={`${result.product.id}-${result.variant?.id ?? "default"}-${index}`}
                      type="button"
                      onClick={() =>
                        selectResult(result)
                      }
                      className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted"
                    >

                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">

                        {image ? (
                          <img
                            src={image}
                            alt={result.product.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Package className="size-5 text-muted-foreground" />
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate font-medium">
                          {result.product.name}
                        </p>

                        {result.variant && (
                          <p className="truncate text-sm text-muted-foreground">
                            {result.variant.name}
                          </p>
                        )}

                        <p className="mt-0.5 text-sm font-semibold">
                          {formatCurrency(price)}
                        </p>

                      </div>

                    </button>
                  )
                }
              )}

            </div>

          </div>

        </DialogContent>
      </Dialog>

      {/* =========================
          DETAIL HARGA
      ========================= */}

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
      >
        <DialogContent className="max-w-md">

          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Detail Produk
                </DialogTitle>

                <DialogDescription>
                  Informasi harga jual produk
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">

                {/* Image */}

                <div className="flex justify-center">

                  <div className="flex size-32 items-center justify-center overflow-hidden rounded-xl border bg-muted">

                    {(
                      selectedItem.variant
                        ?.urlImage ||
                      selectedItem.product.urlImage
                    ) ? (
                      <img
                        src={
                          selectedItem.variant
                            ?.urlImage ||
                          selectedItem.product
                            .urlImage ||
                          ""
                        }
                        alt={
                          selectedItem.product
                            .name
                        }
                        className="size-full object-cover"
                      />
                    ) : (
                      <Package className="size-10 text-muted-foreground" />
                    )}

                  </div>

                </div>

                {/* Product info */}

                <div className="space-y-3">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Nama Produk
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {
                        selectedItem.product
                          .name
                      }
                    </p>
                  </div>

                  {selectedItem.variant && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Variant
                      </p>

                      <p className="mt-1 font-medium">
                        {
                          selectedItem.variant
                            .name
                        }
                      </p>
                    </div>
                  )}

                  {(
                    selectedItem.variant?.sku ||
                    selectedItem.product.sku
                  ) && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        SKU
                      </p>

                      <p className="mt-1 font-mono text-sm">
                        {
                          selectedItem.variant
                            ?.sku ||
                          selectedItem.product
                            .sku
                        }
                      </p>
                    </div>
                  )}

                </div>

                <Separator />

                {/* Price */}

                <div className="rounded-xl bg-muted p-5 text-center">

                  <p className="text-sm text-muted-foreground">
                    Harga Jual
                  </p>

                  <p className="mt-1 text-4xl font-bold">
                    {formatCurrency(
                      getPrice(
                        selectedItem.product,
                        selectedItem.variant
                      )
                    )}
                  </p>

                </div>

              </div>
            </>
          )}

        </DialogContent>
      </Dialog>
    </>
  )
}