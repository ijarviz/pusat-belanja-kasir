import "server-only"

import { cookies } from "next/headers"

import { queryOne } from "@/lib/db"
import { getSessionUser } from "@/lib/session"
import { CREATE_STAGE_SQL } from "@/lib/transactions/stage"
import { fetchUserOutlets } from "./outlet-queries"

export async function getSidebarData() {
  const user = await getSessionUser()

  if (!user) {
    return {
      user: null,
      outlets: [],
      badges: {} as Record<string, number>,
    }
  }

  const outlets = await fetchUserOutlets(user.id)

  // Outlet aktif sama seperti getActiveOutlet(): cookie, atau outlet pertama.
  const outletId = (await cookies()).get("outlet_id")?.value
  const activeOutlet = outlets.find((outlet) => outlet.id === outletId) ?? outlets[0]

  return {
    user: {
      name: user.name ?? "No Name",

      email: user.email ?? "",

      avatar: "",
    },

    outlets,

    // Badge merah di menu (id menu -> jumlah). orderWeb: semua order web
    // berstatus Create (all time) yang menunggu dipickup kurir.
    badges: {
      orderWeb: activeOutlet ? await countCreateOrders(activeOutlet.id) : 0,
    } as Record<string, number>,
  }
}

async function countCreateOrders(outletId: string) {
  try {
    const row = await queryOne<{ n: number }>(
      `SELECT COUNT(*) AS n FROM transactions WHERE outlet_id = ? AND ${CREATE_STAGE_SQL}`,
      [outletId]
    )
    return Number(row?.n ?? 0)
  } catch (error) {
    console.error("countCreateOrders:", error)
    return 0
  }
}
