import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { captureMiddlewareError, captureServerEvent } from "@/lib/error-tracker-server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const startTime = Date.now()

  try {
    if (pathname.startsWith("/console")) {
      const sessionCookie = getSessionCookie(request)

      if (!sessionCookie) {
        await captureServerEvent('auth_redirect', {
          from_path: pathname,
          to_path: '/auth',
          reason: 'no_session_cookie',
          user_agent: request.headers.get('user-agent') || 'unknown',
          duration_ms: Date.now() - startTime,
        })

        const url = request.nextUrl.clone()
        url.pathname = "/auth"
        url.searchParams.set("redirect", pathname)
        return NextResponse.redirect(url)
      }

      await captureServerEvent('middleware_success', {
        path: pathname,
        action: 'console_access_allowed',
        has_session: true,
        duration_ms: Date.now() - startTime,
      })

      return NextResponse.next()
    }

    if (pathname === "/auth") {
      const sessionCookie = getSessionCookie(request)

      if (sessionCookie) {
        const redirect = request.nextUrl.searchParams.get("redirect")
        const redirectPath = redirect || "/console"

        await captureServerEvent('auth_redirect', {
          from_path: pathname,
          to_path: redirectPath,
          reason: 'already_authenticated',
          user_agent: request.headers.get('user-agent') || 'unknown',
          duration_ms: Date.now() - startTime,
        })

        const url = request.nextUrl.clone()
        url.pathname = redirectPath
        url.search = ""
        return NextResponse.redirect(url)
      }

      await captureServerEvent('middleware_success', {
        path: pathname,
        action: 'auth_page_access',
        has_session: false,
        duration_ms: Date.now() - startTime,
      })
    }

    return NextResponse.next()
  } catch (error) {
    await captureMiddlewareError(error instanceof Error ? error : new Error('Middleware error'), request, {
      additionalData: {
        duration_ms: Date.now() - startTime,
        path: pathname,
      },
    })
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)"],
}
