import type { Metadata } from "next"
import { type ReactNode, Suspense } from "react"
import { EnsureOrganization } from "@/components/auth/ensure-organization"
import { CommandPalette } from "@/components/command-palette"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SidebarProvider } from "@/components/ui/sidebar"

// instant = false: dashboard reads Clerk session. Auth-gated, no static shell.
export const instant = false

export const metadata: Metadata = {
  title: "Dashboard – Data Atmos",
  description:
    "Your Data Atmos management dashboard. Manage datastores, view performance metrics, configure AI workloads, and optimize your data operations.",
  openGraph: {
    title: "Dashboard – Data Atmos",
    description:
      "Your Data Atmos management dashboard. Manage datastores, view performance metrics, configure AI workloads, and optimize your data operations.",
    url: "https://dataatmos.ai/dashboard",
  },
  twitter: {
    title: "Dashboard – Data Atmos",
    description:
      "Your Data Atmos management dashboard. Manage datastores, view performance metrics, configure AI workloads, and optimize your data operations.",
  },
  alternates: {
    canonical: "https://dataatmos.ai/dashboard",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-full min-h-0">
      <DashboardLayout>{children}</DashboardLayout>
      <Suspense fallback={null}>
        <EnsureOrganization />
        <CommandPalette />
      </Suspense>
    </SidebarProvider>
  )
}
