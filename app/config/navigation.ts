import {
  IconClipboardText,
  IconHome,
  IconMap2,
  IconUsers,
  IconShieldBolt,
  type Icon,
} from "@tabler/icons-react"

export type NavItem = {
  title: string
  url: string
  icon: Icon
  badge?: string
  roles?: string[]   // if set, only show for these roles
}

export type NavCategories = {
  label: string
  items: NavItem[]
}

// ─── Primary items: all authenticated users ───────────────────────────────────
export const navMain: NavItem[] = [
  { title: "Home", url: "/dashboard/home", icon: IconHome },
  { title: "Report Issue", url: "/dashboard/report-issue", icon: IconClipboardText },
  { title: "Community", url: "/dashboard/community", icon: IconUsers },
  { title: "Map", url: "/dashboard/map", icon: IconMap2 },
]

// ─── Officer-only items ───────────────────────────────────────────────────────
export const navOfficer: NavItem[] = [
  {
    title: "Officer Dashboard",
    url: "/dashboard/officer",
    icon: IconShieldBolt,
    roles: ["officer", "admin", "super_admin"],
  },
]

import { useUserStore } from "@/store/useUserStore"

// ─── Bottom nav: first 4 items from navMain ───────────────────────────────────
export const bottomPrimaryItems = navMain.slice(0, 4)

// ─── More drawer / command palette categories ─────────────────────────────────
export const useNavCategories = (): NavCategories[] => {
  const { userRole } = useUserStore()
  const role = userRole?.role
  const categories: NavCategories[] = [
    {
      label: "Main Menu",
      items: navMain,
    },
    {
      label: "Officer",
      items: navOfficer,
    },
    {
      label: "Admin",
      items: [
        {
          title: "Manage Officials",
          url: "/dashboard/admin/officers",
          icon: IconShieldBolt,
          roles: ["admin", "super_admin"],
        }
      ]
    }
  ]
  
  return categories
    .map(category => ({
      ...category,
      items: category.items.filter(item => !item.roles || (role && item.roles.includes(role)))
    }))
    .filter(category => category.items.length > 0)
}
