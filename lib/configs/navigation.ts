import { ArchiveIcon } from "@/components/ui/icons/archive"
import { ChartLineIcon } from "@/components/ui/icons/chart-line"
import { CogIcon } from "@/components/ui/icons/cog"
import { HomeIcon } from "@/components/ui/icons/home"
import { LayersIcon } from "@/components/ui/icons/layers"
import { LockIcon } from "@/components/ui/icons/lock"
import { MonitorCheckIcon } from "@/components/ui/icons/monitor-check"
import { TerminalIcon } from "@/components/ui/icons/terminal"

export interface NavigationPage {
  title: string
  href: string
  icon: React.ComponentType<{ size?: number }>
  group: string
  requiresAuth?: boolean
  workspacePath?: string
}

export const navigationPages: NavigationPage[] = [
  { title: "Home", href: "/", icon: HomeIcon, group: "Marketing", requiresAuth: false },

  { title: "Sign In", href: "/auth", icon: LockIcon, group: "Auth", requiresAuth: false },
  {
    title: "Forgot Password",
    href: "/auth/forgot-password",
    icon: LockIcon,
    group: "Auth",
    requiresAuth: false,
  },
  {
    title: "Reset Password",
    href: "/auth/reset-password",
    icon: LockIcon,
    group: "Auth",
    requiresAuth: false,
  },
  {
    title: "Two Factor",
    href: "/auth/two-factor",
    icon: LockIcon,
    group: "Auth",
    requiresAuth: false,
  },
  {
    title: "Verify Email",
    href: "/auth/verify-email",
    icon: LockIcon,
    group: "Auth",
    requiresAuth: false,
  },

  {
    title: "Dashboard",
    href: "/dashboard",
    icon: TerminalIcon,
    group: "Workspace",
    requiresAuth: true,
    workspacePath: "",
  },
  {
    title: "Insights",
    href: "/dashboard/insights",
    icon: ChartLineIcon,
    group: "Workspace",
    requiresAuth: true,
    workspacePath: "/insights",
  },
  {
    title: "Monitoring",
    href: "/dashboard/monitoring",
    icon: MonitorCheckIcon,
    group: "Workspace",
    requiresAuth: true,
    workspacePath: "/monitoring",
  },
  {
    title: "Cluster configuration",
    href: "/dashboard/cluster-configuration",
    icon: LayersIcon,
    group: "Workspace",
    requiresAuth: true,
    workspacePath: "/cluster-configuration",
  },
  {
    title: "Backups",
    href: "/dashboard/backups",
    icon: ArchiveIcon,
    group: "Workspace",
    requiresAuth: true,
    workspacePath: "/backups",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: CogIcon,
    group: "Workspace",
    requiresAuth: true,
    workspacePath: "/settings",
  },
]
