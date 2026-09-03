import { ensureOrganization } from "@/lib/auth/ensure-organization"
import { workspaceDestination } from "@/lib/auth/workspace"

type SetActive = (args: { organization: string | null }) => Promise<void>

async function activateOrganization(setActive: SetActive) {
  const result = await ensureOrganization()
  if (result.error) {
    throw new Error(result.error)
  }
  if (result.orgId) {
    await setActive({ organization: result.orgId })
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
  goDecorated(decorateUrl, workspaceDestination(result.slug ?? result.orgId, redirectTo))
}
