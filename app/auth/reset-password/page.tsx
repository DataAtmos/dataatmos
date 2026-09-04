"use client"

import { useClerk, useSignIn } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useRef, useState } from "react"
import { AuthOtp } from "@/components/auth/auth-otp"
import { AuthBackLink, AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { EyeOffIcon } from "@/components/ui/icons/eye-off"
import { Input } from "@/components/ui/input"
import { PageLoader } from "@/components/ui/page-loader"
import { toast } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"

function signInUrl(email: string | null) {
  if (!email) return "/auth"
  return `/auth?email=${encodeURIComponent(email)}`
}

function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const leaving = useRef(false)
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const { signIn, errors } = useSignIn()
  const { signOut } = useClerk()
  const router = useRouter()

  const returnToSignIn = async () => {
    try {
      await signIn.reset()
    } catch {
      // Sign-in resource may already be cleared
    }
    try {
      await signOut()
    } catch {
      // No active session after reset
    }
    router.replace(signInUrl(email))
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setLoading(true)

    try {
      const verified = await signIn.resetPasswordEmailCode.verifyCode({ code })
      if (verified.error) {
        toast.error(verified.error.message || "Invalid reset code")
        return
      }

      const submitted = await signIn.resetPasswordEmailCode.submitPassword({ password })
      if (submitted.error) {
        toast.error(submitted.error.message || "Reset password failed")
        return
      }

      leaving.current = true
      setResetSuccess(true)
      toast.success("Password reset successful. Sign in with your new password.")
      await returnToSignIn()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      if (!leaving.current) setLoading(false)
    }
  }

  if (resetSuccess) {
    return (
      <AuthShell title="Password updated" description="Taking you to sign in">
        <Button asChild className="mt-8 w-full">
          <Link href={signInUrl(email)}>Continue to sign in</Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset password"
      description={email ? `Code sent to ${email}` : "Enter the code from your email"}
    >
      <form onSubmit={handleResetPassword} className="mt-8 w-full space-y-3">
        <AuthOtp value={code} onChange={setCode} disabled={loading} autoFocus />
        {errors?.fields?.code ? (
          <p className="text-xs text-destructive">{errors.fields.code.message}</p>
        ) : null}

        <div className="relative text-left">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="new-password"
            minLength={8}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeOffIcon size={12} />
          </button>
        </div>

        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loading || code.length !== 6 || !password.trim() || !confirmPassword.trim()}
        >
          {loading ? (
            <>
              <Spinner />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
      <AuthBackLink />
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
