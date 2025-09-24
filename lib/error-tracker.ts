import posthog from 'posthog-js'

export interface ErrorContext {
  source?: string
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  additionalData?: Record<string, unknown>
}

export interface ServerErrorContext extends ErrorContext {
  requestId?: string
  method?: string
  headers?: Record<string, string>
}

class ErrorTracker {
  static captureClientError(error: Error, context: ErrorContext = {}) {
    if (typeof window === 'undefined') {
      console.warn('captureClientError called on server-side')
      return
    }

    try {
      const errorData = {
        source: context.source || 'client-generic',
        url: context.url || window.location.href,
        user_agent: context.userAgent || navigator.userAgent,
        timestamp: new Date().toISOString(),
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        ...context.additionalData,
      }

      posthog.captureException(error, errorData)
      
      // Also capture as a custom event for analytics
      posthog.capture('error_occurred', {
        error_type: 'client_error',
        ...errorData,
      })
    } catch (captureError) {
      console.error('Failed to capture client error:', captureError)
    }
  }

  // Server-side error tracking
  static async captureServerError(error: Error, context: ServerErrorContext = {}) {
    if (typeof window !== 'undefined') {
      console.warn('captureServerError called on client-side')
      return
    }

    try {
      // Dynamic import to avoid bundling server code in client
      const { getPostHogServer } = await import('./posthog-server')
      const posthog = getPostHogServer()
      
      const errorData = {
        source: context.source || 'server-generic',
        url: context.url,
        method: context.method,
        request_id: context.requestId,
        timestamp: new Date().toISOString(),
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        runtime: process.env.NEXT_RUNTIME,
        ...context.additionalData,
      }

      await posthog.captureException(error, context.userId, errorData)

      // Also capture as a custom event for analytics
      await posthog.capture({
        distinctId: context.userId || 'anonymous',
        event: 'error_occurred',
        properties: {
          error_type: 'server_error',
          ...errorData,
        },
      })
    } catch (captureError) {
      console.error('Failed to capture server error:', captureError)
    }
  }

  // Universal error handler that works on both client and server
  static async captureError(error: Error, context: ErrorContext = {}) {
    if (typeof window === 'undefined') {
      // Server-side
      await this.captureServerError(error, context as ServerErrorContext)
    } else {
      // Client-side
      this.captureClientError(error, context)
    }
  }

  // Custom event tracking
  static captureEvent(eventName: string, properties: Record<string, unknown> = {}) {
    if (typeof window === 'undefined') {
      console.warn('captureEvent called on server-side, use captureServerEvent instead')
      return
    }

    try {
      posthog.capture(eventName, {
        timestamp: new Date().toISOString(),
        ...properties,
      })
    } catch (error) {
      console.error('Failed to capture event:', error)
    }
  }

  // Server-side event tracking
  static async captureServerEvent(
    eventName: string, 
    properties: Record<string, unknown> = {},
    distinctId?: string
  ) {
    if (typeof window !== 'undefined') {
      console.warn('captureServerEvent called on client-side, use captureEvent instead')
      return
    }

    try {
      // Dynamic import to avoid bundling server code in client
      const { getPostHogServer } = await import('./posthog-server')
      const posthog = getPostHogServer()
      
      await posthog.capture({
        distinctId: distinctId || 'anonymous',
        event: eventName,
        properties: {
          timestamp: new Date().toISOString(),
          source: 'server',
          ...properties,
        },
      })
    } catch (error) {
      console.error('Failed to capture server event:', error)
    }
  }

  // API error tracking specifically
  static captureApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    context: ErrorContext = {}
  ) {
    const apiContext = {
      ...context,
      source: context.source || 'api-error',
      additionalData: {
        endpoint,
        method,
        status_code: statusCode,
        ...context.additionalData,
      },
    }

    return this.captureError(error, apiContext)
  }

  // Database error tracking
  static captureDatabaseError(
    error: Error,
    query?: string,
    context: ErrorContext = {}
  ) {
    const dbContext = {
      ...context,
      source: context.source || 'database-error',
      additionalData: {
        query: query ? query.substring(0, 1000) : undefined, // Limit query length
        ...context.additionalData,
      },
    }

    return this.captureError(error, dbContext)
  }

  // Authentication error tracking
  static captureAuthError(
    error: Error,
    authMethod?: string,
    context: ErrorContext = {}
  ) {
    const authContext = {
      ...context,
      source: context.source || 'auth-error',
      additionalData: {
        auth_method: authMethod,
        ...context.additionalData,
      },
    }

    return this.captureError(error, authContext)
  }
}

export const captureError = ErrorTracker.captureError.bind(ErrorTracker)
export const captureClientError = ErrorTracker.captureClientError.bind(ErrorTracker)
export const captureServerError = ErrorTracker.captureServerError.bind(ErrorTracker)
export const captureEvent = ErrorTracker.captureEvent.bind(ErrorTracker)
export const captureServerEvent = ErrorTracker.captureServerEvent.bind(ErrorTracker)
export const captureApiError = ErrorTracker.captureApiError.bind(ErrorTracker)
export const captureDatabaseError = ErrorTracker.captureDatabaseError.bind(ErrorTracker)
export const captureAuthError = ErrorTracker.captureAuthError.bind(ErrorTracker)

export default ErrorTracker