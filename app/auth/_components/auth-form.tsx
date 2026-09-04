"use client"

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useSyncExternalStore } from "react"
import { AuthOtp } from "@/components/auth/auth-otp"
import { Button } from "@/components/ui/button"
import { EyeOffIcon } from "@/components/ui/icons/eye-off"
import { Input } from "@/components/ui/input"
import { LastUsedBadge } from "@/components/ui/last-used-badge"
import { Logo } from "@/components/ui/logo"
import { PageLoader } from "@/components/ui/page-loader"
import { toast } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { finishAuth } from "@/lib/auth/complete-auth"
import { getLastAuthMethod, saveLastAuthMethod } from "@/lib/auth/last-auth-method"
import { isUnknownNameParam, signupNamePayload } from "@/lib/auth/signup-name"
import { rememberAuthRedirect, ssoCallbackUrl } from "@/lib/auth/sso"

const GOOGLE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 256 262"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
    />
    <path
      fill="#34A853"
      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
    />
    <path
      fill="#FBBC05"
      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
    />
    <path
      fill="#EB4335"
      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
    />
  </svg>
)

const MICROSOFT_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 21 21"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
)

const SSO_PROVIDERS = {
  google: { strategy: "oauth_google" as const, label: "Google" },
  microsoft: { strategy: "oauth_microsoft" as const, label: "Microsoft" },
}

function subscribeLastAuthMethod() {
  return () => {}
}

interface AuthFormProps {
  redirectTo: string
  emailPrefill?: string
}

export function AuthForm({ redirectTo, emailPrefill = "" }: AuthFormProps) {
  const router = useRouter()
  const clerk = useClerk()
  const { setActive } = clerk
  const { signIn, errors: signInErrors } = useSignIn()
  const { signUp, errors: signUpErrors } = useSignUp()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState(emailPrefill)
  const [password, setPassword] = useState("")
  const [trustCode, setTrustCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [needsTrust, setNeedsTrust] = useState(false)
  const [pending, setPending] = useState(false)
  const leaving = useRef(false)
  const lastAuthMethod = useSyncExternalStore(
    subscribeLastAuthMethod,
    getLastAuthMethod,
    () => null
  )

  const isSignUp = mode === "signup"

  const leave = () => {
    leaving.current = true
    setPending(true)
    router.prefetch("/onboarding/organization")
    router.prefetch(redirectTo)
  }

  const stay = () => {
    leaving.current = false
    setPending(false)
  }

  const afterAuth = async ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
    await finishAuth(
      setActive,
      decorateUrl,
      redirectTo,
      clerk.session?.lastActiveOrganizationId,
      url => router.replace(url)
    )
  }

  const fieldError = isSignUp
    ? signUpErrors?.fields?.emailAddress?.message ||
      signUpErrors?.fields?.password?.message ||
      signUpErrors?.fields?.firstName?.message ||
      signUpErrors?.fields?.lastName?.message ||
      signUpErrors?.global?.[0]?.message
    : signInErrors?.fields?.identifier?.message ||
      signInErrors?.fields?.password?.message ||
      signInErrors?.fields?.code?.message ||
      signInErrors?.global?.[0]?.message

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp && password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const namePayload = signupNamePayload(
          [...signUp.requiredFields, ...signUp.optionalFields],
          name
        )
        let { error } = await signUp.password({
          emailAddress: email,
          password,
          ...namePayload,
        })

        if (isUnknownNameParam(error)) {
          const retry = await signUp.password({
            emailAddress: email,
            password,
            unsafeMetadata: { fullName: name.trim() },
          })
          error = retry.error
        }

        if (error) {
          toast.error(error.message || "Failed to create account")
          return
        }

        if (signUp.unverifiedFields.includes("email_address")) {
          const sent = await signUp.verifications.sendEmailCode()
          if (sent.error) {
            toast.error(sent.error.message || "Failed to send verification email")
            return
          }
          leave()
          router.push(
            `/auth/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`
          )
          return
        }

        if (signUp.status === "complete") {
          saveLastAuthMethod("email")
          leave()
          const finalized = await signUp.finalize({ navigate: afterAuth })
          if (finalized.error) {
            stay()
            toast.error(finalized.error.message || "Failed to create account")
          }
        }
        return
      }

      const { error } = await signIn.password({
        identifier: email,
        password,
      })

      if (error) {
        toast.error(error.message || "Failed to sign in")
        return
      }

      if (signIn.status === "needs_second_factor") {
        leave()
        router.push(`/auth/two-factor?redirect=${encodeURIComponent(redirectTo)}`)
        return
      }

      if (signIn.status === "needs_client_trust") {
        await signIn.mfa.sendEmailCode()
        setNeedsTrust(true)
        toast.success("Verification code sent")
        return
      }

      if (signIn.status === "complete") {
        saveLastAuthMethod("email")
        leave()
        const finalized = await signIn.finalize({ navigate: afterAuth })
        if (finalized.error) {
          stay()
          toast.error(finalized.error.message || "Failed to sign in")
        }
      }
    } catch (error) {
      const fallback = isSignUp ? "Failed to create account" : "Failed to sign in"
      toast.error(error instanceof Error ? error.message : fallback)
    } finally {
      if (!leaving.current) setLoading(false)
    }
  }

  const handleTrustVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code: trustCode })
      if (error) {
        toast.error(error.message || "Invalid verification code")
        return
      }
      if (signIn.status === "complete") {
        saveLastAuthMethod("email")
        leave()
        const finalized = await signIn.finalize({ navigate: afterAuth })
        if (finalized.error) {
          stay()
          toast.error(finalized.error.message || "Failed to verify")
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify")
    } finally {
      if (!leaving.current) setLoading(false)
    }
  }

  const handleSso = async (method: keyof typeof SSO_PROVIDERS) => {
    const { strategy, label } = SSO_PROVIDERS[method]
    setLoading(true)
    try {
      if (!signIn) {
        toast.error(`Failed to continue with ${label}`)
        setLoading(false)
        return
      }
      saveLastAuthMethod(method)
      rememberAuthRedirect(redirectTo)
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: redirectTo,
        redirectCallbackUrl: ssoCallbackUrl(redirectTo),
      })
      if (error) {
        toast.error(error.message || `Failed to continue with ${label}`)
        setLoading(false)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to continue with ${label}`)
      setLoading(false)
    }
  }

  if (pending) {
    return <PageLoader text={isSignUp ? "Creating your account..." : "Signing you in..."} />
  }

  if (needsTrust) {
    return (
      <div className="w-full max-w-[320px] flex flex-col items-center text-center">
        <Link href="/" aria-label="Data Atmos home">
          <Logo width={28} height={28} className="h-7 w-7" />
        </Link>
        <h1 className="mt-6 text-lg font-medium tracking-tight">Verify this device</h1>
        <p className="mt-2 text-xs text-muted-foreground">Enter the code we sent to {email}</p>
        <form onSubmit={handleTrustVerify} className="mt-8 w-full space-y-3">
          <AuthOtp value={trustCode} onChange={setTrustCode} disabled={loading} autoFocus />
          <Button type="submit" className="w-full" disabled={loading || trustCode.length !== 6}>
            {loading ? <Spinner /> : "Verify"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[320px] flex flex-col items-center text-center">
      <Link href="/" aria-label="Data Atmos home">
        <Logo width={28} height={28} className="h-7 w-7" />
      </Link>
      <h1 className="mt-6 text-lg font-medium tracking-tight">
        {isSignUp ? "Create your account" : "Sign in to Data Atmos"}
      </h1>

      <form onSubmit={handleEmailSubmit} className="mt-8 w-full space-y-3 text-left">
        {isSignUp ? (
          <Input
            id="auth-name"
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={loading}
            autoComplete="name"
          />
        ) : null}

        <Input
          id="auth-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
        />

        <div className="relative">
          <Input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={isSignUp ? 8 : undefined}
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

        <div id="clerk-captcha" />

        {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}

        <div className="relative">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </>
            ) : isSignUp ? (
              "Create account"
            ) : (
              "Continue"
            )}
          </Button>
          <LastUsedBadge show={lastAuthMethod === "email"} className="absolute -top-2 -right-2" />
        </div>
      </form>

      {isSignUp ? null : (
        <Link
          href="/auth/forgot-password"
          className="mt-3 text-xs text-muted-foreground hover:text-foreground"
        >
          Forgot password?
        </Link>
      )}

      <div className="relative my-6 w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="relative w-full">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSso("google")}
            disabled={loading}
          >
            {GOOGLE_ICON}
            Continue with Google
          </Button>
          <LastUsedBadge show={lastAuthMethod === "google"} className="absolute -top-2 -right-2" />
        </div>
        <div className="relative w-full">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSso("microsoft")}
            disabled={loading}
          >
            {MICROSOFT_ICON}
            Continue with Microsoft
          </Button>
          <LastUsedBadge
            show={lastAuthMethod === "microsoft"}
            className="absolute -top-2 -right-2"
          />
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          className="text-foreground font-medium hover:text-primary"
          onClick={() => setMode(prev => (prev === "signin" ? "signup" : "signin"))}
        >
          {isSignUp ? "Sign in" : "Create account"}
        </button>
      </p>
    </div>
  )
}
