"use client"

import { useClerk, useSignIn } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { AuthOtp } from "@/components/auth/auth-otp"
import { AuthBackLink, AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/ui/page-loader"
import { toast } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { finishAuth } from "@/lib/auth/complete-auth"

function TwoFactorContent() {
  const [totpCode, setTotpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signIn } = useSignIn()
  const clerk = useClerk()
  const { setActive } = clerk
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"

  const handleTotpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
      toast.error("TOTP code must be 6 digits")
      return
    }

    setLoading(true)
    let done = false
    try {
      const { error } = await signIn.mfa.verifyTOTP({ code: totpCode })

      if (error) {
        toast.error(error.message || "Invalid TOTP code")
        return
      }

      if (signIn.status === "complete") {
        done = true
        setSuccess(true)
        router.prefetch("/onboarding/organization")
        router.prefetch(redirectTo)
        await signIn.finalize({
          navigate: async ({ decorateUrl }) => {
            await finishAuth(
              setActive,
              decorateUrl,
              redirectTo,
              clerk.session?.lastActiveOrganizationId,
              url => router.replace(url)
            )
          },
        })
      } else {
        toast.error("Invalid TOTP code")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid verification code")
    } finally {
      if (!done) setLoading(false)
    }
  }

  if (success) {
    return <PageLoader text="Signing you in..." />
  }

  return (
    <AuthShell title="Two-factor" description="Enter the 6-digit code from your authenticator app">
      <form onSubmit={handleTotpVerification} className="mt-8 w-full space-y-3">
        <AuthOtp value={totpCode} onChange={setTotpCode} disabled={loading} autoFocus />
        <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
          {loading ? (
            <>
              <Spinner />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </form>
      <AuthBackLink />
    </AuthShell>
  )
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <TwoFactorContent />
    </Suspense>
  )
}
