import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

import ShippingLabel from "@/components/shipping-label"

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: trx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single()

  if (!trx) {
    notFound()
  }

  return (
    <ShippingLabel trx={trx} />
  )
}