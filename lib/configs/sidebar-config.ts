import type { LucideIcon } from "lucide-react"
import {
  ChartSpline,
  DatabaseBackup,
  LayoutDashboard,
  MonitorCheck,
  ServerCog,
  Settings2,
} from "lucide-react"

export const DASHBOARD_NAV: {
  title: string
  path: string
  icon: LucideIcon
}[] = [
  { title: "Dashboard", path: "", icon: LayoutDashboard },
  { title: "Insights", path: "/insights", icon: ChartSpline },
  { title: "Monitoring", path: "/monitoring", icon: MonitorCheck },
  { title: "Cluster configuration", path: "/cluster-configuration", icon: ServerCog },
  { title: "Backups", path: "/backups", icon: DatabaseBackup },
  { title: "Settings", path: "/settings", icon: Settings2 },
]
