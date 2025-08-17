import posthog from "posthog-js"

export interface ErrorContext {
  source?: string
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  additionalData?: Record<string, unknown>
}

class ClientErrorTracker {
  static captureClientError(error: Error, context: ErrorContext = {}) {
    if (typeof window === "undefined") {
      console.warn("captureClientError called on server-side")
      return
    }

    try {
      const errorData = {
        source: context.source || "client-generic",
        url: context.url || window.location.href,
        user_agent: context.userAgent || navigator.userAgent,
        timestamp: new Date().toISOString(),
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        ...context.additionalData,
      }

      posthog.captureException(error, errorData)

      posthog.capture("error_occurred", {
        error_type: "client_error",
        ...errorData,
      })
    } catch (captureError) {
      console.error("Failed to capture client error:", captureError)
    }
  }

  static captureEvent(eventName: string, properties: Record<string, unknown> = {}) {
    if (typeof window === "undefined") {
      console.warn("captureEvent called on server-side")
      return
    }

    try {
      posthog.capture(eventName, {
        timestamp: new Date().toISOString(),
        ...properties,
      })
    } catch (error) {
      console.error("Failed to capture event:", error)
    }
  }

  static captureApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    context: ErrorContext = {}
  ) {
    const apiContext = {
      ...context,
      source: context.source || "api-error",
      additionalData: {
        endpoint,
        method,
        status_code: statusCode,
        ...context.additionalData,
      },
    }

    return this.captureClientError(error, apiContext)
  }

  static captureAuthError(error: Error, authMethod?: string, context: ErrorContext = {}) {
    const authContext = {
      ...context,
      source: context.source || "auth-error",
      additionalData: {
        auth_method: authMethod,
        ...context.additionalData,
      },
    }

    return this.captureClientError(error, authContext)
  }

  static captureFormError(error: Error, formName: string, context: ErrorContext = {}) {
    const formContext = {
      ...context,
      source: context.source || "form-error",
      additionalData: {
        form_name: formName,
        ...context.additionalData,
      },
    }

    return this.captureClientError(error, formContext)
  }

  static captureComponentError(error: Error, componentName: string, context: ErrorContext = {}) {
    const componentContext = {
      ...context,
      source: context.source || "react-component",
      additionalData: {
        component: componentName,
        react_version: "18.x",
        ...context.additionalData,
      },
    }

    return this.captureClientError(error, componentContext)
  }
}

export const captureClientError = ClientErrorTracker.captureClientError.bind(ClientErrorTracker)
export const captureEvent = ClientErrorTracker.captureEvent.bind(ClientErrorTracker)
export const captureApiError = ClientErrorTracker.captureApiError.bind(ClientErrorTracker)
export const captureAuthError = ClientErrorTracker.captureAuthError.bind(ClientErrorTracker)
export const captureFormError = ClientErrorTracker.captureFormError.bind(ClientErrorTracker)
export const captureComponentError =
  ClientErrorTracker.captureComponentError.bind(ClientErrorTracker)

export default ClientErrorTracker
