"use client"

import { useClerk, useSignUp } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { AuthBackLink, AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageLoader } from "@/components/ui/page-loader"
import { toast } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { finishAuth } from "@/lib/auth/complete-auth"
import { isUnknownNameParam, nameFromOauthProfile, signupNamePayload } from "@/lib/auth/signup-name"
import { applyMissingSignUpFields, remainingSignUpGaps } from "@/lib/auth/sso"

function ContinueSignUpContent() {
  const { signUp, errors } = useSignUp()
  const { setActive } = useClerk()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const autoTried = useRef(false)
  const leaving = useRef(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const [needsName, setNeedsName] = useState(false)

  const afterAuth = async ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
    await finishAuth(setActive, decorateUrl, redirectTo, undefined, url => router.replace(url))
  }

  const resolveSignUp = async () => {
    if (signUp.status === "complete") {
      const { error } = await signUp.finalize({ navigate: afterAuth })
      if (error) {
        toast.error(error.message || "Failed to create account")
        router.replace("/auth")
      }
      return true
    }

    const gaps = remainingSignUpGaps(signUp)
    if (gaps.needsEmailVerify) {
      const sent = await signUp.verifications.sendEmailCode()
      if (sent.error) {
        toast.error(sent.error.message || "Failed to send verification email")
        router.replace("/auth")
        return true
      }
      router.replace(
        `/auth/verify-email?email=${encodeURIComponent(signUp.emailAddress || "")}&redirect=${encodeURIComponent(redirectTo)}`
      )
      return true
    }

    if (gaps.otherMissing.length) {
      toast.error("This sign-in needs extra details we cannot collect here")
      router.replace("/auth")
      return true
    }

    setNeedsName(gaps.needsName)
    return !gaps.needsName
  }

  useEffect(() => {
    if (!signUp || autoTried.current) return
    autoTried.current = true

    void (async () => {
      try {
        if (signUp.status !== "complete") {
          const applied = await applyMissingSignUpFields(signUp)
          if (applied.error) {
            toast.error(applied.error.message || "Failed to create account")
            router.replace("/auth")
            return
          }
        }

        if (signUp.status === "complete") {
          const { error } = await signUp.finalize({
            navigate: async ({ decorateUrl }) => {
              await finishAuth(setActive, decorateUrl, redirectTo, undefined, url =>
                router.replace(url)
              )
            },
          })
          if (error) {
            toast.error(error.message || "Failed to create account")
            router.replace("/auth")
          }
          return
        }

        const gaps = remainingSignUpGaps(signUp)
        if (gaps.needsEmailVerify) {
          const sent = await signUp.verifications.sendEmailCode()
          if (sent.error) {
            toast.error(sent.error.message || "Failed to send verification email")
            router.replace("/auth")
            return
          }
          router.replace(
            `/auth/verify-email?email=${encodeURIComponent(signUp.emailAddress || "")}&redirect=${encodeURIComponent(redirectTo)}`
          )
          return
        }

        if (gaps.otherMissing.length) {
          toast.error("This sign-in needs extra details we cannot collect here")
          router.replace("/auth")
          return
        }

        if (gaps.needsName) {
          setName(nameFromOauthProfile(signUp))
          setNeedsName(true)
          return
        }

        router.replace("/auth")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create account")
        router.replace("/auth")
      } finally {
        setLoading(false)
      }
    })()
  }, [redirectTo, router, setActive, signUp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = signupNamePayload([...signUp.requiredFields, ...signUp.optionalFields], name)
      let { error } = await signUp.update(payload)
      if (isUnknownNameParam(error)) {
        const retry = await signUp.update({
          unsafeMetadata: { fullName: name.trim() },
        })
        error = retry.error
      }
      if (error) {
        toast.error(error.message || "Failed to create account")
        return
      }
      const done = await resolveSignUp()
      if (done) {
        leaving.current = true
        return
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account")
    } finally {
      if (!leaving.current) setLoading(false)
    }
  }

  if (loading || !needsName) {
    return (
      <>
        <div id="clerk-captcha" />
        <PageLoader text="Creating your account..." />
      </>
    )
  }

  return (
    <AuthShell title="Finish creating your account" description="Add your name to continue">
      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-3 text-left">
        <Input
          id="auth-continue-name"
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          disabled={loading}
          autoComplete="name"
          autoFocus
        />
        {errors?.fields?.firstName?.message || errors?.fields?.lastName?.message ? (
          <p className="text-xs text-destructive">
            {errors.fields.firstName?.message || errors.fields.lastName?.message}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
          {loading ? <Spinner /> : "Continue"}
        </Button>
      </form>
      <div id="clerk-captcha" />
      <AuthBackLink />
    </AuthShell>
  )
}

export default function ContinueSignUpPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <ContinueSignUpContent />
    </Suspense>
  )
}
