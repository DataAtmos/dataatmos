"use client"

import { captureClientError } from "@/lib/error-tracker-client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureClientError(error, {
      source: 'client-error-boundary',
      additionalData: {
        digest: error.digest,
        path: window.location.pathname,
        user_agent: navigator.userAgent,
      }
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred. We&apos;ve been notified and will work to fix this issue.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}