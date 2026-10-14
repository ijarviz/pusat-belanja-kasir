import { createClient } from "@/lib/supabase/server"
import { getActiveOutlet } from "@/lib/outlet"

import type { Voucher } from "./types"

export async function getVouchers(): Promise<Voucher[]> {
  const supabase = await createClient()

  const { activeOutlet } =
    await getActiveOutlet()

  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("outlet_id", activeOutlet.id)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    console.error(error)
    return []
  }

  return data ?? []
}