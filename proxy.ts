import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { DASHBOARD_ROOT, parseDashboardPath, workspacePath } from "@/lib/auth/workspace"

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"])
const isAuthEntry = createRouteMatcher(["/auth"])

export default clerkMiddleware(
  async (auth, req) => {
    const { isAuthenticated, orgId, orgSlug } = await auth()
    const pathname = req.nextUrl.pathname

    if (isProtectedRoute(req) && !isAuthenticated) {
      const url = req.nextUrl.clone()
      url.pathname = "/auth"
      url.search = ""
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    if (isAuthEntry(req) && isAuthenticated) {
      const redirect = req.nextUrl.searchParams.get("redirect") || DASHBOARD_ROOT
      return NextResponse.redirect(new URL(redirect, req.url))
    }

    const parsed = parseDashboardPath(pathname)
    if (parsed.slug && orgId && orgSlug && parsed.slug === orgId && parsed.slug !== orgSlug) {
      return NextResponse.redirect(new URL(workspacePath(orgSlug, parsed.rest), req.url))
    }

    return NextResponse.next()
  },
  {
    organizationSyncOptions: {
      organizationPatterns: ["/dashboard/:slug", "/dashboard/:slug/(.*)"],
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
