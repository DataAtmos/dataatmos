import { finishAuth } from "@/lib/auth/complete-auth"
import { saveLastAuthMethod } from "@/lib/auth/last-auth-method"
import { AUTH_CONTINUE_PATH, applyMissingSignUpFields, remainingSignUpGaps } from "@/lib/auth/sso"

type ClerkErrorLike = {
  message?: string
} | null

type SetActive = (args: { organization: string | null }) => Promise<void>

type SignUpClient = {
  status: string | null
  firstName: string | null
  lastName: string | null
  emailAddress: string | null
  requiredFields: readonly string[]
  optionalFields: readonly string[]
  missingFields: readonly string[]
  unverifiedFields: readonly string[]
  update: (params: {
    firstName?: string
    lastName?: string
    legalAccepted?: boolean
    unsafeMetadata?: { fullName: string }
  }) => Promise<{ error: ClerkErrorLike }>
  finalize: (params: {
    navigate: (args: { decorateUrl: (url: string) => string }) => Promise<void>
  }) => Promise<{ error: ClerkErrorLike }>
}

export async function completeVerifiedSignUp({
  signUp,
  setActive,
  redirectTo,
  goContinue,
  navigate,
}: {
  signUp: SignUpClient
  setActive: SetActive
  redirectTo: string
  goContinue: () => void
  navigate?: (url: string) => void
}) {
  if (signUp.status === "missing_requirements") {
    const applied = await applyMissingSignUpFields(signUp)
    if (applied.error) {
      return { error: applied.error.message || "Failed to create account" }
    }
  }

  if (signUp.status === "complete") {
    saveLastAuthMethod("email")
    const { error } = await signUp.finalize({
      navigate: async ({ decorateUrl }) => {
        await finishAuth(setActive, decorateUrl, redirectTo, undefined, navigate)
      },
    })
    if (error) return { error: error.message || "Failed to create account" }
    return { error: null }
  }

  const gaps = remainingSignUpGaps(signUp)
  if (gaps.needsName || gaps.otherMissing.length) {
    goContinue()
    return { error: null }
  }

  return { error: "Could not finish creating your account" }
}

export function continueSignUpPath(redirectTo: string) {
  return `${AUTH_CONTINUE_PATH}?redirect=${encodeURIComponent(redirectTo)}`
}
