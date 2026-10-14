import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getAuthUser } from "./auth"
import { fetchUserOutlets } from "./outlet-queries"

export async function getActiveOutlet() {
  const { user } = await getAuthUser()

  const outlets = await fetchUserOutlets(user.id)

  /*
   * User tidak punya outlet aktif.
   */
  if (!outlets.length) {
    redirect("/nonaktif")
  }

  const cookieStore = await cookies()

  const outletId = cookieStore.get("outlet_id")?.value

  /*
   * Cari outlet aktif berdasarkan cookie outlet_id.
   *
   * Kalau cookie tidak ada atau outlet tersebut sudah tidak aktif,
   * gunakan outlet aktif pertama.
   */
  const activeOutlet =
    outlets.find((outlet) => outlet.id === outletId) ?? outlets[0]

  return {
    user,
    outlets,
    activeOutlet,
  }
}

/**
 * Semua role aktif (owner, manager, kasir, super_admin) boleh memakai
 * aplikasi kasir.
 *
 * Karena MariaDB tidak punya RLS seperti Supabase, setiap server
 * action dan route handler yang membaca/menulis data outlet WAJIB
 * memanggil fungsi ini dan membatasi query ke activeOutlet.id.
 */
export const requireOutletAccess = getActiveOutlet
