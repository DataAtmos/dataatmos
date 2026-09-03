export function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ") || undefined,
  }
}

export function metadataFullName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("fullName" in metadata)) return ""
  const value = metadata.fullName
  return typeof value === "string" ? value.trim() : ""
}

export function signupNamePayload(fieldNames: readonly string[], name: string) {
  const allowed = new Set(fieldNames)
  const { firstName, lastName } = splitName(name)
  return {
    ...(allowed.has("first_name") && firstName ? { firstName } : {}),
    ...(allowed.has("last_name") && lastName ? { lastName } : {}),
    unsafeMetadata: { fullName: name.trim() },
  }
}

export function isUnknownNameParam(
  error: {
    code?: string
    message?: string
    longMessage?: string
    meta?: { paramName?: string }
  } | null
) {
  if (!error) return false
  const param = error.meta?.paramName
  if (param === "first_name" || param === "last_name") return true
  const text = `${error.message ?? ""} ${error.longMessage ?? ""}`.toLowerCase()
  return /first[_\s]?name/.test(text) && text.includes("not a") && text.includes("param")
}

export function accountDisplayName(user: {
  fullName?: string | null
  firstName?: string | null
  unsafeMetadata?: unknown
}) {
  return user.fullName || user.firstName || metadataFullName(user.unsafeMetadata) || "Account"
}

export function workspaceOwnerLabel(
  firstName: string | null,
  metadata: unknown,
  email: string | undefined
) {
  const given = firstName || splitName(metadataFullName(metadata)).firstName
  if (given) return `${given}'s workspace`
  const local = email?.split("@")[0]
  if (local) return `${local} workspace`
  return "My workspace"
}
