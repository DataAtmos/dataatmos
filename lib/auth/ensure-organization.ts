"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { workspaceKey, workspaceSlugCandidate } from "@/lib/auth/workspace"

function workspaceName(firstName: string | null, email: string | undefined) {
  if (firstName) return `${firstName}'s workspace`
  const local = email?.split("@")[0]
  if (local) return `${local} workspace`
  return "My workspace"
}

export async function ensureOrganization(): Promise<{
  orgId: string | null
  slug: string | null
  error?: string
}> {
  try {
    const { userId, orgId, orgSlug } = await auth()
    if (!userId) return { orgId: null, slug: null, error: "Not signed in" }
    if (orgId) return { orgId, slug: orgSlug || orgId }

    const clerk = await clerkClient()
    const memberships = await clerk.users.getOrganizationMembershipList({ userId, limit: 1 })
    const existing = memberships.data[0]?.organization
    if (existing) return { orgId: existing.id, slug: workspaceKey(existing) }

    const user = await clerk.users.getUser(userId)
    const name = workspaceName(user.firstName, user.primaryEmailAddress?.emailAddress)
    const org = await createWorkspaceOrg(clerk, name, userId)

    return { orgId: org.id, slug: workspaceKey(org) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create workspace"
    return { orgId: null, slug: null, error: message }
  }
}

async function createWorkspaceOrg(
  clerk: Awaited<ReturnType<typeof clerkClient>>,
  name: string,
  userId: string
) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await clerk.organizations.createOrganization({
        name,
        slug: workspaceSlugCandidate(name, attempt),
        createdBy: userId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (attempt < 5 && /slug/i.test(message)) continue
      if (attempt === 5) {
        return clerk.organizations.createOrganization({
          name,
          createdBy: userId,
        })
      }
      throw error
    }
  }

  return clerk.organizations.createOrganization({
    name,
    createdBy: userId,
  })
}
