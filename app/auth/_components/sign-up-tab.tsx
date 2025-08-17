"use client"

import { Button } from "@/components/ui/button"
import { EyeOffIcon } from "@/components/ui/icons/eye-off"
import { LoaderPinwheelIcon } from "@/components/ui/icons/loader-pinwheel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordStrength } from "@/components/ui/password-strength"
import { toast } from "@/components/ui/sonner"
import { signIn, signUp } from "@/lib/auth/auth-client"
import { captureAuthError, captureEvent } from "@/lib/error-tracker-client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignUpTab() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleEmailPasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      captureEvent('sign_up_validation_error', {
        error_type: 'password_mismatch',
        email_domain: email.split('@')[1] || 'unknown',
      })
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      captureEvent('sign_up_validation_error', {
        error_type: 'password_too_short',
        email_domain: email.split('@')[1] || 'unknown',
      })
      toast.error("Password must be at least 8 characters long")
      return
    }

    setLoading(true)

    captureEvent('sign_up_attempt', {
      method: 'email',
      email_domain: email.split('@')[1] || 'unknown',
      has_first_name: firstName.length > 0,
      has_last_name: lastName.length > 0,
    })

    try {
      const redirect = new URLSearchParams(window.location.search).get("redirect")

      const response = await signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        callbackURL: redirect || "/console",
      })

      if (response.error) {
        captureAuthError(new Error(response.error.message), 'email-signup', {
          additionalData: {
            email_domain: email.split('@')[1] || 'unknown',
            error_code: response.error.code,
          },
        })
        toast.error(response.error.message)
      } else {
        captureEvent('sign_up_success', {
          method: 'email',
          email_domain: email.split('@')[1] || 'unknown',
          redirect_to_verification: true,
        })
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
      }
    } catch (error) {
      captureAuthError(error instanceof Error ? error : new Error("Failed to create account"), 'email-signup', {
        additionalData: {
          email_domain: email.split('@')[1] || 'unknown',
        },
      })
      toast.error(error instanceof Error ? error.message : "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    
    captureEvent('sign_up_attempt', {
      method: 'google',
      provider: 'google',
    })

    try {
      const redirect = new URLSearchParams(window.location.search).get("redirect")
      
      captureEvent('social_sign_up_redirect', {
        provider: 'google',
        redirect_url: redirect || '/console',
      })

      await signIn.social({
        provider: "google",
        callbackURL: redirect || "/console",
      })
    } catch (error) {
      captureAuthError(error instanceof Error ? error : new Error("Failed to sign up with Google"), 'google-signup', {
        additionalData: {
          provider: 'google',
        },
      })
      toast.error(error instanceof Error ? error.message : "Failed to sign up with Google")
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border h-full flex flex-col">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold tracking-tight">Create Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your information to create your data atmosphere
        </p>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-5">
          <form onSubmit={handleEmailPasswordSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="Raghunandhan"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="VR"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={8}
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
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <EyeOffIcon size={12} />
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoaderPinwheelIcon size={12} />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
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

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              You&apos;ll receive an email verification link after signing up.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
