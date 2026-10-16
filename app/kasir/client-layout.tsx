"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { Separator } from "@/components/ui/separator"

import { usePathname } from "next/navigation"

import { navMain } from "@/components/app-sidebar"

// function getBreadcrumb(pathname: string) {
//   for (const item of navMain) {
//     // parent langsung
//     if (item.url && item.url === pathname) {
//       return {
//         parent: item.title,
//         child: null,
//       }
//     }

//     // cek child
//     if (item.items) {
//       const found = item.items.find(
//         (sub: any) => sub.url === pathname
//       )

//       if (found) {
//         return {
//           parent: item.title,
//           child: found.title,
//         }
//       }
//     }
//   }

//   return {
//     parent: "Unknown",
//     child: null,
//   }
// }
function getBreadcrumb(pathname: string) {
  const found = navMain.find(
    (item) => item.url === pathname
  )

  return {
    parent: found?.title ?? "Unknown",
    child: null,
  }
}

type SidebarUser = {
  name: string
  email: string
  avatar: string
}

export default function KasirClientLayout({
  children,
  outlets,
  user,
  badges,
}: {
  children: React.ReactNode
  outlets: any[]
  user: SidebarUser | null
  badges?: Record<string, number>
}) {
  const pathname = usePathname()

  const { parent, child } =
    getBreadcrumb(pathname)

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar
          outlets={outlets}
          user={user}
          badges={badges}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <h1 className="text-base opacity-60">
                {child ?? parent}
              </h1>
            </div>
          </header>
          <div className="px-3 lg:px-5 pb-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}