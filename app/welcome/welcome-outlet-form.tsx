"use client"

import { useState } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Outlet = {
  id: string
  code: number
  name: string
  plan: string
}

export default function WelcomeOutletForm({
  outlets,
}: {
  outlets: Outlet[]
}) {
  const router = useRouter()

  // const [selected, setSelected] = useState<number | null>(
  //   outlets?.[0]?.code ?? null
  // )

  const [selected, setSelected] = useState<string | null>(
    outlets?.[0]?.id ?? null
  )

  const handleLogout = async () => {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.push("/auth/login")
}

  function handleSubmit() {
    if (!selected) return

    // Cookies.set("outlet_code", String(selected), {
    //   expires: 7,
    // })
    Cookies.set(
      "outlet_id",
      selected,
      {
        expires: 7,
      }
    )

    router.push("/kasir")
  }

  if (!outlets.length) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="font-medium">
            Tidak ada outlet
          </div>

          <div className="text-sm text-muted-foreground mt-1">
            Akun kamu belum terhubung ke outlet manapun.
            Silakan hubungi CS atau owner.
          </div>
          <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2"
              >
                {/* <HugeiconsIcon icon={LogoutIcon} size={20} /> */}
                <span>Log Out</span>
              </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <select
        className="w-full border rounded-lg p-3"
        value={selected ?? ""}
        // onChange={(e) =>
        //   setSelected(Number(e.target.value))
        // }
        onChange={(e) =>
          setSelected(e.target.value)
        }
      >
        {outlets.map((outlet) => (
          // <option
          //   key={outlet.id}
          //   value={outlet.code}
          // >
          //   {outlet.name}
          // </option>
          <option
            key={outlet.id}
            value={outlet.id}
          >
            {outlet.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white rounded-lg py-3"
      >
        Masuk
      </button>
    </div>
  )
}