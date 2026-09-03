"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment, type ReactNode, Suspense } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { parseDashboardPath, workspacePath } from "@/lib/auth/workspace"

const LABELS: Record<string, string> = {
  insights: "Insights",
  monitoring: "Monitoring",
  "cluster-configuration": "Cluster configuration",
  backups: "Backups",
  settings: "Settings",
}

function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const { slug, restParts } = parseDashboardPath(pathname)
  const crumbs = slug
    ? [
        { label: "Dashboard", href: workspacePath(slug) },
        ...restParts.map((part, index) => ({
          label: LABELS[part] ?? part,
          href: workspacePath(slug, `/${restParts.slice(0, index + 1).join("/")}`),
        })),
      ]
    : [{ label: "Dashboard", href: "/dashboard" }]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <Fragment key={crumb.href}>
              {index > 0 ? <BreadcrumbSeparator className="hidden md:block" /> : null}
              <BreadcrumbItem className={isLast ? undefined : "hidden md:block"}>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} prefetch>
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function DashboardChrome({ children }: { children: ReactNode }) {
  return (
    <SidebarInset className="min-w-0 overflow-hidden">
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] grid-rows-[4rem_minmax(0,1fr)] gap-x-3 px-4">
        <div className="flex items-center">
          <SidebarTrigger className="-ml-1" />
        </div>
        <div className="flex items-center">
          <Suspense fallback={<span className="text-sm text-muted-foreground">Dashboard</span>}>
            <DashboardBreadcrumbs />
          </Suspense>
        </div>
        <div className="col-start-2 row-start-2 min-h-0 overflow-auto pb-4">{children}</div>
      </div>
    </SidebarInset>
  )
}
