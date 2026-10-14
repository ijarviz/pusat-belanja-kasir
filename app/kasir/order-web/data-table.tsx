"use client"

import * as React from "react"

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Transaction } from "@/lib/transactions/types"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation"

import { DateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { getColumns } from "./columns"

interface DataTableProps {
  data: Transaction[]
  startDate: string
  endDate: string
  storefrontUrl: string | null
}

export function DataTable({
  data,
  startDate,
  endDate,
  storefrontUrl,
}: DataTableProps) {
  const columns = React.useMemo(
    () => getColumns(storefrontUrl),
    [storefrontUrl]
  )

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  /*
   * ============================
   * INITIAL URL STATE
   * ============================
   */

  const initialSearch =
    searchParams.get("cari") ?? ""

  const initialPayment =
    searchParams.get("payment") ?? "all"

  const initialPage =
    Number(searchParams.get("page") ?? 1)

  /*
   * ============================
   * SEARCH
   * ============================
   */

  const [inputValue, setInputValue] =
    React.useState(initialSearch)

  const [globalFilter, setGlobalFilter] =
    React.useState(initialSearch)

  /*
   * ============================
   * DATE RANGE
   * ============================
   */

  const [dateRange, setDateRange] =
    React.useState<DateRange | undefined>({
      from: new Date(startDate),
      to: new Date(endDate),
    })

  React.useEffect(() => {
    const start =
      searchParams.get("start_date")

    const end =
      searchParams.get("end_date")

    if (!start || !end) {
      return
    }

    setDateRange({
      from: new Date(start),
      to: new Date(end),
    })
  }, [searchParams])

  /*
   * ============================
   * PAGINATION
   * ============================
   */

  const [pagination, setPagination] =
    React.useState<PaginationState>({
      pageIndex: Math.max(
        initialPage - 1,
        0
      ),
      pageSize: 10,
    })


  const [sorting, setSorting] =
    React.useState<SortingState>([])

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(() => [
      ...(initialPayment !== "all"
        ? [
            {
              id: "payment_status",
              value: initialPayment,
            },
          ]
        : []),
    ])

  const updateURL = (
    params: Record<string, string | null>
  ) => {
    const current =
      new URLSearchParams(
        searchParams.toString()
      )

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          !value ||
          value === "all"
        ) {
          current.delete(key)
        } else {
          current.set(key, value)
        }
      }
    )

    const query =
      current.toString()

    router.replace(
      query
        ? `${pathname}?${query}`
        : pathname,
      {
        scroll: false,
      }
    )
  }

  /*
   * ============================
   * PAGINATION HANDLER
   * ============================
   *
   * Ini penting.
   *
   * Jangan hanya setPagination.
   * URL juga langsung diubah di sini.
   */

  const handlePaginationChange = (
    updater: Updater<PaginationState>
  ) => {
    const nextPagination =
      typeof updater === "function"
        ? updater(pagination)
        : updater

    setPagination(nextPagination)

    updateURL({
      page: String(
        nextPagination.pageIndex + 1
      ),
    })
  }

  /*
   * ============================
   * GLOBAL SEARCH FUNCTION
   * ============================
   */

  const globalFilterFn = React.useCallback(
    (
      row: any,
      _columnId: string,
      value: string
    ) => {
      const cari =
        value.toLowerCase()

      const buyerName =
        row.original.buyer_name
          ?.toLowerCase() || ""

      const productMatch =
        row.original.products?.some(
          (p: any) => {
            const productName =
              p.name?.toLowerCase() || ""

            const variantName =
              p.variantName
                ?.toLowerCase() ||
              p.snapshot?.variantName
                ?.toLowerCase() ||
              ""

            return (
              productName.includes(cari) ||
              variantName.includes(cari)
            )
          }
        )

      return (
        buyerName.includes(cari) ||
        productMatch
      )
    },
    []
  )

  /*
   * ============================
   * DATE FILTER
   * ============================
   */

  const filteredData =
    React.useMemo(() => {
      if (
        !dateRange?.from ||
        !dateRange?.to
      ) {
        return data
      }

      const from =
        new Date(dateRange.from)

      from.setHours(
        0,
        0,
        0,
        0
      )

      const to =
        new Date(dateRange.to)

      to.setHours(
        23,
        59,
        59,
        999
      )

      return data.filter(
        (item: any) => {
          if (!item.order_date) {
            return false
          }

          const orderDate =
            new Date(
              item.order_date
            )

          return (
            orderDate >= from &&
            orderDate <= to
          )
        }
      )
    }, [data, dateRange])

  /*
   * ============================
   * TABLE
   * ============================
   */

  const table = useReactTable({
    data: filteredData,
    columns,

    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
    },

    globalFilterFn,

    getCoreRowModel:
      getCoreRowModel(),

    getFilteredRowModel:
      getFilteredRowModel(),

    getPaginationRowModel:
      getPaginationRowModel(),

    getSortedRowModel:
      getSortedRowModel(),

    /*
     * Jangan otomatis reset page
     * ketika filter berubah.
     */
    autoResetPageIndex: false,

    onSortingChange:
      setSorting,

    onColumnFiltersChange:
      setColumnFilters,

    onPaginationChange:
      handlePaginationChange,

    onGlobalFilterChange:
      setGlobalFilter,
  })

  React.useEffect(() => {
    const pageCount =
      table.getPageCount()

    if (pageCount <= 0) {
      return
    }

    if (
      pagination.pageIndex >=
      pageCount
    ) {
      const lastPageIndex =
        pageCount - 1

      setPagination((prev) => ({
        ...prev,
        pageIndex:
          lastPageIndex,
      }))

      updateURL({
        page: String(
          lastPageIndex + 1
        ),
      })
    }
  }, [
    pagination.pageIndex,
    table.getPageCount(),
  ])

  /*
   * ============================
   * DATE CHANGE
   * ============================
   */

  const handleDateChange = (
    range: DateRange | undefined
  ) => {
    setDateRange(range)

    if (
      !range?.from ||
      !range?.to
    ) {
      return
    }

    updateURL({
      start_date: format(
        range.from,
        "yyyy-MM-dd"
      ),
      end_date: format(
        range.to,
        "yyyy-MM-dd"
      ),
      page: "1",
    })

    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ============================
          SEARCH + PAYMENT
          ============================ */}

      <div className="flex md:flex-row flex-col md:items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <Input
            placeholder="Cari nama, produk, atau varian"
            value={inputValue}
            onChange={(e) =>
              setInputValue(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key !== "Enter"
              ) {
                return
              }

              const value =
                inputValue.trim()

              setGlobalFilter(
                value
              )

              table.setGlobalFilter(
                value
              )

              setPagination(
                (prev) => ({
                  ...prev,
                  pageIndex: 0,
                })
              )

              updateURL({
                cari:
                  value || null,
                page: "1",
              })
            }}
          />

          <Select
            value={
              (
                table
                  .getColumn(
                    "payment_status"
                  )
                  ?.getFilterValue() as
                  | string
                  | undefined
              ) ?? "all"
            }
            onValueChange={(
              value: string
            ) => {
              const finalValue =
                value === "all"
                  ? null
                  : value

              table
                .getColumn(
                  "payment_status"
                )
                ?.setFilterValue(
                  value === "all"
                    ? undefined
                    : value
                )

              setPagination(
                (prev) => ({
                  ...prev,
                  pageIndex: 0,
                })
              )

              updateURL({
                payment:
                  finalValue,
                page: "1",
              })
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Payment
              </SelectItem>

              <SelectItem value="paid">
                Paid
              </SelectItem>

              <SelectItem value="unpaid">
                Unpaid
              </SelectItem>

              <SelectItem value="expired">
                Expired
              </SelectItem>
            </SelectContent>
          </Select>

        </div>

        <DateRangePicker
          date={dateRange}
          setDate={handleDateChange}
        />

      </div>

      {/* ============================
          INFO
          ============================ */}

      <div className="flex">

        <div className="text-sm text-muted-foreground">

          Menampilkan{" "}
          {
            table
              .getFilteredRowModel()
              .rows.length
          }{" "}
          Produk

          {searchParams.get(
            "cari"
          ) && (
            <span>
              {" "}
              dari pencarian{" "}

              <span className="font-medium">
                "
                {
                  searchParams.get(
                    "cari"
                  )
                }
                "
              </span>

              <Button
                variant="link"
                onClick={() => {
                  setInputValue(
                    ""
                  )

                  setGlobalFilter(
                    ""
                  )

                  table.setGlobalFilter(
                    ""
                  )

                  setPagination(
                    (prev) => ({
                      ...prev,
                      pageIndex: 0,
                    })
                  )

                  updateURL({
                    cari: null,
                    page: "1",
                  })
                }}
              >
                reset pencarian
              </Button>

            </span>
          )}

        </div>

      </div>

      {/* ============================
          SELECTED ROW
          ============================ */}

      {table
        .getFilteredSelectedRowModel()
        .rows.length > 0 && (
        <div className="flex items-center gap-4">

          <div className="text-sm">
            {
              table
                .getFilteredSelectedRowModel()
                .rows.length
            }{" "}
            data dipilih
          </div>

          <Button
            variant="outline"
            disabled={
              table
                .getFilteredSelectedRowModel()
                .rows
                .filter(
                  (row) =>
                    Boolean(row.original.awb) ||
                    row.original.payment_status === "paid"
                )
                .length === 0
            }
            onClick={() => {
              const printableRows =
                table
                  .getFilteredSelectedRowModel()
                  .rows
                  .filter(
                    (row) =>
                      Boolean(row.original.awb) ||
                      row.original.payment_status === "paid"
                  )

              const ids = printableRows.map(
                (row) => row.original.id
              )

              if (!ids.length) {
                return
              }

              window.open(
                `/print/bulk/pdf?ids=${ids.join(",")}`,
                "_blank"
              )
            }}
          >
            Cetak Resi (
            {
              table
                .getFilteredSelectedRowModel()
                .rows
                .filter(
                  (row) =>
                    Boolean(row.original.awb) ||
                    row.original.payment_status === "paid"
                )
                .length
            }
            )
          </Button>

        </div>
      )}

      {/* ============================
          TABLE
          ============================ */}

      <div className="overflow-hidden rounded-md border">

        <Table>

          <TableHeader>

            {table
              .getHeaderGroups()
              .map(
                (headerGroup) => (

                  <TableRow
                    key={
                      headerGroup.id
                    }
                  >

                    {headerGroup.headers.map(
                      (header) => (

                        <TableHead
                          key={
                            header.id
                          }
                        >
                          {
                            header.isPlaceholder
                              ? null
                              : flexRender(
                                  header
                                    .column
                                    .columnDef
                                    .header,
                                  header.getContext()
                                )
                          }
                        </TableHead>

                      )
                    )}

                  </TableRow>

                )
              )}

          </TableHeader>

          <TableBody>

            {table
              .getRowModel()
              .rows?.length ? (

              table
                .getRowModel()
                .rows
                .map((row) => (

                  <TableRow
                    key={row.id}
                    data-state={
                      row.getIsSelected() &&
                      "selected"
                    }
                  >

                    {row
                      .getVisibleCells()
                      .map(
                        (cell) => (

                          <TableCell
                            key={
                              cell.id
                            }
                            className="align-top"
                          >
                            {flexRender(
                              cell.column
                                .columnDef
                                .cell,
                              cell.getContext()
                            )}
                          </TableCell>

                        )
                      )}

                  </TableRow>

                ))

            ) : (

              <TableRow>

                <TableCell
                  colSpan={
                    columns.length
                  }
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>

              </TableRow>

            )}

          </TableBody>

        </Table>

      </div>

      {/* ============================
          PAGINATION
          ============================ */}

      <div className="space-x-2 py-4">

        <DataTablePagination
          table={table}
        />

      </div>

    </div>
  )
}