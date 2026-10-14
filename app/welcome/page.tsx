import { redirect } from "next/navigation"

import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/session"
import WelcomeOutletForm from "./welcome-outlet-form"

export default async function WelcomePage() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/auth/login")
  }

  // ambil outlet user
  const outlets = await query<{
    id: string
    code: number
    name: string
    plan: string
  }>(
    `SELECT o.id, o.code, o.name, o.plan
     FROM outlet_users ou
     JOIN outlets o ON o.id = ou.outlet_id
     WHERE ou.user_id = ?
     ORDER BY ou.created_at`,
    [user.id]
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-2xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Selamat Datang
          </h1>

          <p className="text-muted-foreground text-sm mt-1">
            Pilih outlet untuk melanjutkan
          </p>
        </div>

        <WelcomeOutletForm outlets={outlets} />
      </div>
    </div>
  )
}