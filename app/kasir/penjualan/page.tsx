import { DataTable } from "./data-table"

import {
  getTransactions,
} from "@/lib/transactions/queries"

import { getActiveOutlet } from "@/lib/outlet"

import { subDays, format } from "date-fns"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Penjualan",
}

type Props = {
  searchParams: Promise<{
    start_date?: string
    end_date?: string
  }>
}

export default async function Page({
  searchParams,
}: Props) {
  const params = await searchParams

  const startDate =
    params.start_date ??
    format(
      subDays(new Date(), 30),
      "yyyy-MM-dd"
    )

  const endDate =
    params.end_date ??
    format(
      new Date(),
      "yyyy-MM-dd"
    )

  const data = await getTransactions("store")

  const { activeOutlet } = await getActiveOutlet()

  return (
    <div className="container mx-auto py-4">
      <DataTable
        data={data}
        startDate={startDate}
        endDate={endDate}
        storefrontUrl={activeOutlet?.url ?? null}
      />
    </div>
  )
}