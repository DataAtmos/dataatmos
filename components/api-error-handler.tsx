"use client"

import { setRedirect429Handler } from "@/lib/api/client"
import { captureEvent, captureClientError } from "@/lib/error-tracker-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ApiErrorHandler() {
  const router = useRouter()

  useEffect(() => {
    // Enhanced 429 handler with tracking
    setRedirect429Handler(() => {
      captureEvent('rate_limit_exceeded', {
        source: 'api-error-handler',
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
      })
      router.push("/429")
    })

    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureClientError(
        new Error(event.reason?.message || event.reason || 'Unhandled promise rejection'),
        {
          source: 'unhandled-promise-rejection',
          url: window.location.href,
          additionalData: {
            reason: event.reason,
            promise: event.promise?.toString(),
          },
        }
      )
    }

    // Global error handler for uncaught exceptions
    const handleError = (event: ErrorEvent) => {
      captureClientError(
        new Error(event.message),
        {
          source: 'uncaught-exception',
          url: window.location.href,
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        }
      )
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [router])

  return null
}