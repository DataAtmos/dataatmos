import type { ReactNode } from "react"
import { Suspense } from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { DashboardChrome } from "@/components/layout/dashboard-chrome"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <Suspense fallback={<div className="bg-sidebar hidden w-(--sidebar-width) md:block" />}>
        <AppSidebar />
      </Suspense>
      <DashboardChrome>{children}</DashboardChrome>
    </>
  )
}
