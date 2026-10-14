import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import WelcomeOutletForm from "./welcome-outlet-form"

export default async function WelcomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // ambil outlet user
  const { data } = await supabase
    .from("outlet_users")
    .select(`
      outlets (
        id,
        code,
        name,
        plan
      )
    `)
    .eq("user_id", user.id)

  const outlets =
    data
      ?.map((item: any) => item.outlets)
      .filter(Boolean) || []

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