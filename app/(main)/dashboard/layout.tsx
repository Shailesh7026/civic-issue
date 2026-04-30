import * as React from "react"
import { TopNavbar } from "@/components/navigation/top-navbar"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { AreaSelectionModal } from "@/components/area-selection-modal"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AreaSelectionModal />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <TopNavbar />
        <main className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}