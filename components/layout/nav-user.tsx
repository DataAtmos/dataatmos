"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import { ChevronsUpDown, Home, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/sonner"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"

function initials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  if (!isLoaded || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled>
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-2.5 w-16" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const name = user.fullName || user.firstName || "Account"
  const email = user.primaryEmailAddress?.emailAddress || ""

  async function handleSignOut() {
    try {
      await signOut({ redirectUrl: "/" })
      toast.success("Signed out successfully")
    } catch {
      toast.error("Error signing out")
      router.push("/")
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-1!"
            >
              <Avatar className="size-6 rounded-md">
                <AvatarImage src={user.imageUrl} alt={name} />
                <AvatarFallback className="rounded-md text-[10px]">{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium">{name}</span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-xs">
                  <Avatar className="size-6 rounded-md">
                    <AvatarImage src={user.imageUrl} alt={name} />
                    <AvatarFallback className="rounded-md text-[10px]">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/" prefetch>
                  <Home />
                  Homepage
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeSwitcher />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
