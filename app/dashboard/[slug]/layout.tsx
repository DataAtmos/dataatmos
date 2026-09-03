import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { isReservedDashboardSegment, workspaceMatches, workspacePath } from "@/lib/auth/workspace"

// instant = false: slug layout reads Clerk session + params.
export const instant = false

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { orgId, orgSlug } = await auth()
  const key = orgSlug || orgId

  if (isReservedDashboardSegment(slug) && key && !workspaceMatches(slug, orgSlug, orgId)) {
    redirect(workspacePath(key, `/${slug}`))
  }

  if (key && !workspaceMatches(slug, orgSlug, orgId)) {
    redirect(workspacePath(key))
  }

  return children
}
