import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getAuthUser } from "./auth"
import { fetchUserOutlets } from "./outlet-queries"

export async function getActiveOutlet() {
  const {
    supabase,
    user,
  } = await getAuthUser()

  const outlets =
    await fetchUserOutlets(
      supabase,
      user.id
    )

  /*
   * User tidak punya outlet aktif.
   */
  if (!outlets.length) {
    redirect(
      "/nonaktif"
    )
  }

  const cookieStore =
    await cookies()

  const outletId =
    cookieStore
      .get("outlet_id")
      ?.value

  /*
   * Cari outlet aktif berdasarkan
   * cookie outlet_id.
   *
   * Kalau cookie tidak ada atau
   * outlet tersebut sudah tidak aktif,
   * gunakan outlet aktif pertama.
   */
  const activeOutlet =
    outlets.find(
      (outlet: any) =>
        outlet.id === outletId
    ) ?? outlets[0]

  return {
    supabase,
    user,
    outlets,
    activeOutlet,
  }
}