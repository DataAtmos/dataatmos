import { Suspense } from "react"
import { AuthForm } from "./_components/auth-form"

export default function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; email?: string }>
}) {
  return (
    <Suspense fallback={<AuthForm redirectTo="/dashboard" />}>
      <AuthFromSearchParams searchParams={searchParams} />
    </Suspense>
  )
}

async function AuthFromSearchParams({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; email?: string }>
}) {
  const { redirect, email } = await searchParams
  return <AuthForm redirectTo={redirect || "/dashboard"} emailPrefill={email} />
}
