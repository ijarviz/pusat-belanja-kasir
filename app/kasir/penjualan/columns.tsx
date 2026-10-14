"use client"

import { toast } from "sonner"

import {
  printTransaction,
} from "@/lib/printer/transaction-print"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils/format-date"
import { HugeiconsIcon } from "@hugeicons/react"

import type { Transaction } from "@/lib/transactions/types"
import { getTotalItems, formatPaymentMethod } from "@/lib/transactions/utils"
import { formatCurrency } from "@/lib/utils/format-currency"
import { ImageDefault } from "@/components/image-default"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Invoice01Icon,
  PrinterIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
// import { printInvoice } from "@/lib/printer/print-invoice"


export function getColumns(
  storefrontUrl: string | null
): ColumnDef<Transaction>[] {
  return [
  {
  id: "actions",

  header: "",

  enableSorting: false,
  enableHiding: false,

  cell: ({ row }) => {
    const data = row.original

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="ps-3 cursor-pointer">
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={18}
              strokeWidth={1.8}
            />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-44"
        >
          <DropdownMenuItem
            onClick={async () => {
              const toastId = `print-${data.id}`

              try {
                toast.loading(
                  "Mengirim transaksi ke printer...",
                  {
                    id: toastId,
                  }
                )

                await printTransaction(data)

                toast.success(
                  "Transaksi berhasil dikirim ke printer.",
                  {
                    id: toastId,
                  }
                )
              } catch (error) {
                console.error(
                  "[Print Transaction]",
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
              }
            }}
          >
            <HugeiconsIcon
              icon={PrinterIcon}
              size={16}
              strokeWidth={1.8}
            />

            Cetak
          </DropdownMenuItem>

          {/* LIHAT INVOICE */}
          <DropdownMenuItem
            onClick={() => {
              window.open(
                `/order/${data.id}`,
                "_blank"
              )
            }}
          >
            <HugeiconsIcon
              icon={Invoice01Icon}
              size={16}
              strokeWidth={1.8}
            />

            Lihat Invoice
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
},

  {
    accessorKey: "order_date",

    header: "Tanggal Transaksi",

    cell: ({ row }) => {
      const date = row.original.order_date

      return (
        <div className="w-[128px] text-sm">
          {date
            ? formatDateTime(date)
            : "-"}
        </div>
      )
    },
  },

  {
    accessorKey: "invoice",

    header: "Invoice",

    cell: ({ row }) => {
      const invoice =
        row.original.invoice

      return (
        <div className="w-[44px]">
          <div className="font-medium text-sm">
            {invoice || "-"}
          </div>
        </div>
      )
    },
  },

  {
    accessorKey: "payment_method",

    filterFn: (row, id, value) => {
      if (!value) return true

      return row.getValue(id) === value
    },

    header: "Payment",

    cell: ({ row }) => {
      const data = row.original

      return (
        <div className="w-[72px]">
          <div className="">
            {data.payment_method === "cash"
              ? "Tunai"
              : formatPaymentMethod(
                  data.payment_type,
                  data.payment_method
                )}
          </div>
        </div>
      )
    },
  },

  {
    accessorKey: "products",
    header: "Items",
    cell: ({ row }) => {
      const products = row.original.products || []

      return (
        <div className="text-sm space-y-3 w-[380px]">
          {products.map((p: any, idx: number) => {
            const price = Number(
              p.price ??
              p.snapshot?.price ??
              0
            )

            return (
              <div
                key={idx}
                className="flex gap-2"
              >
                {/* IMAGE */}
                <div className="relative w-10 h-10 shrink-0">
                  <ImageDefault
                    src={p.image || p.snapshot?.image}
                    alt={p.name || "Produk"}
                  />
                </div>

                {/* PRODUCT INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    
                    {/* NAME + VARIANT */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium whitespace-normal break-words">
                        {p.name}
                      </div>

                      {(p.variantName || p.snapshot?.variantName) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Varian:{" "}
                          {p.variantName ||
                            p.snapshot?.variantName}
                        </div>
                      )}
                    </div>

                    {/* PRICE + QTY */}
                    <div className="shrink-0 text-right">
                      <div className="font-medium whitespace-nowrap">
                        {formatCurrency(price)}
                      </div>

                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.qty}x
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    },
  },

  {
    accessorKey: "total",
    header: "Total Bayar",

    cell: ({ row }) => {
      return (
        <div className="font-medium w-[92px]">
          {formatCurrency(row.original.total)}
        </div>
      )
    },
  },

  {
    accessorKey: "buyer_name",
    header: "Customer",

    filterFn: (row, id, value) => {
      const name = row.original.buyer_name?.toLowerCase() || ""
      const phone = row.original.buyer_phone?.toLowerCase() || ""

      return (
        name.includes(value.toLowerCase()) ||
        phone.includes(value.toLowerCase())
      )
    },

    cell: ({ row }) => {
      const data = row.original

      return (
        <div className="min-w-[192px] space-y-1">
          {/* NAME */}
          <div className="font-medium">
            {data.buyer_name || "-"}
          </div>

          {/* PHONE */}
          <div className="flex items-center gap-1">
            <div className="text-xs text-muted-foreground">
              {data.buyer_phone || "-"}
            </div>
          </div>

          
        </div>
      )
    },
  },

  {
    accessorKey: "processed_by_name",
    header: "Kasir",
    cell: ({ row }) => {
      return (
        <div className="min-w-[140px]">
          <div className="font-medium text-sm">
            {row.original.processed_by_name || "-"}
          </div>
        </div>
      )
    },
  },

  ]
}