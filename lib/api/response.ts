import { NextResponse } from "next/server"
import { captureServerError, captureServerEvent } from "@/lib/error-tracker-server"

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    timestamp: string
    requestId?: string
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const

export function createSuccessResponse<T>(
  data: T,
  options?: {
    status?: number
    meta?: ApiResponse<T>["meta"]
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  }

  return NextResponse.json(response, {
    status: options?.status || 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export function createErrorResponse(
  code: string,
  message: string,
  options?: {
    status?: number
    details?: unknown
    requestId?: string
    trackError?: boolean
    context?: Record<string, unknown>
  }
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details: options?.details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
    },
  }

  const statusCode = options?.status || getStatusCodeFromErrorCode(code)

  if (options?.trackError !== false) {
    captureServerError(new Error(message), {
      source: 'api-error-response',
      additionalData: {
        error_code: code,
        status_code: statusCode,
        request_id: options?.requestId,
        ...options?.context,
      },
    }).catch(error => {
      console.error('Failed to track error in PostHog:', error)
    })
  }

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string }>,
  options?: { requestId?: string }
): NextResponse<ApiResponse> {
  return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, "Validation failed", {
    status: 422,
    details: { errors },
    requestId: options?.requestId,
  })
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  options?: { requestId?: string }
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return createSuccessResponse(data, {
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
      pagination: {
        ...pagination,
        totalPages,
      },
    },
  })
}

function getStatusCodeFromErrorCode(code: string): number {
  switch (code) {
    case ERROR_CODES.UNAUTHORIZED:
    case ERROR_CODES.TOKEN_EXPIRED:
      return 401
    case ERROR_CODES.FORBIDDEN:
      return 403
    case ERROR_CODES.NOT_FOUND:
      return 404
    case ERROR_CODES.ALREADY_EXISTS:
      return 409
    case ERROR_CODES.VALIDATION_ERROR:
    case ERROR_CODES.INVALID_INPUT:
      return 422
    case ERROR_CODES.RATE_LIMIT_EXCEEDED:
      return 429
    case ERROR_CODES.DATABASE_ERROR:
    case ERROR_CODES.EXTERNAL_SERVICE_ERROR:
    case ERROR_CODES.INTERNAL_ERROR:
    default:
      return 500
  }
}

export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<ApiResponse<R>>>,
  options?: {
    source?: string
    trackErrors?: boolean
  }
) {
  return async (...args: T): Promise<NextResponse<ApiResponse<R>>> => {
    const startTime = Date.now()
    
    try {
      const result = await handler(...args)
      
      // Track successful API calls
      if (options?.trackErrors !== false) {
        captureServerEvent('api_call_success', {
          source: options?.source || 'api-handler',
          duration_ms: Date.now() - startTime,
          endpoint: 'unknown', // Could be enhanced to get actual endpoint
        }).catch(console.error)
      }
      
      return result
    } catch (error) {
      console.error("API Error:", error)

      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      const errorStack = error instanceof Error ? error.stack : undefined

      // Track the error with context
      if (options?.trackErrors !== false) {
        captureServerError(error instanceof Error ? error : new Error(errorMessage), {
          source: options?.source || 'api-handler',
          additionalData: {
            duration_ms: Date.now() - startTime,
            endpoint: 'unknown', // Could be enhanced to get actual endpoint
            error_type: error?.constructor?.name || 'unknown',
          },
        }).catch(console.error)
      }

      if (error instanceof Error) {
        return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, errorMessage, {
          details: process.env.NODE_ENV === "development" ? errorStack : undefined,
          trackError: false, // Already tracked above
        }) as NextResponse<ApiResponse<R>>
      }

      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        "An unexpected error occurred",
        { trackError: false } // Already tracked above
      ) as NextResponse<ApiResponse<R>>
    }
  }
}
