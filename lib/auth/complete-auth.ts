import { workspaceDestination } from "@/lib/auth/workspace"

type SetActive = (args: { organization: string | null }) => Promise<void>

export type AuthNavigate = (url: string) => void

function clientUrl(url: string) {
  if (!url.startsWith("http")) return url
  try {
    const parsed = new URL(url)
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    return null
  }
  return null
}

function goDecorated(decorateUrl: (url: string) => string, path: string, navigate?: AuthNavigate) {
  const url = decorateUrl(path)
  const next = clientUrl(url)
  if (navigate && next) {
    navigate(next)
    return
  }
  if (url.startsWith("http")) {
    window.location.href = url
    return
  }
  window.location.replace(url)
}

export async function finishAuth(
  setActive: SetActive,
  decorateUrl: (url: string) => string,
  redirectTo: string,
  lastActiveOrganizationId?: string | null,
  navigate?: AuthNavigate
) {
  if (lastActiveOrganizationId) {
    try {
      await setActive({ organization: lastActiveOrganizationId })
    } catch {
      // Session may still be activating during finalize navigate
    }
    goDecorated(decorateUrl, workspaceDestination(lastActiveOrganizationId, redirectTo), navigate)
    return
  }

  // finalize() calls navigate before the session cookie exists.
  // ensureOrganization() via auth() fails here and costs a round trip.
  // Org setup runs on /onboarding/organization once the session is live.
  goDecorated(decorateUrl, "/onboarding/organization", navigate)
}
