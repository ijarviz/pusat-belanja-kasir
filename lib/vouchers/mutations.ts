import { createClient } from "@/lib/supabase/client"
import { VoucherInput } from "./validations"

export async function createVoucher(
  outletId: string,
  payload: VoucherInput
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("vouchers")
    .insert({
      outlet_id: outletId,
      ...payload,
    })

  if (error) throw error
}