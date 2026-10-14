import { getTransactionsForPrint } from "@/lib/transactions/queries"
import { notFound } from "next/navigation"

import ShippingLabel from "@/components/shipping-label"

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [trx] = await getTransactionsForPrint([id])

  if (!trx) {
    notFound()
  }

  return (
    <ShippingLabel trx={trx} />
  )
}