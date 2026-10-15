import { PrintLabels } from "@/components/print-labels/print-labels"
import { getShippingLabels } from "@/lib/transactions/queries"

export default async function BulkPrintPage({
  searchParams,
}: {
  searchParams: Promise<{
    ids?: string
  }>
}) {
  const { ids = "" } = await searchParams

  const rows = await getShippingLabels(ids.split(",").filter(Boolean))

  return <PrintLabels rows={rows} />
}
