import { getTransactionsForPrint } from "@/lib/transactions/queries"
import ShippingLabel from "@/components/shipping-label"

export default async function BulkPrintPage({
  searchParams,
}: {
  searchParams: Promise<{
    ids?: string
  }>
}) {
  const { ids = "" } =
    await searchParams

  const trxIds = ids
    .split(",")
    .filter(Boolean)

  const transactions =
    await getTransactionsForPrint(trxIds)

  return (
    <div>
      {transactions.map(
        (trx, index) => (
          <div
            key={trx.id}
            className={
              index !==
              transactions.length - 1
                ? "break-after-page"
                : ""
            }
          >
            <ShippingLabel trx={trx} />
          </div>
        )
      )}
    </div>
  )
}