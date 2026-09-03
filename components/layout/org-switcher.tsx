"use client"

import { useOrganization, useOrganizationList } from "@clerk/nextjs"
import { ChevronsUpDown, Loader2, Plus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/sonner"
import {
  parseDashboardPath,
  workspaceKey,
  workspacePath,
  workspaceSlugCandidate,
} from "@/lib/auth/workspace"

function orgInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function roleLabel(role: string | undefined) {
  if (!role) return "Workspace"
  return role.replace(/^org:/, "")
}

function clerkMessage(error: unknown) {
  if (error && typeof error === "object" && "errors" in error) {
    const first = (error as { errors?: { message?: string }[] }).errors?.[0]?.message
    if (first) return first
  }
  if (error instanceof Error) return error.message
  return "Could not update workspace"
}

export function OrgSwitcher() {
  const { isMobile } = useSidebar()
  const { organization, membership, isLoaded: orgLoaded } = useOrganization()
  const { isLoaded, setActive, userMemberships, createOrganization } = useOrganizationList({
    userMemberships: { infinite: true },
  })
  const router = useRouter()
  const pathname = usePathname()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, setPending] = useState(false)

  if (!isLoaded || !orgLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const memberships = userMemberships.data ?? []
  const activeName = organization?.name ?? "Select workspace"
  const activeImage = organization?.imageUrl
  const activeRole = roleLabel(membership?.role)

  function goToWorkspace(org: { id: string; slug?: string | null }) {
    const { rest } = parseDashboardPath(pathname)
    router.push(workspacePath(workspaceKey(org), rest))
  }

  async function switchOrg(org: { id: string; slug?: string | null }) {
    if (!setActive || org.id === organization?.id) return
    try {
      await setActive({ organization: org.id })
      goToWorkspace(org)
    } catch (error) {
      toast.error(clerkMessage(error))
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !createOrganization || !setActive) return

    setPending(true)
    try {
      let created: { id: string; slug: string | null } | undefined
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          created = await createOrganization({
            name: trimmed,
            slug: workspaceSlugCandidate(trimmed, attempt),
          })
          break
        } catch (error) {
          const message = error instanceof Error ? error.message : clerkMessage(error)
          if (attempt === 5) {
            created = await createOrganization({ name: trimmed })
            break
          }
          if (/slug/i.test(message)) continue
          throw error
        }
      }
      if (!created) throw new Error("Could not create workspace")
      await setActive({ organization: created.id })
      setName("")
      setCreateOpen(false)
      toast.success("Workspace created")
      goToWorkspace(created)
    } catch (error) {
      toast.error(clerkMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={activeImage} alt={activeName} />
                  <AvatarFallback className="rounded-lg">{orgInitials(activeName)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeName}</span>
                  <span className="truncate text-xs">{activeRole}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                {memberships.map((mem, index) => (
                  <DropdownMenuItem
                    key={mem.organization.id}
                    onClick={() => void switchOrg(mem.organization)}
                    className="gap-2 p-2"
                  >
                    <Avatar className="size-6 rounded-md">
                      <AvatarImage src={mem.organization.imageUrl} alt={mem.organization.name} />
                      <AvatarFallback className="rounded-md text-[10px]">
                        {orgInitials(mem.organization.name)}
                      </AvatarFallback>
                    </Avatar>
                    {mem.organization.name}
                    {index < 9 ? <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2 p-2" onClick={() => setCreateOpen(true)}>
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus />
                  </div>
                  <div className="font-medium text-muted-foreground">Create workspace</div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>Add a workspace you can switch into later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={event => void handleCreate(event)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="org-name">Name</FieldLabel>
                <Input
                  id="org-name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Enter your new workspace name"
                  autoFocus
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={pending || name.trim().length === 0}>
                {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
