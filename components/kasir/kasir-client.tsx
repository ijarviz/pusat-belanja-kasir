"use client"

import * as React from "react"

import {
  Minus,
  Plus,
} from "lucide-react"

import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon, BarcodeScanIcon, ShoppingBag02Icon, QrCode01Icon, CreditCardIcon, Money03Icon } from "@hugeicons/core-free-icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Card,
  CardContent,
 } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

import KasirDialog from "@/components/kasir/kasir-dialog"

import {
  createStoreTransactionAction,
  getCurrentUserDisplayNameAction,
} from "@/lib/transactions/checkout-actions"

import { formatCurrency } from "@/lib/utils/format-currency"

import KasirSuccessDialog from "@/components/kasir/kasir-success-dialog"
import { printTransaction } from "@/lib/printer/transaction-print"

import type { Transaction } from "@/lib/transactions/types"

import { toast } from "sonner"

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
  initialProducts: Product[]
}

export default function KasirClient({
  initialProducts,
}: Props) {
  const inputRef =
    React.useRef<HTMLInputElement>(null)

  const [itemToRemove, setItemToRemove] =
    React.useState<{
      productId: string
      variantId: string | null
      name: string
    } | null>(null)

  const [barcode, setBarcode] =
    React.useState("")

  const [items, setItems] =
    React.useState<SelectedItem[]>([])

  const [error, setError] =
    React.useState("")

  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("qris")

  const [paymentDialogOpen, setPaymentDialogOpen] =
    React.useState(false)

  const [buyerName, setBuyerName] =
    React.useState("")

  const [buyerPhone, setBuyerPhone] =
    React.useState("")

  const [adminName, setAdminName] =
    React.useState("")

  const [isProcessingPayment, setIsProcessingPayment] =
    React.useState(false)

  const [successDialogOpen, setSuccessDialogOpen] =
    React.useState(false)

  const [successTransaction, setSuccessTransaction] =
    React.useState<Transaction | null>(null)

  const [isPrinting, setIsPrinting] =
    React.useState(false)

  React.useEffect(() => {
    const getUser = async () => {
      const displayName =
        await getCurrentUserDisplayNameAction()

      setAdminName(displayName)
    }

    getUser()
  }, [])

  const findByBarcode = (
    value: string
  ) => {
    const code = value.trim()

    if (!code) return null

    for (const product of initialProducts) {
      if (
        !product.has_variant &&
        product.barcode === code
      ) {
        return {
          product,
          variant: null,
        }
      }

      if (product.variants?.length) {
        const variant =
          product.variants.find(
            (item) =>
              item.barcode === code
          )

        if (variant) {
          return {
            product,
            variant,
          }
        }
      }
    }

    return null
  }

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

  const getStock = (
    product: Product,
    variant: Variant | null
  ) => {
    return (
      variant?.stock ??
      product.stock
    )
  }

  const handleScan = (
    value?: string
  ) => {
    const code =
      (value ?? barcode).trim()

    if (!code) return

    const result =
      findByBarcode(code)

    if (!result) {
      setError(
        `Produk dengan barcode "${code}" tidak ditemukan.`
      )

      setBarcode("")

      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })

      return
    }

    setError("")

    const stock = getStock(
      result.product,
      result.variant
    )

    const existingIndex =
      items.findIndex(
        (item) =>
          item.product.id ===
            result.product.id &&
          item.variant?.id ===
            result.variant?.id
      )

    if (existingIndex !== -1) {
      setItems((current) => {
        const next = [...current]
        const item =
          next[existingIndex]

        if (
          item.quantity >= stock
        ) {
          return current
        }

        next[existingIndex] = {
          ...item,
          quantity:
            item.quantity + 1,
        }

        return next
      })
    } else {
      if (stock <= 0) {
        setError(
          `Stok ${result.product.name} habis.`
        )

        setBarcode("")

        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })

        return
      }

      setItems((current) => [
        ...current,
        {
          product: result.product,
          variant: result.variant,
          quantity: 1,
        },
      ])
    }

    setBarcode("")

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()

    handleScan()
  }

  const decreaseQuantity = (
    index: number
  ) => {
    const item = items[index]

    if (!item) return

    // Jika qty 1, tampilkan konfirmasi hapus
    if (item.quantity === 1) {
      setItemToRemove({
        productId: item.product.id,
        variantId: item.variant?.id ?? null,
        name: item.product.name,
      })

      return
    }

    // Jika qty lebih dari 1, kurangi seperti biasa
    setItems((current) => {
      const next = [...current]
      const currentItem = next[index]

      if (!currentItem) return current

      next[index] = {
        ...currentItem,
        quantity: currentItem.quantity - 1,
      }

      return next
    })

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const increaseQuantity = (
    index: number
  ) => {
    setItems((current) => {
      const next = [...current]
      const item = next[index]

      const stock = getStock(
        item.product,
        item.variant
      )

      if (
        item.quantity >= stock
      ) {
        return current
      }

      next[index] = {
        ...item,
        quantity:
          item.quantity + 1,
      }

      return next
    })

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const handleRemoveItem = () => {
    if (!itemToRemove) return

    setItems((current) =>
      current.filter(
        (item) =>
          !(
            item.product.id ===
              itemToRemove.productId &&
            (item.variant?.id ?? null) ===
              itemToRemove.variantId
          )
      )
    )

    setItemToRemove(null)

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const updateQuantity = (
    index: number,
    value: number
  ) => {
    setItems((current) => {
      const next = [...current]
      const item = next[index]

      const stock = getStock(
        item.product,
        item.variant
      )

      if (
        Number.isNaN(value)
      ) {
        return current
      }

      const quantity =
        Math.max(
          1,
          Math.min(stock, value)
        )

      next[index] = {
        ...item,
        quantity,
      }

      return next
    })
  }

  const total = items.reduce(
    (sum, item) => {
      const price = getPrice(
        item.product,
        item.variant
      )

      return (
        sum +
        price * item.quantity
      )
    },
    0
  )

  const totalQuantity =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    )

  const paymentOptions = [
    {
      id: "qris" as const,
      label: "QRIS",
      icon: QrCode01Icon,
    },
    {
      id: "transfer" as const,
      label: "Transfer",
      icon: CreditCardIcon,
    },
    {
      id: "cash" as const,
      label: "Tunai",
      icon: Money03Icon,
    },
  ]

  const handleOpenPaymentDialog = () => {
    if (items.length === 0) return

    setPaymentDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (items.length === 0) return
    if (isProcessingPayment) return

    setIsProcessingPayment(true)
    setError("")

    try {
      const firstProduct = items[0]?.product

      const outletId =
        firstProduct?.outletId ?? null

      if (!outletId) {
        throw new Error(
          "Outlet produk tidak ditemukan."
        )
      }

      /*
      * ==========================================
      * SNAPSHOT PRODUK
      * ==========================================
      */

      const products = items.map((item) => {
        const price = getPrice(
          item.product,
          item.variant
        )

        const stock = getStock(
          item.product,
          item.variant
        )

        const image =
          item.variant?.urlImage ||
          item.product.urlImage ||
          null

        const variantName =
          item.variant?.name || null

        return {
          qty: item.quantity,

          name: item.product.name,

          image,

          price,

          stock,

          selected: true,

          snapshot: {
            name: item.product.name,
            image,
            price,
            variantName,
          },

          productId:
            item.product.id,

          variantId:
            item.variant?.id ?? null,

          statusType:
            stock <= 0
              ? "out_of_stock"
              : stock <= 10
                ? "low_stock"
                : "available",

          variantName,

          availableStock: stock,
        }
      })

      /*
      * ==========================================
      * CREATE TRANSACTION + STOCK MOVEMENT
      * ==========================================
      */

      const result =
        await createStoreTransactionAction({
          outletId,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          paymentMethod,
          products,
          subtotal: total,
          total,
        })

      if (!result.success) {
        throw new Error(result.message)
      }

      const transaction = result.transaction

      console.log(
        "[Kasir] Transaction berhasil:",
        transaction.id
      )

      /*
      * ==========================================
      * SIMPAN TRANSACTION UNTUK SUCCESS DIALOG
      * ==========================================
      */

      setSuccessTransaction(
        transaction as Transaction
      )

      /*
      * ==========================================
      * TUTUP PAYMENT DIALOG
      * ==========================================
      */

      setPaymentDialogOpen(false)

      /*
      * ==========================================
      * RESET KERANJANG
      * ==========================================
      */

      setItems([])

      setBuyerName("")

      setBuyerPhone("")

      /*
      * ==========================================
      * BUKA SUCCESS DIALOG
      * ==========================================
      */

      setSuccessDialogOpen(true)

      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })

    } catch (error) {
      console.error(
        "[Kasir] Gagal membuat transaksi:",
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : "Gagal memproses pembayaran."
      )

    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handlePrintSuccessTransaction =
    async () => {
      if (!successTransaction) {
        toast.error(
          "Data transaksi tidak ditemukan."
        )

        return
      }

      if (isPrinting) {
        return
      }

      const toastId =
        `kasir-print-${successTransaction.id}`

      setIsPrinting(true)

      try {
        toast.loading(
          "Mengirim transaksi ke printer...",
          {
            id: toastId,
          }
        )

        await printTransaction(
          successTransaction
        )

        toast.success(
          "Transaksi berhasil dikirim ke printer.",
          {
            id: toastId,
          }
        )

        /*
        * Dialog boleh tetap terbuka.
        *
        * User masih bisa menekan Tutup
        * setelah selesai print.
        */
      } catch (error) {
        console.error(
          "[Kasir Print]",
          error
        )

        toast.error(
          error instanceof Error
            ? error.message
            : "Gagal mencetak transaksi.",
          {
            id: toastId,
          }
        )
      } finally {
        setIsPrinting(false)
      }
    }

  const handleCloseSuccessDialog =
    () => {
      setSuccessDialogOpen(false)
      setSuccessTransaction(null)

      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }

  return (
    <div className="min-h-[calc(100vh-2rem)]">
      <div className="">

        <div className="flex flex-col items-stretch gap-4 lg:flex-row">
          
          <Card className="w-full min-w-0 lg:w-5/7 pb-2 overflow-scroll">
            <CardContent>
              
              <div className="flex flex-col justify-between pb-6">
                <div className="flex gap-3 items-center">
                  <InputGroup className="h-16 ps-2 !rounded-5xl">
                    <InputGroupInput 
                      placeholder="1234567890" 
                      ref={inputRef}
                      autoFocus
                      value={barcode}
                      onChange={(event) =>
                        setBarcode(
                          event.target.value
                        )
                      }
                      onKeyDown={handleKeyDown}
                      className="!text-xl lg:!text-2xl"
                    />
                  </InputGroup>
                  <Button
                    variant="default"
                      onClick={() => handleScan()}
                      className="h-14 w-14"
                  >
                    <HugeiconsIcon
                      icon={BarcodeScanIcon}
                      size={112}
                      className="!h-6 !w-6" 
                    />
                  </Button>

                </div>
                
                {error && (
                  <p className="mt-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <Separator />

              <div className="max-h-[420px] overflow-y-auto">

                {items.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center p-8">
                    <div className="text-center">

                      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                        {/* <Package className="size-7 text-muted-foreground" /> */}
                        <HugeiconsIcon
                          icon={ShoppingBag02Icon}
                          size={32}
                        />
                      </div>

                      <p className="font-medium">
                        Belum ada transaksi
                      </p>

                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Scan barcode produk untuk menambahkan daftar transaksi.
                      </p>

                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map(
                      (item, index) => {
                        const price =
                          getPrice(
                            item.product,
                            item.variant
                          )

                        const stock =
                          getStock(
                            item.product,
                            item.variant
                          )

                        const itemTotal =
                          price *
                          item.quantity

                        const productName =
                          item.product.name

                        const variantName =
                          item.variant?.name

                        const image =
                          item.variant
                            ?.urlImage ||
                          item.product
                            .urlImage ||
                          null

                        return (
                          <div
                            key={`${item.product.id}-${item.variant?.id ?? "default"}`}
                            className="flex flex-col xl:flex-row items-center gap-4 py-5 w-full"
                          >
                            <div className="flex gap-4 w-full">

                              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={productName}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <HugeiconsIcon
                                    icon={Image01Icon}
                                    size={20}
                                    className="text-muted-foreground"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {
                                    productName
                                  }
                                </p>

                                {variantName && (
                                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                    {
                                      variantName
                                    }
                                  </p>
                                )}

                                <p className="mt-1 text-sm text-muted-foreground">
                                  {formatCurrency(
                                    price
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-row justify-between xl:justify-end w-full items-center">
                              <div className="flex shrink-0 items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  // disabled={false}
                                  onClick={() =>
                                    decreaseQuantity(
                                      index
                                    )
                                  }
                                >
                                  <Minus className="size-3.5" />
                                </Button>

                                <Input
                                  type="number"
                                  min={1}
                                  max={stock}
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateQuantity(
                                      index,
                                      Number(
                                        event
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  className="h-8 w-14 px-1 text-center"
                                />

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  disabled={
                                    item.quantity >=
                                    stock
                                  }
                                  onClick={() =>
                                    increaseQuantity(
                                      index
                                    )
                                  }
                                >
                                  <Plus className="size-3.5" />
                                </Button>
                              </div>

                              {/* Item Total */}
                              <div className="w-28 shrink-0 text-right">
                                <p className="font-semibold">
                                  {formatCurrency(
                                    itemTotal
                                  )}
                                </p>
                              </div>
                            </div>


                          </div>
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            
            </CardContent>

          </Card>

          <Card className="w-full min-w-0 overflow-hidden lg:w-2/7 h-max">
            <CardContent className="flex flex-col gap-5">
              <div>

                <div className="flex items-center justify-between">
                  <div className=" w-full">
                    <p className="text-sm text-muted-foreground">
                      Total Pembayaran
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <p className="mt-1 text-3xl font-bold">
                        {formatCurrency(total)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {totalQuantity} item(s)
                      </p>
                    </div>

                  </div>
                </div>

                <Separator className="my-5" />

                <div>
                  <p className="mb-3 text-sm font-medium">
                    Metode Pembayaran
                  </p>

                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 xl:grid-cols-3">
                    {paymentOptions.map((option) => {
                      const active =
                        paymentMethod === option.id

                      return (
                        <Button
                          key={option.id}
                          type="button"
                          variant={
                            active
                              ? "default"
                              : "outline"
                          }
                          className="xl:!flex-col gap-2 h-16 xl:h-24"
                          onClick={() =>
                            setPaymentMethod(option.id)
                          }
                        >
                          <HugeiconsIcon
                            icon={option.icon}
                            size={172}
                            className="!w-6 !h-6"
                          />

                          <span className="text-base">
                            {option.label}
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

              </div>

              <Separator />

              <div>
                <Button
                  type="button"
                  size="lg"
                  className="h-12 w-full text-base font-semibold"
                  disabled={items.length === 0}
                  onClick={handleOpenPaymentDialog}
                >
                  Proses Pembayaran
                </Button>
              </div>

            </CardContent>

          </Card>
          
          <KasirDialog
            open={paymentDialogOpen}
            onOpenChange={
              setPaymentDialogOpen
            }
            items={items}
            total={total}
            totalQuantity={
              totalQuantity
            }
            paymentMethod={
              paymentMethod
            }
            paymentOptions={
              paymentOptions
            }
            adminName={
              adminName
            }
            buyerName={
              buyerName
            }
            buyerPhone={
              buyerPhone
            }
            setBuyerName={
              setBuyerName
            }
            setBuyerPhone={
              setBuyerPhone
            }
            getPrice={
              getPrice
            }
            onConfirm={
              handleConfirmPayment
            }
            isProcessingPayment={
              isProcessingPayment
            }
          />

          <KasirSuccessDialog
            open={
              successDialogOpen
            }
            onClose={
              handleCloseSuccessDialog
            }
            onPrint={
              handlePrintSuccessTransaction
            }
            isPrinting={
              isPrinting
            }
          />


          <AlertDialog
            open={itemToRemove !== null}
            onOpenChange={(open) => {
              if (!open) {
                setItemToRemove(null)

                requestAnimationFrame(() => {
                  inputRef.current?.focus()
                })
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Hapus produk dari daftar?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  Apakah kamu yakin ingin menghapus{" "}
                  <span className="font-semibold text-foreground">
                    {itemToRemove?.name}
                  </span>{" "}
                  dari daftar transaksi?
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Kembali
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleRemoveItem}
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>


        </div>

      </div>
    </div>
  )
}