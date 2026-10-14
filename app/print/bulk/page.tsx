import { createClient } from "@/lib/supabase/server"
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

  const supabase = await createClient()

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .in("id", trxIds)

  const transactions = data ?? []

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