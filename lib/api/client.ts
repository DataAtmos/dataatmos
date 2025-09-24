import { API_CONFIG } from "./routes"
import type { ApiResponse } from "./response"
import { captureApiError, captureEvent } from "@/lib/error-tracker-client"

let redirectTo429: (() => void) | null = null

export function setRedirect429Handler(handler: () => void) {
  redirectTo429 = handler
}

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: HeadersInit

  constructor(baseUrl = "", defaultHeaders: HeadersInit = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...defaultHeaders,
    }
  }

  private async request<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || API_CONFIG.DEFAULT_TIMEOUT
    )

    const startTime = Date.now()
    const fullUrl = this.baseUrl + url
    const method = options.method || 'GET'

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data: ApiResponse<T> = await response.json()
      const duration = Date.now() - startTime

      if (!response.ok) {
        if (response.status === 429 && redirectTo429) {
          captureEvent('rate_limit_redirect', {
            url: fullUrl,
            method,
            duration_ms: duration,
          })
          redirectTo429()
        }

        const apiError = new ApiError(data.error?.message || "Request failed", {
          status: response.status,
          code: data.error?.code || "UNKNOWN_ERROR",
          details: data.error?.details,
        })

        // Track API errors
        captureApiError(apiError, url, method, response.status, {
          additionalData: {
            duration_ms: duration,
            retry_count: retryCount,
            error_code: data.error?.code,
            full_url: fullUrl,
          },
        })

        throw apiError
      }

      // Track successful API calls
      captureEvent('api_call_success', {
        url: fullUrl,
        method,
        status: response.status,
        duration_ms: duration,
        retry_count: retryCount,
      })

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (
        retryCount < API_CONFIG.RETRY_ATTEMPTS &&
        (error instanceof TypeError || (error as Error).name === "AbortError")
      ) {
        // Track retry attempts
        captureEvent('api_retry_attempt', {
          url: fullUrl,
          method,
          retry_count: retryCount,
          error_type: error instanceof TypeError ? 'TypeError' : 'AbortError',
        })

        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1)))
        return this.request<T>(url, options, retryCount + 1)
      }

      if (error instanceof ApiError) {
        throw error
      }

      const networkError = new ApiError("Network error occurred", {
        status: 0,
        code: "NETWORK_ERROR",
        details: error,
      })

      // Track network errors
      captureApiError(networkError, url, method, 0, {
        additionalData: {
          duration_ms: Date.now() - startTime,
          retry_count: retryCount,
          original_error: error instanceof Error ? error.message : String(error),
          full_url: fullUrl,
        },
      })

      throw networkError
    }
  }

  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "GET" })
  }

  async post<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: "DELETE" })
  }
}

export class ApiError extends Error {
  public status: number
  public code: string
  public details?: unknown

  constructor(
    message: string,
    options: {
      status: number
      code: string
      details?: unknown
    }
  ) {
    super(message)
    this.name = "ApiError"
    this.status = options.status
    this.code = options.code
    this.details = options.details
  }
}

export const apiClient = new ApiClient()

export class JWTApiClient extends ApiClient {
  private jwtToken: string | null = null

  constructor(baseUrl = "", defaultHeaders: HeadersInit = {}) {
    super(baseUrl, defaultHeaders)
  }

  setJWTToken(token: string | null) {
    this.jwtToken = token
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {}
    
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`
    }
    
    return headers
  }

  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeaders()
    return super.get<T>(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
    })
  }

  async post<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeaders()
    return super.post<T>(url, data, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
    })
  }

  async put<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeaders()
    return super.put<T>(url, data, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
    })
  }

  async patch<T>(url: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeaders()
    return super.patch<T>(url, data, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
    })
  }

  async delete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const authHeaders = await this.getAuthHeaders()
    return super.delete<T>(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
    })
  }
}

export const jwtApiClient = new JWTApiClient()

export interface RequestOptions extends RequestInit {
  timeout?: number
}

declare global {
  interface RequestInit {
    timeout?: number
  }
}
