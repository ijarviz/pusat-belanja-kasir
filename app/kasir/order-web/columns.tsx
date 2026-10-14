"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { updateTransactionField, cancelShipment } from "@/lib/transactions/mutations"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils/format-date"
import { HugeiconsIcon } from "@hugeicons/react"
import { WhatsappIcon } from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  MoreHorizontal,
} from "lucide-react"

import { DataTableColumnHeader } from "@/components/data-table-column-header"

import type { Transaction } from "@/lib/transactions/types"
import { getTotalItems, formatPaymentMethod } from "@/lib/transactions/utils"
import { formatCurrency } from "@/lib/utils/format-currency"


export function getColumns(
  storefrontUrl: string | null
): ColumnDef<Transaction>[] {
  return [
  {
    id: "select",

    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (
            table.getIsSomePageRowsSelected() &&
            "indeterminate"
          )
        }
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        className="mt-2"
        checked={row.getIsSelected()}
        onCheckedChange={(value) =>
          row.toggleSelected(!!value)
        }
        aria-label="Select row"
      />
    ),

    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",

    cell: ({ row }) => {
      const router = useRouter()
      const transaction = row.original

      // const hasShipment = Boolean(transaction.shipping_ref1)
      // const isPaid = transaction.payment_status === "paid"
      const hasShipment =
        Boolean(transaction.awb) ||
        transaction.payment_status === "paid"

      const handleCancel = async () => {
        if (
          !window.confirm(
            "Batalkan pengiriman (void AWB) untuk transaksi ini? Tindakan ini tidak bisa dibatalkan."
          )
        ) {
          return
        }

        try {
          await cancelShipment(transaction.id)

          router.refresh()

          toast.success("Pengiriman dibatalkan")
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Gagal membatalkan pengiriman"
          )
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            {hasShipment ? (
              <>
                {/* CETAK RESI */}
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `/print/${transaction.id}/pdf`,
                      "_blank"
                    )
                  }
                >
                  Cetak Resi
                </DropdownMenuItem>

                {/* LACAK PENGIRIMAN */}
                <DropdownMenuItem
                  disabled={!hasShipment}
                  onClick={() => {
                    // aksi lacak pengiriman
                  }}
                >
                  Lacak Pengiriman
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* BATALKAN PENGIRIMAN */}
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!hasShipment}
                  onSelect={(e) => {
                    e.preventDefault()
                    handleCancel()
                  }}
                >
                  Batalkan Pengiriman
                </DropdownMenuItem>
              </>
            ) : (
              /* BELUM PAID */
              <DropdownMenuItem
                disabled={!storefrontUrl}
                onClick={() => {
                  if (!storefrontUrl) return

                  const base = storefrontUrl.replace(/\/+$/, "")

                  window.open(
                    `${base}/payment/${transaction.id}`,
                    "_blank"
                  )
                }}
              >
                Lihat Link Pembayaran
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },

  {
    accessorKey: "products",
    header: "Items",
    cell: ({ row }) => {
      const products = row.original.products || []

      return (
        <div className="text-sm space-y-3 w-[312px]">
          {products.map((p: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              
              <img
                src={p.image || p.snapshot?.image}
                alt={p.name}
                className="w-10 h-10 rounded-md object-cover border shrink-0"
                loading="eager"
              />

              <div className="leading-snug whitespace-normal break-words">
                <div className="flex flex-row gap-4">
                  <div className="w-[244px]">
                    <div className="font-medium">
                      {p.name}
                    </div>
                    {(p.variantName || p.snapshot?.variantName) && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        
                        <span>
                          Varian: {p.variantName || p.snapshot?.variantName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="font-medium">
                    {p.qty}x
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )
    },
  },

  {
    id: "shipping",
    header: "Ekspedisi",
    cell: ({ row }) => {
      const data = row.original

      const courier = data.shipping_courier || "-"
      const service = data.shipping_service || "-"

      return (
        <div className="text-sm">
          <div className="font-medium">{courier}</div>
          <div className="text-xs text-muted-foreground">
            {service}
          </div>
          <div className="text-xs text-muted-foreground">
            {data.awb || "-"}
          </div>
        </div>
      )
    },
  },

  // {
  //   accessorKey: "status",
  //   header: "Status",
  //   cell: ({ row }) => {
  //     const router = useRouter()
  //     const data = row.original

  //     return (
  //       <select
  //         className="border rounded px-2 py-1 text-[12px]"
  //         value={data.status}
  //         onChange={async (e) => {
  //           try {
  //             await updateTransactionField(data.id, {
  //               status: e.target.value,
  //             })

  //             router.refresh()
  //             toast.success("Status diupdate")
  //           } catch (err) {
  //             toast.error("Gagal update status")
  //           }
  //         }}
  //       >
  //         <option value="order">Order</option>
  //         <option value="pending">Pending</option>
  //         <option value="process">Process</option>
  //         <option value="completed">Completed</option>
  //         <option value="refund">Refund</option>
  //         <option value="cancelled">Cancelled</option>
  //       </select>
  //     )
  //   },
  // },

  {
  accessorKey: "shipping_order_status",
  header: "Shipment",

  cell: ({ row }) => {
    const status = row.original.shipping_order_status

    return (
      <div className="min-w-[140px]">
        {status ? (
          <span className="text-sm">
            {status}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            -
          </span>
        )}
      </div>
    )
  },
  },

  {
    accessorKey: "payment_status",
    filterFn: (row, id, value) => {
      if (!value) return true
      return row.getValue(id) === value
    },
    header: "Payment",
    cell: ({ row }) => {
      const data = row.original

      const status = data.payment_status ?? "unpaid"

      const statusColor =
        status === "paid"
          ? "text-green-600 bg-green-100"
          : status === "expired"
          ? "text-red-600 bg-red-100"
          : "text-yellow-600 bg-yellow-100"

      return (
        <div className="">

          <span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>
            {status.toUpperCase()}
          </span>

          <div className="mt-2 text-xs text-muted-foreground">
            {formatPaymentMethod(data.payment_type, data.payment_method)}
          </div>

        </div>
      )
    },
  },

  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Total"
      />
    ),

    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {formatCurrency(row.original.total)}
        </div>
      )
    },
  },

  {
  accessorKey: "buyer_name",
  header: "Pembeli",

  filterFn: (row, id, value) => {
    const search = value.toLowerCase()

    const name =
      row.original.buyer_name?.toLowerCase() || ""

    const phone =
      row.original.buyer_phone?.toLowerCase() || ""

    const area = row.original.destination_area

    const district =
      area?.district_name?.toLowerCase() || ""

    const regency =
      area?.regency_name?.toLowerCase() || ""

    const province =
      area?.province_name?.toLowerCase() || ""

    return (
      name.includes(search) ||
      phone.includes(search) ||
      district.includes(search) ||
      regency.includes(search) ||
      province.includes(search)
    )
  },

  cell: ({ row }) => {
    const data = row.original
    const area = data.destination_area

    return (
      <div className="min-w-[240px] space-y-1.5">
        {/* NAME */}
        <div className="font-medium">
          {data.buyer_name || "-"}
        </div>

        {/* PHONE */}
        <div className="flex items-center gap-1">
          <div className="text-xs text-muted-foreground">
            {data.buyer_phone || "-"}
          </div>

          {data.buyer_phone && (
            <button
              type="button"
              onClick={() => {
                const phone = data.buyer_phone
                  ?.replace(/\D/g, "")
                  ?.replace(/^0/, "62")

                window.open(
                  `https://wa.me/${phone}`,
                  "_blank"
                )
              }}
              className="text-green-600 hover:text-green-700"
            >
              <HugeiconsIcon
                icon={WhatsappIcon}
                size={14}
              />
            </button>
          )}
        </div>

        {/* AREA */}
        {area && (
  <div className="text-xs text-muted-foreground leading-relaxed">
    {[
      area.district_name,
      area.regency_name,
      area.province_name,
    ]
      .filter(Boolean)
      .join(", ")}
  </div>
)}

<div className="text-xs text-muted-foreground leading-relaxed whitespace-normal break-words">
  {data.buyer_address || "-"}
</div>

        {/* ORDER DATE */}
        <div className="text-[11px] text-muted-foreground">
          {data.order_date
            ? formatDateTime(data.order_date)
            : "-"}
        </div>
      </div>
    )
  },
},

  ]
}