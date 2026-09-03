import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="w-full max-w-[320px] flex flex-col items-center text-center">
      <Link href="/" aria-label="Data Atmos home">
        <Logo width={28} height={28} className="h-7 w-7" />
      </Link>
      <h1 className="mt-6 text-lg font-medium tracking-tight">{title}</h1>
      {description ? <p className="mt-2 text-xs text-muted-foreground">{description}</p> : null}
      {children}
    </div>
  )
}

export function AuthBackLink({
  href = "/auth",
  children = "Back to sign in",
}: {
  href?: string
  children?: React.ReactNode
}) {
  return (
    <Link href={href} className="mt-8 text-xs text-muted-foreground hover:text-foreground">
      {children}
    </Link>
  )
}
