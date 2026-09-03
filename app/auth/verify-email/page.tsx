"use client"

import { useClerk, useSignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { AuthOtp } from "@/components/auth/auth-otp"
import { AuthBackLink, AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { LoaderPinwheelIcon } from "@/components/ui/icons/loader-pinwheel"
import { toast } from "@/components/ui/sonner"
import { finishAuth } from "@/lib/auth/complete-auth"
import { saveLastAuthMethod } from "@/lib/auth/last-auth-method"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const { signUp, errors } = useSignUp()
  const { setActive } = useClerk()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code })
      if (error) {
        toast.error(error.message || "Invalid verification code")
        return
      }

      if (signUp.status === "complete") {
        saveLastAuthMethod("email")
        await signUp.finalize({
          navigate: async ({ decorateUrl }) => {
            await finishAuth(setActive, decorateUrl, redirectTo)
          },
        })
      }
    } catch (error) {
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
