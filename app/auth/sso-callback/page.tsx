"use client"

import { useClerk } from "@clerk/nextjs"
import { useEffect } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoaderPinwheelIcon } from "@/components/ui/icons/loader-pinwheel"

export default function SsoCallbackPage() {
  const { handleRedirectCallback } = useClerk()

  useEffect(() => {
    void handleRedirectCallback({
      signInForceRedirectUrl: "/dashboard",
      signUpForceRedirectUrl: "/dashboard",
    })
  }, [handleRedirectCallback])

  return (
    <AuthShell title="Signing in" description="Finishing sign in...">
      <LoaderPinwheelIcon size={12} className="mt-8" />
    </AuthShell>
  )
}
