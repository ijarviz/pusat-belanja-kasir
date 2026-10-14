import "server-only"

import { getSessionUser } from "@/lib/session"
import { fetchUserOutlets } from "./outlet-queries"

export async function getSidebarData() {
  const user = await getSessionUser()

  if (!user) {
    return {
      user: null,
      outlets: [],
    }
  }

  const outlets = await fetchUserOutlets(user.id)

  return {
    user: {
      name: user.name ?? "No Name",

      email: user.email ?? "",

      avatar: "",
    },

    outlets,
  }
}
