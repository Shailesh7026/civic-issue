'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const setUserData = useUserStore((state) => state.setUserData)
  const setHydrated = useUserStore((state) => state.setHydrated)
  const clearUser = useUserStore((state) => state.clearUser)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch profile, memberships and primary role in parallel
        const [profileRes, membershipsRes, roleRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('area_memberships').select('*').eq('user_id', session.user.id),
          supabase.from('user_roles').select('role, area_id').eq('user_id', session.user.id)
            .order('role').limit(1).maybeSingle(),
        ])

        if (mounted) {
          setUserData(
            session.user,
            profileRes.data || null,
            membershipsRes.data || [],
            roleRes.data || null,
          )
          setHydrated()
        }
      } else {
        if (mounted) {
          clearUser()
        }
      }
    }

    initUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          initUser()
        } else if (event === 'SIGNED_OUT') {
           clearUser()
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUserData, clearUser, setHydrated])

  return <>{children}</>
}
