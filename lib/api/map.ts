import { createClient } from '@/lib/supabase/client'

export interface MapIssue {
  id: string
  title: string
  description: string
  status: string
  priority: string
  latitude: number
  longitude: number
  category: string
  image_url: string | null
  upvotes_count: number
  created_at: string
  area_name: string
}

export interface BoundingBox {
  south: number
  north: number
  west: number
  east: number
}

export const getMapIssues = async (bbox: BoundingBox): Promise<MapIssue[]> => {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_map_issues', {
    p_south: bbox.south,
    p_north: bbox.north,
    p_west: bbox.west,
    p_east: bbox.east,
  })

  if (error) {
    console.error('Error fetching map issues:', error)
    return []
  }

  return data as MapIssue[]
}
