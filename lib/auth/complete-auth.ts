import { ensureOrganization } from "@/lib/auth/ensure-organization"
import { workspaceDestination } from "@/lib/auth/workspace"

type SetActive = (args: { organization: string | null }) => Promise<void>

async function activateOrganization(setActive: SetActive) {
  const result = await ensureOrganization()
  if (!result.orgId) return result
  try {
    await setActive({ organization: result.orgId })
  } catch {
    // Session may still be activating during finalize navigate
  }
  return result
}

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
  redirectTo: string
) {
  const result = await activateOrganization(setActive)
  if (result.orgId) {
    goDecorated(decorateUrl, workspaceDestination(result.slug ?? result.orgId, redirectTo))
    return
  }

  // finalize() calls navigate before the session cookie exists.
  // auth() then fails. Leave this page anyway so OTP does not trap the user.
  goDecorated(decorateUrl, "/onboarding/organization")
}
