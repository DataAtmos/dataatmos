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
  _setActive: SetActive,
  decorateUrl: (url: string) => string,
  _redirectTo: string
) {
  // finalize() calls navigate before the session cookie exists.
  // ensureOrganization() via auth() fails here and costs a round trip.
  // Org setup runs on /onboarding/organization once the session is live.
  goDecorated(decorateUrl, "/onboarding/organization")
}
