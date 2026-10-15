import { notFound } from "next/navigation"

import { PrintLabels } from "@/components/print-labels/print-labels"
import { getShippingLabels } from "@/lib/transactions/queries"

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const rows = await getShippingLabels([id])

  if (!rows.length) {
    notFound()
  }

  return <PrintLabels rows={rows} />
}
