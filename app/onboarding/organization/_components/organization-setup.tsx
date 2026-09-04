"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/ui/page-loader"
import { ensureOrganization } from "@/lib/auth/ensure-organization"
import { workspacePath } from "@/lib/auth/workspace"

export function OrganizationSetup() {
  const { isLoaded, isSignedIn } = useAuth()
  const { setActive } = useClerk()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || started.current) return
    started.current = true

    void (async () => {
      const result = await ensureOrganization()
      if (result.orgId) {
        await setActive({ organization: result.orgId })
        router.replace(workspacePath(result.slug || result.orgId))
        return
      }
      setError(result.error ?? "Could not create workspace")
    })()
  }, [isLoaded, isSignedIn, router, setActive])

  if (!error) {
    return <PageLoader text="Setting up your workspace..." />
  }

  return (
    <AuthShell title="Workspace setup failed" description={error}>
      <Button className="mt-8 w-full" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </AuthShell>
  )
}
