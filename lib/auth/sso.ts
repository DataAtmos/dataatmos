import { isUnknownNameParam, nameFromOauthProfile, signupNamePayload } from "@/lib/auth/signup-name"

export const AUTH_REDIRECT_KEY = "auth-redirect"
export const AUTH_CONTINUE_PATH = "/auth/continue"
export const AUTH_SSO_CALLBACK_PATH = "/auth/sso-callback"

type ClerkErrorLike = {
  code?: string
  message?: string
  longMessage?: string
  meta?: { paramName?: string }
} | null

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
}

export function rememberAuthRedirect(path: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(AUTH_REDIRECT_KEY, path)
}

export function readAuthRedirect(fallback = "/dashboard") {
  if (typeof window === "undefined") return fallback
  return sessionStorage.getItem(AUTH_REDIRECT_KEY) || fallback
}

export function ssoCallbackUrl(redirectTo: string) {
  const params = new URLSearchParams({ redirect: redirectTo })
  return `${AUTH_SSO_CALLBACK_PATH}?${params.toString()}`
}

export function remainingSignUpGaps(signUp: {
  missingFields: readonly string[]
  unverifiedFields: readonly string[]
}) {
  const missing = signUp.missingFields.filter(field => field !== "legal_accepted")
  return {
    needsName: missing.includes("first_name") || missing.includes("last_name"),
    needsEmailVerify: signUp.unverifiedFields.includes("email_address"),
    otherMissing: missing.filter(field => field !== "first_name" && field !== "last_name"),
  }
}

export async function applyMissingSignUpFields(signUp: SignUpClient) {
  const missing = signUp.missingFields
  if (!missing.length) return { error: null as ClerkErrorLike }

  const updates: {
    firstName?: string
    lastName?: string
    legalAccepted?: boolean
    unsafeMetadata?: { fullName: string }
  } = {}

  if (missing.includes("legal_accepted")) {
    updates.legalAccepted = true
  }

  const needsName = missing.includes("first_name") || missing.includes("last_name")
  const name = nameFromOauthProfile(signUp)
  if (needsName && name) {
    Object.assign(
      updates,
      signupNamePayload([...signUp.requiredFields, ...signUp.optionalFields], name)
    )
  }

  if (!Object.keys(updates).length) return { error: null as ClerkErrorLike }

  let { error } = await signUp.update(updates)
  if (isUnknownNameParam(error)) {
    const retry: typeof updates = {}
    if (updates.legalAccepted) retry.legalAccepted = true
    if (updates.unsafeMetadata) retry.unsafeMetadata = updates.unsafeMetadata
    ;({ error } = await signUp.update(retry))
  }

  return { error }
}
