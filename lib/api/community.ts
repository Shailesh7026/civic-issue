import { createClient } from '@/lib/supabase/client'

// Fetch top followed areas for the sidebar
export const getFollowedAreas = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('area_memberships')
    .select(`
      id,
      area_id,
      areas ( id, name, type ),
      role
    `)
    .eq('user_id', userId)
    .limit(5)
  
  if (error) {
    console.error('Error fetching followed areas:', error)
    return []
  }
  
  return data
}

// Fetch all followed area IDs for the current user (for home feed sidebar)
export const getFollowedAreaIds = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('area_memberships')
    .select('area_id, areas ( id, name, type )')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching followed area ids:', error)
    return []
  }
  return data
}

export const getAreasQuery = async (searchQuery: string = '') => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('areas')
    .select('id, name, type')
    .ilike('name', `%${searchQuery}%`)
    .limit(10)

  if (error) {
    console.error('Error fetching areas:', error)
    return []
  }
  return data
}

export interface IssuesFeedParams {
  areaId?: string | null
  search?: string
  orderBy?: 'new' | 'popular'
  limit?: number
  offset?: number
}

export const getIssuesFeed = async ({
  areaId = null,
  search = '',
  orderBy = 'new',
  limit = 10,
  offset = 0
}: IssuesFeedParams) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_area_issues_feed', {
      p_area_id: areaId,
      p_search: search,
      p_order_by: orderBy,
      p_limit: limit,
      p_offset: offset
    })

  if (error) {
    console.error('Error fetching issues feed:', error)
    return []
  }
  return data
}

export const getFollowedIssuesFeed = async ({
  search = '',
  orderBy = 'new',
  limit = 10,
  offset = 0
}: IssuesFeedParams) => {
  const supabase = createClient()
  let query = supabase
    .from('issues')
    .select(`
      id, title, description, status, priority, area_id, created_by, assigned_to,
      image_urls, created_at, updated_at, visibility, upvotes_count,
      author:profiles!created_by(first_name, last_name, avatar_url),
      area:areas!area_id(name, type)
    `)
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (orderBy === 'popular') {
    query = query.order('upvotes_count', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching followed issues feed:', error)
    return []
  }

  return data.map((i: any) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    status: i.status,
    priority: i.priority,
    area_id: i.area_id,
    created_by: i.created_by,
    assigned_to: i.assigned_to,
    image_urls: i.image_urls,
    created_at: i.created_at,
    updated_at: i.updated_at,
    visibility: i.visibility,
    upvotes_count: i.upvotes_count,
    comments_count: 0,
    author_first_name: i.author?.first_name,
    author_last_name: i.author?.last_name,
    author_avatar_url: i.author?.avatar_url,
    area_name: i.area?.name,
    area_type: i.area?.type,
  }))
}

export interface CommunitiesListParams {
  search?: string
  sort?: 'active' | 'resolution'
  followingOnly?: boolean
  limit?: number
  offset?: number
}

export interface Community {
  area_id: string
  area_name: string
  area_type: string
  parent_id: string | null
  parent_name: string | null
  members_count: number
  active_issues: number
  total_issues: number
  resolved_issues: number
  issues_this_week: number
  resolution_rate: number
  banner_url: string | null
  logo_url: string | null
  description: string | null
  is_following: boolean
}

export const getCommunitiesList = async ({
  search = '',
  sort = 'active',
  followingOnly = false,
  limit = 30,
  offset = 0
}: CommunitiesListParams): Promise<Community[]> => {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_communities_list', {
    p_search: search || null,
    p_sort: sort,
    p_following_only: followingOnly,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error('Error fetching communities:', error)
    return []
  }
  return data as Community[]
}

export const toggleAreaMembership = async (
  userId: string,
  areaId: string,
  currentlyFollowing: boolean
): Promise<{ ok: boolean; error?: string }> => {
  const supabase = createClient()

  if (currentlyFollowing) {
    const { error } = await supabase
      .from('area_memberships')
      .delete()
      .eq('user_id', userId)
      .eq('area_id', areaId)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('area_memberships')
      .insert({ user_id: userId, area_id: areaId, role: 'member' })
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}

export const upvoteIssue = async (issueId: string, currentUserId: string, value: 1 | -1) => {
  const supabase = createClient()
  const { error } = await supabase
    .from('issue_votes')
    .upsert({ user_id: currentUserId, issue_id: issueId, value })
  
  if (error) {
     console.error('Error upvoting issue:', error)
     throw error
  }
}

export const getIssueById = async (id: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      author:profiles!created_by(id, first_name, last_name, avatar_url),
      area:areas!area_id(id, name, type)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching issue:', error)
    return null
  }
  return data
}

export const getIssueComments = async (issueId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      user:profiles!user_id(id, first_name, last_name, avatar_url)
    `)
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }
  return data
}

