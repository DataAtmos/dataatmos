export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-auto">
      <div className="flex min-h-full items-center justify-center px-4 py-16">
        <div className="flex w-full max-w-[320px] flex-col items-center">{children}</div>
      </div>
    </div>
  )
}
