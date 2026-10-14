import "server-only"

import { query } from "@/lib/db"

export type UserOutlet = {
  id: string
  code: number
  name: string
  plan: string
  image_url: string | null
  address: string | null
  url: string | null
  status: string
  role: "owner" | "manager" | "kasir" | "super_admin"
  membershipStatus: string
}

/*
 * Outlet tempat user menjadi anggota aktif, dan outlet itu sendiri
 * masih aktif.
 */
export async function fetchUserOutlets(
  userId: string
): Promise<UserOutlet[]> {
  try {
    return await query<UserOutlet>(
      `SELECT
         o.id, o.code, o.name, o.plan, o.image_url, o.address, o.url, o.status,
         ou.role, ou.status AS membershipStatus
       FROM outlet_users ou
       JOIN outlets o ON o.id = ou.outlet_id
       WHERE ou.user_id = ?
         AND ou.status = 'active'
         AND o.status = 'active'
       ORDER BY ou.created_at`,
      [userId]
    )
  } catch (error) {
    console.error("fetchUserOutlets error:", error)
    return []
  }
}
