// instant = false: onboarding reads Clerk session. Auth-gated, no static shell.
export const instant = false

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-auto">
      <div className="flex min-h-full items-center justify-center px-4 py-16">{children}</div>
    </div>
  )
}
