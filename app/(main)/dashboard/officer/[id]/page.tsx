import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import OfficerProfileClient from "./officer-profile-client"

export default async function OfficerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch officer profile and role
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id, first_name, last_name, email, avatar_url,
      user_roles(role, area_id)
    `)
    .eq('id', id)
    .single()

  if (!profile) notFound()

  // Find their main role
  const roles = Array.isArray(profile.user_roles) ? profile.user_roles : [profile.user_roles]
  const officerRole = roles.find(r => r?.role === 'officer' || r?.role === 'admin')
  
  if (!officerRole) {
    // maybe they are not an officer anymore, still show something
  }

  // Get their assigned issues
  const { data: assignedIssues } = await supabase
    .from('issues')
    .select(`
      id, title, status, priority, created_at,
      areas(name)
    `)
    .eq('assigned_to', id)
    .order('created_at', { ascending: false })

  return <OfficerProfileClient officer={profile} issues={assignedIssues || []} />
}
