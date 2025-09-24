import { getPostHogServer } from './posthog-server'

export interface ServerErrorContext {
  source?: string
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  requestId?: string
  method?: string
  headers?: Record<string, string>
  additionalData?: Record<string, unknown>
}

class ServerErrorTracker {
  static async captureServerError(error: Error, context: ServerErrorContext = {}) {
    if (typeof window !== 'undefined') {
      console.warn('captureServerError called on client-side')
      return
    }

    try {
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

  static async captureServerEvent(
    eventName: string, 
    properties: Record<string, unknown> = {},
    distinctId?: string
  ) {
    if (typeof window !== 'undefined') {
      console.warn('captureServerEvent called on client-side')
      return
    }

    try {
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

  static async captureApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    context: ServerErrorContext = {}
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

    return this.captureServerError(error, apiContext)
  }

  static async captureDatabaseError(
    error: Error,
    query?: string,
    context: ServerErrorContext = {}
  ) {
    const dbContext = {
      ...context,
      source: context.source || 'database-error',
      additionalData: {
        query: query ? query.substring(0, 1000) : undefined, // Limit query length
        ...context.additionalData,
      },
    }

    return this.captureServerError(error, dbContext)
  }

  static async captureAuthError(
    error: Error,
    authMethod?: string,
    context: ServerErrorContext = {}
  ) {
    const authContext = {
      ...context,
      source: context.source || 'auth-error',
      additionalData: {
        auth_method: authMethod,
        ...context.additionalData,
      },
    }

    return this.captureServerError(error, authContext)
  }

  static async captureMiddlewareError(
    error: Error,
    request: Request,
    context: ServerErrorContext = {}
  ) {
    const middlewareContext = {
      ...context,
      source: context.source || 'middleware',
      url: request.url,
      method: request.method,
      additionalData: {
        user_agent: request.headers.get('user-agent'),
        origin: request.headers.get('origin'),
        ...context.additionalData,
      },
    }

    return this.captureServerError(error, middlewareContext)
  }
}

export const captureServerError = ServerErrorTracker.captureServerError.bind(ServerErrorTracker)
export const captureServerEvent = ServerErrorTracker.captureServerEvent.bind(ServerErrorTracker)
export const captureApiError = ServerErrorTracker.captureApiError.bind(ServerErrorTracker)
export const captureDatabaseError = ServerErrorTracker.captureDatabaseError.bind(ServerErrorTracker)
export const captureAuthError = ServerErrorTracker.captureAuthError.bind(ServerErrorTracker)
export const captureMiddlewareError = ServerErrorTracker.captureMiddlewareError.bind(ServerErrorTracker)

export default ServerErrorTracker