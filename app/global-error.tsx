"use client"

import { captureClientError } from "@/lib/error-tracker-client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureClientError(error, {
      source: 'global-error-boundary',
      additionalData: {
        digest: error.digest,
        path: window.location.pathname,
        user_agent: navigator.userAgent,
      }
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Application Error</h2>
            <p className="text-gray-600 max-w-md">
              A critical error occurred in the application. We&apos;ve been notified and will work to fix this issue.
            </p>
            <Button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}