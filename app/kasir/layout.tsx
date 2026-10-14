import { getActiveOutlet } from "@/lib/outlet"
import { getSidebarData } from "@/lib/sidebar"
import type { Metadata } from "next"

import KasirClientLayout from "./client-layout"

export const metadata: Metadata = {
  title: "Kasir",
}

export default async function KasirLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await getActiveOutlet()

  const sidebarData = await getSidebarData()

  return (
    <KasirClientLayout
      outlets={sidebarData.outlets}
      user={sidebarData.user}
    >
      {children}
    </KasirClientLayout>
  )
}