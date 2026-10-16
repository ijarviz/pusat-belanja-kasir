"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
  badges = {},
}: {
  badges?: Record<string, number>
  items: {
    id: string
    title: string
    url?: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      id: string
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {

  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = item.items && item.items.length > 0

          const isParentActive =
            item.url === pathname ||
            item.items?.some((sub) => sub.url === pathname)

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={item.url === pathname}
                  tooltip={item.title}
                >
                  <a href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
                {(badges[item.id] ?? 0) > 0 && (
                  <>
                    <SidebarMenuBadge className="rounded-md bg-red-600 px-1.5 text-white peer-hover/menu-button:text-white peer-data-[active=true]/menu-button:text-white">
                      {badges[item.id] > 99 ? "99+" : badges[item.id]}
                    </SidebarMenuBadge>
                    {/* Sidebar ciut (mode ikon): SidebarMenuBadge disembunyikan,
                        jadi tampilkan angka kecil di pojok ikon. */}
                    <span className="pointer-events-none absolute -top-1 right-0 hidden h-4 min-w-4 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] font-semibold leading-none text-white group-data-[collapsible=icon]:flex">
                      {badges[item.id] > 99 ? "99+" : badges[item.id]}
                    </span>
                  </>
                )}
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.id}
              asChild
              defaultOpen={isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={isParentActive}
                    tooltip={item.title}
                    className="cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.title}</span>

                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={1.5}
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = subItem.url === pathname

                      return (
                        <SidebarMenuSubItem key={subItem.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className={isSubActive ? "font-semibold" : ""}
                          >
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
