'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAvailableAreas() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('areas').select('*').order('name', { ascending: true })
  
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function joinAreas(areaIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!areaIds || areaIds.length === 0) {
    return { success: false, error: 'No areas selected' }
  }

  const memberships = areaIds.map(area_id => ({
    user_id: user.id,
    area_id,
    role: 'member'
  }))

  const { error } = await supabase.from('area_memberships').insert(memberships)
  
  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
