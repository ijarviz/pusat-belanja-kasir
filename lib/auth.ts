import { redirect } from "next/navigation"

import { getSessionUser } from "@/lib/session"

export async function getAuthUser() {
  const user = await getSessionUser()

  if (!user) redirect("/auth/login")

  return { user }
}
