export function register() {
}

export const onRequestError = async (
  err: Error,
  request: {
    headers: { cookie?: string }
    url?: string
  },
  _context: unknown
) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { captureServerError } = await import('./lib/error-tracker-server')
      
      let distinctId = null
      
      if (request.headers.cookie) {
        const cookieString = request.headers.cookie
        const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/)

        if (postHogCookieMatch && postHogCookieMatch[1]) {
          try {
            const decodedCookie = decodeURIComponent(postHogCookieMatch[1])
            const postHogData = JSON.parse(decodedCookie)
            distinctId = postHogData.distinct_id
          } catch (e) {
            console.error('Error parsing PostHog cookie:', e)
          }
        }
      }

      await captureServerError(err, {
        source: 'server-request-error',
        userId: distinctId || undefined,
        url: request.url,
        additionalData: {
          runtime: process.env.NEXT_RUNTIME,
          timestamp: new Date().toISOString(),
        }
      })
    } catch (error) {
      console.error('Failed to capture exception in PostHog:', error)
    }
  }
}