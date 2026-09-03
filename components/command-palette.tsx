"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { workspacePath } from "@/lib/auth/workspace"
import { type NavigationPage, navigationPages } from "@/lib/configs/navigation"
import { aliases } from "@/lib/configs/navigation-aliases"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { isSignedIn, orgId, orgSlug } = useAuth()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const workspaceKeyValue = orgSlug || orgId

  const resolveHref = (page: NavigationPage) => {
    if (page.workspacePath !== undefined && workspaceKeyValue) {
      return workspacePath(workspaceKeyValue, page.workspacePath)
    }
    return page.href
  }

  const filteredPages = useMemo(() => {
    const isAuthenticated = !!isSignedIn
    return navigationPages.filter(page => !(page.requiresAuth && !isAuthenticated))
  }, [isSignedIn])

  const searchableItems = useMemo(() => {
    const items = [...filteredPages]

    aliases.forEach(alias => {
      const targetPage = navigationPages.find(page => page.href === alias.target)
      if (targetPage) {
        const isAuthenticated = !!isSignedIn
        if (targetPage.requiresAuth && !isAuthenticated) return

        items.push({
          ...targetPage,
          title: alias.alias,
          group: "Aliases",
        })
      }
    })

    return items
  }, [filteredPages, isSignedIn])

  const groupedPages = searchableItems.reduce(
    (groups, page) => {
      if (!groups[page.group]) {
        groups[page.group] = []
      }
      groups[page.group].push(page)
      return groups
    },
    {} as Record<string, NavigationPage[]>
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedPages).map(([groupName, groupPages]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {groupPages.map(page => {
              const IconComponent = page.icon
              return (
                <CommandItem
                  key={`${page.group}-${page.href}-${page.title}`}
                  value={page.title}
                  onSelect={() => runCommand(() => router.push(resolveHref(page)))}
                >
                  <IconComponent size={16} />
                  <span>{page.title}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
