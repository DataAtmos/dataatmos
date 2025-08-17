"use client"

import { Button } from "@/components/ui/button"
import { EyeOffIcon } from "@/components/ui/icons/eye-off"
import { LoaderPinwheelIcon } from "@/components/ui/icons/loader-pinwheel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LastUsedBadge } from "@/components/ui/last-used-badge"
import { toast } from "@/components/ui/sonner"
import { signIn } from "@/lib/auth/auth-client"
import { getLastAuthMethod, saveLastAuthMethod, type AuthMethod } from "@/lib/auth/last-auth-method"
import { captureAuthError, captureEvent } from "@/lib/error-tracker-client"
import Link from "next/link"
import { useEffect, useState } from "react"

interface SignInTabProps {
  onSwitchToSignUp?: () => void
}

export function SignInTab({ onSwitchToSignUp }: SignInTabProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [lastAuthMethod, setLastAuthMethod] = useState<AuthMethod | null>(null)

  useEffect(() => {
    setLastAuthMethod(getLastAuthMethod())
  }, [])

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    captureEvent('sign_in_attempt', {
      method: 'email',
      email_domain: email.split('@')[1] || 'unknown',
    })

    try {
      await signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: () => {
            saveLastAuthMethod("email")
            captureEvent('sign_in_success', {
              method: 'email',
              email_domain: email.split('@')[1] || 'unknown',
            })
            toast.success("Successfully signed in!")
          },
          onError: (ctx: unknown) => {
            const errorCtx = ctx as { error: { code?: string; message: string } }
            
            captureAuthError(new Error(errorCtx.error.message), 'email', {
              additionalData: {
                error_code: errorCtx.error.code,
                email_domain: email.split('@')[1] || 'unknown',
              },
            })

            if (errorCtx.error.code === "TWO_FACTOR_REQUIRED") {
              captureEvent('two_factor_required', {
                method: 'email',
                email_domain: email.split('@')[1] || 'unknown',
              })
              window.location.href = "/auth/two-factor"
            } else {
              toast.error(errorCtx.error.message)
            }
          },
        }
      )
    } catch (error) {
      captureAuthError(error instanceof Error ? error : new Error("Failed to sign in"), 'email', {
        additionalData: {
          email_domain: email.split('@')[1] || 'unknown',
        },
      })
      toast.error(error instanceof Error ? error.message : "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    
    captureEvent('sign_in_attempt', {
      method: 'google',
      provider: 'google',
    })

    try {
      saveLastAuthMethod("google")
      const redirect = new URLSearchParams(window.location.search).get("redirect")
      
      captureEvent('social_sign_in_redirect', {
        provider: 'google',
        redirect_url: redirect || '/console',
      })

      await signIn.social({
        provider: "google",
        callbackURL: redirect || "/console",
      })
    } catch (error) {
      captureAuthError(error instanceof Error ? error : new Error("Failed to sign in with Google"), 'google', {
        additionalData: {
          provider: 'google',
        },
      })
      toast.error(error instanceof Error ? error.message : "Failed to sign in with Google")
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border h-full flex flex-col">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold tracking-tight">Sign In</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email below to access your data atmosphere
        </p>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <EyeOffIcon size={12} />
                </button>
              </div>
            </div>

            <div className="relative">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderPinwheelIcon size={12} />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              <LastUsedBadge
                show={lastAuthMethod === "email"}
                className="absolute -top-2 -right-2"
              />
            </div>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 256 262"
                  className="mr-2"
                >
                  <path
                    fill="#4285F4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  />
                  <path
                    fill="#34A853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  />
                  <path
                    fill="#FBBC05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  />
                  <path
                    fill="#EB4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  />
                </svg>
                Continue with Google
              </Button>
              <LastUsedBadge
                show={lastAuthMethod === "google"}
                className="absolute -top-2 -right-2"
              />
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-md border border-white/20 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative space-y-3">
              <h3 className="text-sm font-semibold text-white">Your Free Credits Awaits</h3>
              <p className="text-xs text-white/90 leading-relaxed">
                Invite a friend and get $8 in credits! Share the power of Data Atmos and both of you
                will receive bonus credits to kickstart your data journey.
              </p>
              <button className="text-xs text-white/90 hover:text-white font-medium transition-colors inline-flex items-center gap-1 group">
                Know more
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                onClick={onSwitchToSignUp}
                className="text-primary font-medium hover:text-primary/80 transition-colors"
              >
                Create a new account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
