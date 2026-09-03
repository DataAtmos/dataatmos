export const DASHBOARD_ROOT = "/dashboard"

export const DASHBOARD_SEGMENTS = [
  "insights",
  "monitoring",
  "cluster-configuration",
  "backups",
  "settings",
] as const

export type DashboardSegment = (typeof DASHBOARD_SEGMENTS)[number]

export function slugifyWorkspace(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36)

  return base || "workspace"
}

export function workspaceSlugCandidate(name: string, attempt: number) {
  const base = slugifyWorkspace(name)
  if (attempt <= 0) return base
  const suffix = `-${attempt + 1}`
  return `${base.slice(0, Math.max(1, 36 - suffix.length))}${suffix}`
}

export function workspaceKey(org: { id: string; slug?: string | null }) {
  return org.slug || org.id
}

export function workspaceMatches(urlSlug: string, orgSlug?: string | null, orgId?: string | null) {
  return urlSlug === orgSlug || urlSlug === orgId
}

export function workspacePath(key: string, rest = "") {
  const suffix = !rest || rest.startsWith("/") ? rest : `/${rest}`
  return `${DASHBOARD_ROOT}/${key}${suffix}`
}

export function isReservedDashboardSegment(segment: string) {
  return (DASHBOARD_SEGMENTS as readonly string[]).includes(segment)
}

export function parseDashboardPath(pathname: string) {
  const [path] = pathname.split("?")
  const parts = path.split("/").filter(Boolean)

  if (parts[0] !== "dashboard") {
    return { slug: null, rest: "", restParts: [] as string[] }
  }

  const slug = parts[1] ?? null
  const restParts = parts.slice(2)
  return {
    slug,
    rest: restParts.length ? `/${restParts.join("/")}` : "",
    restParts,
  }
}

export function workspaceDestination(key: string | null | undefined, redirectTo: string) {
  if (!key) return redirectTo || DASHBOARD_ROOT

  const target = redirectTo || DASHBOARD_ROOT
  if (target === DASHBOARD_ROOT || target === `${DASHBOARD_ROOT}/`) {
    return workspacePath(key)
  }

  const parsed = parseDashboardPath(target)
  if (!parsed.slug && target.startsWith(`${DASHBOARD_ROOT}/`) === false) {
    return target
  }

  if (parsed.slug && isReservedDashboardSegment(parsed.slug)) {
    return workspacePath(key, `/${parsed.slug}${parsed.rest}`)
  }

  if (parsed.slug) {
    return workspacePath(key, parsed.rest)
  }

  return workspacePath(key)
}
