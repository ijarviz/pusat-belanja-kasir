import { createClient } from "@/lib/supabase/server"
import type { ExpeditionRow } from "@/lib/expedition/types"

export async function getOutletExpeditions(
  outletId: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("outlet_expeditions")
    .select(`
      id,
      is_active,
      expedition:expedition_master (
        id,
        code,
        name,
        image_url
      )
    `)
    .eq("outlet_id", outletId)

  if (error) {
    throw new Error("Failed to fetch expeditions")
  }

  const expeditions: ExpeditionRow[] =
    (data ?? []).map((row: any) => ({
      id: row.id,
      is_active: row.is_active,
      expedition: Array.isArray(row.expedition)
        ? row.expedition[0] ?? null
        : row.expedition ?? null,
    }))

  return {
    outletId,
    expeditions,
  }
}

// export async function getOutletExpeditions(
//   outletCode: string
// ) {
//   const supabase = await createClient()

//   const { data: outlet } = await supabase
//     .from("outlets")
//     .select("id")
//     .eq("code", outletCode)
//     .single()

//   if (!outlet) {
//     return {
//       outlet: null,
//       expeditions: [],
//     }
//   }

//   const { data, error } = await supabase
//     .from("outlet_expeditions")
//     .select(`
//       id,
//       is_active,
//       expedition:expedition_master (
//         id,
//         code,
//         name,
//         image_url
//       )
//     `)
//     .eq("outlet_id", outlet.id)

//   if (error) {
//     throw new Error("Failed to fetch expeditions")
//   }

//   const expeditions: ExpeditionRow[] = (data ?? []).map((row: any) => ({
//     id: row.id,
//     is_active: row.is_active,
//     expedition: Array.isArray(row.expedition)
//       ? row.expedition[0] ?? null
//       : row.expedition ?? null,
//   }))

//   return {
//     outlet,
//     expeditions,
//   }
// }