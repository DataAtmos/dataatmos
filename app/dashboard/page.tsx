import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { workspacePath } from "@/lib/auth/workspace"

export default async function DashboardIndexPage() {
  const { orgId, orgSlug } = await auth()
  const key = orgSlug || orgId
  if (key) redirect(workspacePath(key))
  redirect("/onboarding/organization")
}
