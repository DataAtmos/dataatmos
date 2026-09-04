"use client"

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { toast } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { finishAuth } from "@/lib/auth/complete-auth"
import {
  AUTH_CONTINUE_PATH,
  applyMissingSignUpFields,
  readAuthRedirect,
  remainingSignUpGaps,
} from "@/lib/auth/sso"

function SsoCallbackContent() {
  const clerk = useClerk()
  const { setActive } = clerk
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRun = useRef(false)
  const redirectTo = searchParams.get("redirect") || readAuthRedirect()

  useEffect(() => {
    if (!clerk.loaded || !signIn || !signUp || hasRun.current) return
    hasRun.current = true

    const goAuth = (message?: string) => {
      if (message) toast.error(message)
      router.replace("/auth")
    }

    const afterAuth = async ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
      await finishAuth(setActive, decorateUrl, redirectTo, clerk.session?.lastActiveOrganizationId)
    }

    const finalizeSignIn = async () => {
      const { error } = await signIn.finalize({ navigate: afterAuth })
      if (error) goAuth(error.message || "Failed to finish sign in")
    }

    const finalizeSignUp = async () => {
      const { error } = await signUp.finalize({ navigate: afterAuth })
      if (error) goAuth(error.message || "Failed to finish sign up")
    }

    const continueSignUp = async () => {
      const applied = await applyMissingSignUpFields(signUp)
      if (applied.error) {
        goAuth(applied.error.message || "Failed to create account")
        return
      }

      if (signUp.status === "complete") {
        await finalizeSignUp()
        return
      }

      const gaps = remainingSignUpGaps(signUp)
      if (gaps.needsEmailVerify) {
        const sent = await signUp.verifications.sendEmailCode()
        if (sent.error) {
          goAuth(sent.error.message || "Failed to send verification email")
          return
        }
        const email = signUp.emailAddress || ""
        router.replace(
          `/auth/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`
        )
        return
      }

      router.replace(`${AUTH_CONTINUE_PATH}?redirect=${encodeURIComponent(redirectTo)}`)
    }

    void (async () => {
      try {
        if (signIn.status === "complete") {
          await finalizeSignIn()
          return
        }

        if (signUp.isTransferable) {
          const { error } = await signIn.create({ transfer: true })
          if (error) {
            goAuth(error.message || "Failed to continue with this account")
            return
          }
          const transferred = signIn.status as typeof signIn.status | "complete"
          if (transferred === "complete") {
            await finalizeSignIn()
            return
          }
          if (transferred === "needs_second_factor") {
            router.replace(`/auth/two-factor?redirect=${encodeURIComponent(redirectTo)}`)
            return
          }
          goAuth()
          return
        }

        if (
          signIn.status === "needs_first_factor" &&
          !signIn.supportedFirstFactors?.every(factor => factor.strategy === "enterprise_sso")
        ) {
          goAuth()
          return
        }

        if (signIn.isTransferable) {
          const { error } = await signUp.create({ transfer: true })
          if (error) {
            goAuth(error.message || "Failed to create account")
            return
          }
          if (signUp.status === "complete") {
            await finalizeSignUp()
            return
          }
          await continueSignUp()
          return
        }

        if (signUp.status === "complete") {
          await finalizeSignUp()
          return
        }

        if (signUp.status === "missing_requirements") {
          await continueSignUp()
          return
        }

        if (signIn.status === "needs_second_factor") {
          router.replace(`/auth/two-factor?redirect=${encodeURIComponent(redirectTo)}`)
          return
        }

        const sessionId = signIn.existingSession?.sessionId || signUp.existingSession?.sessionId
        if (sessionId) {
          await clerk.setActive({
            session: sessionId,
            navigate: afterAuth,
          })
          return
        }

        goAuth()
      } catch (error) {
        goAuth(error instanceof Error ? error.message : "Failed to continue with this account")
      }
    })()
  }, [clerk, redirectTo, router, setActive, signIn, signUp])

  return (
    <AuthShell title="Signing in" description="Finishing sign in...">
      <div id="clerk-captcha" />
      <Spinner className="mt-8" />
    </AuthShell>
  )
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={<AuthShell title="Signing in" description="Finishing sign in..." />}>
      <SsoCallbackContent />
    </Suspense>
  )
}
