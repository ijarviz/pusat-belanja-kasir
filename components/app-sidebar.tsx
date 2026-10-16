"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { OutletSwitcher } from "@/components/outlet-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { PrinterIcon, CashierIcon, Tag02Icon, ShoppingCart01Icon, PackageMoving01Icon } from "@hugeicons/core-free-icons"

const data = {
  navMain: [
    {
      id: "kasir",
      title: "Kasir",
      url: "/kasir",
      icon: (
        <HugeiconsIcon icon={CashierIcon} strokeWidth={2} />
      ),
    },
    {
      id: "cek-harga",
      title: "Cek Harga",
      url: "/kasir/cek-harga",
      icon: (
        <HugeiconsIcon icon={Tag02Icon} strokeWidth={2} />
      ),
    },
    {
      id: "penjualan",
      title: "Penjualan",
      url: "/kasir/penjualan",
      icon: (
        <HugeiconsIcon icon={ShoppingCart01Icon} strokeWidth={2}/>
      ),
    },
    {
      id: "orderWeb",
      title: "Order Web",
      url: "/kasir/order-web",
      icon: (
        <HugeiconsIcon icon={PackageMoving01Icon} strokeWidth={2}/>
      ),
    },
    {
      id: "printer",
      title: "Printer",
      url: "/kasir/pengaturan/printer",
      icon: (
        <HugeiconsIcon icon={PrinterIcon} strokeWidth={2}/>
      ),
    },
  ],
  
}

type SidebarUser = {
  name: string
  email: string
  avatar: string
}

export const navMain = data.navMain

export function AppSidebar({
  outlets,
  user,
  badges,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  outlets: any[]
  user: SidebarUser | null
  badges?: Record<string, number>
}) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mt-4">
        <OutletSwitcher outlets={outlets} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} badges={badges} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}