import { create } from 'zustand'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
}

export interface AreaMembership {
  id: string
  area_id: string
  role: string
}

export interface UserRole {
  role: string
  area_id: string | null
}

interface UserState {
  user: any | null
  profile: Profile | null
  memberships: AreaMembership[]
  userRole: UserRole | null          // primary role (officer / admin etc.)
  isHydrated: boolean
  setUserData: (user: any, profile: Profile | null, memberships: AreaMembership[], userRole?: UserRole | null) => void
  setMemberships: (memberships: AreaMembership[]) => void
  clearUser: () => void
  setHydrated: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  memberships: [],
  userRole: null,
  isHydrated: false,
  setUserData: (user, profile, memberships, userRole = null) =>
    set({ user, profile, memberships, userRole }),
  setMemberships: (memberships) => set({ memberships }),
  clearUser: () => set({ user: null, profile: null, memberships: [], userRole: null, isHydrated: true }),
  setHydrated: () => set({ isHydrated: true }),
}))
