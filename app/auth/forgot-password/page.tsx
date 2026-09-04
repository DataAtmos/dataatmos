"use client"

import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { AuthBackLink, AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const leaving = useRef(false)
  const { signIn } = useSignIn()
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const created = await signIn.create({ identifier: email })
      if (created.error) {
        toast.error(created.error.message)
        return
      }

      const { error } = await signIn.resetPasswordEmailCode.sendCode()

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Reset code sent")
      leaving.current = true
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email")
    } finally {
      if (!leaving.current) setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Forgot password?"
      description="Enter your email and we will send a reset code"
    >
      <form onSubmit={handleResetPassword} className="mt-8 w-full space-y-3 text-left">
        <Input
          id="reset-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
          autoFocus
        />
        <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
          {loading ? (
            <>
              <Spinner />
              Sending code...
            </>
          ) : (
            "Send reset code"
          )}
        </Button>
      </form>
      <AuthBackLink />
    </AuthShell>
  )
}
