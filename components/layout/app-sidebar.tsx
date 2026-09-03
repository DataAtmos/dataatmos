"use client"

import { useAuth } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { OrgSwitcher } from "@/components/layout/org-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DASHBOARD_ROOT,
  isReservedDashboardSegment,
  parseDashboardPath,
  workspacePath,
} from "@/lib/auth/workspace"
import { DASHBOARD_NAV } from "@/lib/configs/sidebar-config"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { orgSlug, orgId } = useAuth()
  const { slug } = parseDashboardPath(pathname)
  const workspace = (slug && !isReservedDashboardSegment(slug) ? slug : null) || orgSlug || orgId
  const items = DASHBOARD_NAV.map(item => ({
    title: item.title,
    url: workspace ? workspacePath(workspace, item.path) : DASHBOARD_ROOT,
    icon: item.icon,
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
