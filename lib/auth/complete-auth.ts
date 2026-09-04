import { workspaceDestination } from "@/lib/auth/workspace"

type SetActive = (args: { organization: string | null }) => Promise<void>

function goDecorated(decorateUrl: (url: string) => string, path: string) {
  const url = decorateUrl(path)
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
  lastActiveOrganizationId?: string | null
) {
  if (lastActiveOrganizationId) {
    try {
      await setActive({ organization: lastActiveOrganizationId })
    } catch {
      // Session may still be activating during finalize navigate
    }
    goDecorated(decorateUrl, workspaceDestination(lastActiveOrganizationId, redirectTo))
    return
  }

  // finalize() calls navigate before the session cookie exists.
  // ensureOrganization() via auth() fails here and costs a round trip.
  // Org setup runs on /onboarding/organization once the session is live.
  goDecorated(decorateUrl, "/onboarding/organization")
}
