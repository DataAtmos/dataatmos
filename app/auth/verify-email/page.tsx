"use client"

import { useAuth, useClerk, useSignUp } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { AuthOtp } from "@/components/auth/auth-otp"
import { AuthBackLink, AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { LoaderPinwheelIcon } from "@/components/ui/icons/loader-pinwheel"
import { toast } from "@/components/ui/sonner"
import { completeVerifiedSignUp, continueSignUpPath } from "@/lib/auth/complete-signup"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const { signUp, errors } = useSignUp()
  const { setActive } = useClerk()
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const leaving = useRef(false)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || leaving.current) return
    leaving.current = true
    router.replace("/onboarding/organization")
  }, [isLoaded, isSignedIn, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code })
      if (error) {
        toast.error(error.message || "Invalid verification code")
        return
      }

      leaving.current = true
      const finished = await completeVerifiedSignUp({
        signUp,
        setActive,
        redirectTo,
        goContinue: () => router.replace(continueSignUpPath(redirectTo)),
      })
      if (finished.error) {
        leaving.current = false
        toast.error(finished.error)
      }
    } catch (error) {
      leaving.current = false
      toast.error(error instanceof Error ? error.message : "Failed to verify email")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      const { error } = await signUp.verifications.sendEmailCode()
      if (error) {
        toast.error(error.message || "Failed to resend code")
        return
      }
      toast.success("Verification code sent")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Check your email"
      description={email ? `Enter the code sent to ${email}` : "Enter the verification code"}
    >
      <form onSubmit={handleVerify} className="mt-8 w-full space-y-3">
        <AuthOtp value={code} onChange={setCode} disabled={loading} autoFocus />
        {errors?.fields?.code ? (
          <p className="text-xs text-destructive">{errors.fields.code.message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? (
            <>
              <LoaderPinwheelIcon size={12} />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>
      </form>
      <button
        type="button"
        className="mt-3 text-xs text-muted-foreground hover:text-foreground"
        onClick={handleResend}
        disabled={loading}
      >
        Resend code
      </button>
      <div id="clerk-captcha" />
      <AuthBackLink />
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthShell title="Check your email" description="Loading..." />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
