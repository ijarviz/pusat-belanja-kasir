"use client"

import * as React from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { startTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalSquare01Icon, Store01Icon } from "@hugeicons/core-free-icons"

type Outlet = {
  id: string
  code: number
  name: string
  plan: string
  image_url?: string | null
}

export function OutletSwitcher({
  outlets,
}: {
  outlets: Outlet[]
}) {
  const { isMobile, state } = useSidebar()
  const isCollapsed = !isMobile && state === "collapsed"
  const router = useRouter()

  // const [activeCode, setActiveCode] = React.useState<number | null>(null)
  const [activeOutletId, setActiveOutletId] =
    React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!outlets?.length) return

    // const cookie = Cookies.get("outlet_code")
    // const cookieCode = cookie ? Number(cookie) : null

    // const exists = outlets.some((o) => o.code === cookieCode)

    // const initialCode = exists ? cookieCode : outlets[0].code

    // setActiveCode(initialCode)

    // Cookies.set(
    //   "outlet_code",
    //   String(initialCode),
    //   {
    //     expires: 7,
    //   }
    // )
    const cookie = Cookies.get("outlet_id")

    const exists = outlets.some(
      (o) => o.id === cookie
    )

    const initialOutletId = exists
      ? cookie!
      : outlets[0].id

    setActiveOutletId(initialOutletId)

    Cookies.set(
      "outlet_id",
      initialOutletId,
      {
        expires: 7,
      }
    )
  }, [outlets])

  // const activeOutlet = React.useMemo(() => {
  //   return outlets?.find((o) => o.code === activeCode) ?? outlets?.[0]
  // }, [outlets, activeCode])
  const activeOutlet = React.useMemo(() => {
    return (
      outlets?.find(
        (o) => o.id === activeOutletId
      ) ?? outlets?.[0]
    )
  }, [outlets, activeOutletId])

  function handleSelect(outlet: Outlet) {
    // Cookies.set("outlet_code", String(outlet.code), { expires: 7 })
    // setActiveCode(outlet.code)
    Cookies.set(
      "outlet_id",
      outlet.id,
      {
        expires: 7,
      }
    )

    setActiveOutletId(outlet.id)

    setLoading(true)

    router.push("/")

    startTransition(() => {
        router.refresh()
    })

    setTimeout(() => {
        setLoading(false)
    }, 500)
  }

  if (!activeOutlet) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Card className="p-0 m-0">
              <CardContent className="p-0">
                <SidebarMenuButton
                  size="lg"
                  className={`
                    data-[state=open]:bg-sidebar-accent
                    data-[state=open]:text-sidebar-accent-foreground
                    cursor-pointer
                    ${isCollapsed ? "gap-0" : ""}
                  `}
                  disabled={loading}
                >
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg backdrop-blur-sm z-10">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                          Switching...
                      </div>
                    </div>
                  )}
                  <div className={`
                    flex 
                    aspect-square 
                    size-8 
                    items-center 
                    justify-center 
                    overflow-hidden 
                    rounded-2xl
                    border
                    p-1
                    ${isCollapsed ? "border-none" : "border"}
                  `}>
                    {activeOutlet.image_url ? (
                      <Image
                        src={activeOutlet.image_url}
                        alt={activeOutlet.name}
                        width={32}
                        height={32}
                        className="w-full object-fit"
                        unoptimized
                        loading="eager"
                      />
                    ) : (
                      <HugeiconsIcon icon={Store01Icon} />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{activeOutlet.name}</span>
                    <span className="truncate text-xs">{activeOutlet.plan}</span>
                  </div>
                  {/* <HugeiconsIcon icon={MoreVerticalSquare01Icon} strokeWidth={2} className="ml-auto" /> */}
                  {!isCollapsed && (
                    <HugeiconsIcon
                      icon={MoreVerticalSquare01Icon}
                      strokeWidth={2}
                      className="ml-auto"
                    />
                  )}
                </SidebarMenuButton>
              </CardContent>
            </Card>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Daftar Brand
            </DropdownMenuLabel>
            {outlets.map((outlet, index) => (
              <DropdownMenuItem
                key={outlet.id}
                onClick={() => handleSelect(outlet)}
                className="gap-2 p-2"
              >
                <div className="flex size-7 items-center justify-center overflow-hidden rounded-2xl border p-1">
                  {outlet.image_url ? (
                    <Image
                      src={outlet.image_url}
                      alt={outlet.name}
                      width={24}
                      height={24}
                      className="w-full"
                      unoptimized
                      loading="eager"
                    />
                  ) : (
                    <HugeiconsIcon icon={Store01Icon} />
                  )}
                </div>
                {outlet.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
