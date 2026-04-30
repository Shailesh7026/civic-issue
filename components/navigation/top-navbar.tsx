"use client"

import * as React from "react"
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Command,
  CreditCard,
  LogOut,
  Moon,
  Palette,
  Search,
  Sparkles,
  Sun,
  User,
  ShieldPlus,
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useUserStore } from "@/store/useUserStore"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command as CommandPalette,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NavCategories, useNavCategories } from "@/app/config/navigation"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function TopNavbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = React.useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { profile, user: authUser } = useUserStore()
  
  const user = {
    name: profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : "Guest",
    email: profile?.email || authUser?.email || "guest@civicissue.com",
    avatar: profile?.avatar_url || "",
  }

  const navCategories = useNavCategories()

  // Open search with ⌘K / Ctrl+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* ── Command palette dialog ───────────────────────────────────── */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        {/* CommandPalette wrapper provides the cmdk context that CommandInput needs */}
        <CommandPalette>
          <CommandInput placeholder="Search for a command to run..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Dashboard</CommandItem>
              <CommandItem>Reports</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
            
            
            <CommandSeparator />
             {navCategories.map((category) => (
                <CommandGroup key={category.label} heading={category.label}>
                    {category.items.map((item) => {
                      const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                      const Icon = item.icon

                      return (
                        <CommandItem
                          key={item.url}
                          onSelect={() => setSearchOpen(false)}
                        >
                          <Link
                            href={item.url}
                            onClick={() => setSearchOpen(false)}
                            className={cn(
                              "flex items-center gap-2 w-full",
                              isActive ? "text-primary" : "text-foreground"
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </CommandItem>
                      )
                    })}
                </CommandGroup>
              ))}
          </CommandList>
        </CommandPalette>
      </CommandDialog>

      {/* ── Top header ─────────────────────────────────────────────────── */}
      <header className="bg-sidebar sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear ">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2">

          {/* Sidebar toggle */}
          <SidebarTrigger />

          {/* Search area */}
          <div className="lg:flex-1">
            {/* Desktop – clickable search input that opens the dialog */}
            <div className="relative hidden max-w-sm flex-1 lg:block">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="border-input bg-transparent h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-left text-sm shadow-xs"
              >
                <span className="text-muted-foreground text-sm">Search...</span>
              </button>
              {/* ⌘K badge */}
              <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
                <Command className="size-3" aria-hidden="true" />
                <span>k</span>
              </div>
            </div>

            {/* Mobile – icon-only search button */}
            <div className="block lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* ── Right-side actions ─────────────────────────────────────── */}
          <div className="ml-auto flex items-center gap-2">

            {/* Notification bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-8">
                  <Bell aria-hidden="true" />
                  <span className="bg-destructive absolute end-0.5 top-0.5 block size-1.5 shrink-0 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-60">
                <DropdownMenuLabel className="p-0">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="text-muted-foreground text-xs">You have 3 unread messages.</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Bell className="mr-2 size-4" />
                    New issue reported nearby
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 size-4" />
                    Your report status updated
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 size-4" />
                    Officer responded to your issue
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle — switches between light and dark via next-themes */}
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {mounted ? (
                isDark ? (
                  <Sun aria-hidden="true" />
                ) : (
                  <Moon aria-hidden="true" />
                )
              ) : (
                <div className="size-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* ── User avatar dropdown ──────────────────────────────── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                </div>
              </div>
            </DropdownMenuLabel>
                
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                side="bottom"
                className="min-w-60 w-(--radix-dropdown-menu-trigger-width)"
              >
                {/* User info header */}
                <DropdownMenuLabel className="p-0">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt="User avatar" />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Upgrade to Pro */}
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User aria-hidden="true" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Account actions */}
                <DropdownMenuGroup>
                  <DropdownMenuItem >
                    <BadgeCheck aria-hidden="true" />
                    Report Issue
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/apply-officer">
                      <ShieldPlus aria-hidden="true" />
                      Apply as an officer
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={async () => {
                  const { signOut } = await import('@/app/actions/auth');
                  await signOut();
                }}>
                  <LogOut aria-hidden="true" />
                  Log out
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
            {/* ─────────────────────────────────────────────────────── */}

          </div>
        </div>
      </header>
    </>
  )
}
