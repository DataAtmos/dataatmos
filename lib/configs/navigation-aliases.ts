export interface Alias {
  alias: string
  target: string
}

export const aliases: Alias[] = [
  { alias: "dashboard", target: "/dashboard" },
  { alias: "insights", target: "/dashboard/insights" },
  { alias: "monitoring", target: "/dashboard/monitoring" },
  { alias: "cluster", target: "/dashboard/cluster-configuration" },
  { alias: "backups", target: "/dashboard/backups" },
  { alias: "settings", target: "/dashboard/settings" },
]
