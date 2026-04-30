"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconInnerShadowTop,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react"
import { signOut } from "@/app/actions/auth"
import { Logo } from "@/components/ui/logo"
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  useNavCategories,
} from "@/app/config/navigation"
import { NavMain } from "../ui/nav-main"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navCategories = useNavCategories()

  return (
    <Sidebar collapsible="offcanvas" {...props} className="pr-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <Logo size={28} className="[&_span]:text-lg" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

        <NavMain navCategories={navCategories} />
       
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-1 py-1">
              {/* Profile icon — links to profile page */}
              <SidebarMenuButton asChild tooltip="Profile" className="flex-1">
                <Link href="/dashboard/profile" className="flex items-center gap-2">
                  <IconUserCircle className="size-5 shrink-0" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>

              {/* Red logout button */}
              <button
                onClick={async () => await signOut()}
                title="Log out"
                className="flex items-center justify-center size-8 rounded-lg text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              >
                <IconLogout className="size-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
