import { createClient } from "@/lib/supabase/server"
import { fetchUserOutlets } from "./outlet-queries"

export async function getSidebarData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      outlets: [],
    }
  }

  const outlets = await fetchUserOutlets(
    supabase,
    user.id
  )

  return {
    user: {
      name:
        user.user_metadata?.display_name ??
        "No Name",

      email: user.email ?? "",

      avatar: "",
    },

    outlets,
  }
}