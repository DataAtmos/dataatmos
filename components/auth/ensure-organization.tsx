"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ensureOrganization } from "@/lib/auth/ensure-organization"
import { parseDashboardPath, workspacePath } from "@/lib/auth/workspace"

export function EnsureOrganization() {
  const { isLoaded, isSignedIn, orgId, orgSlug } = useAuth()
  const { setActive } = useClerk()
  const pathname = usePathname()
  const router = useRouter()
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || attempted) return

    const { slug, rest } = parseDashboardPath(pathname)
    const activeKey = orgSlug || orgId
    if (activeKey) {
      if (!slug) router.replace(workspacePath(activeKey, rest))
      return
    }

    setAttempted(true)

    void (async () => {
      const result = await ensureOrganization()
      if (!result.orgId) return
      await setActive({ organization: result.orgId })
      const key = result.slug || result.orgId
      router.replace(workspacePath(key, rest))
    })()
  }, [attempted, isLoaded, isSignedIn, orgId, orgSlug, pathname, router, setActive])

  return null
}
