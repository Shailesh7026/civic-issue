'use client'

import { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStore } from "@/store/useUserStore"
import {
  getCommunitiesList,
  toggleAreaMembership,
  Community,
} from "@/lib/api/community"
import {
  Search,
  Users,
  MapPin,
  Activity,
  CheckCircle2,
  TrendingUp,
  Star,
  Flame,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import communityImg from "@/public/images/community.jpg"
import { IconUsersGroup } from "@tabler/icons-react"

// ─── Cache key for invalidation ───────────────────────────────────────────────
const COMMUNITIES_CACHE_KEY = "civic_communities_cache"
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min

function readCache(sort: string, search: string, followingOnly: boolean) {
  try {
    const raw = sessionStorage.getItem(COMMUNITIES_CACHE_KEY)
    if (!raw) return null
    const { data, ts, key } = JSON.parse(raw)
    const cacheKey = `${sort}|${search}|${followingOnly}`
    if (key !== cacheKey) return null
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data as Community[]
  } catch { return null }
}

function writeCache(data: Community[], sort: string, search: string, followingOnly: boolean) {
  try {
    sessionStorage.setItem(COMMUNITIES_CACHE_KEY, JSON.stringify({
      data,
      ts: Date.now(),
      key: `${sort}|${search}|${followingOnly}`,
    }))
  } catch { }
}

export function invalidateCommunityCache() {
  try { sessionStorage.removeItem(COMMUNITIES_CACHE_KEY) } catch { }
}

// ─── Shimmer card ──────────────────────────────────────────────────────────────
function CommunityCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ─── Community card ────────────────────────────────────────────────────────────
function CommunityCard({
  community,
  onToggleFollow,
  loading,
}: {
  community: Community
  onToggleFollow: (c: Community) => void
  loading: boolean
}) {
  const initials = community.area_name.substring(0, 2).toUpperCase()

  return (
    <Link href={`/dashboard/community/${community.area_id}`}>
      <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200">
        {/* Banner */}
        <div className="h-24 w-full overflow-hidden relative bg-muted">
          {community.banner_url ? (
            <img
              src={community.banner_url}
              alt={community.area_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
              <span className="text-4xl opacity-20">📍</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          {/* Follow badge */}
          {community.is_following && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 gap-1 rounded-full">
                <BookmarkCheck className="w-3 h-3" /> Following
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Header row: logo + name */}
          <div className="flex items-start gap-3 -mt-9 relative z-10">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl border-2 border-card bg-card shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              {community.logo_url ? (
                <img src={community.logo_url} alt={community.area_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center font-black text-sm text-muted-foreground">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-7">
              <p className="font-bold text-sm leading-tight truncate">{community.area_name}</p>
              {community.parent_name && (
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {community.parent_name}
                </p>
              )}
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <Users className="w-3 h-3" />{community.members_count.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-3 h-3" />{community.active_issues} active
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Flame className="w-3 h-3" />{community.issues_this_week}/wk
            </span>
            {community.resolution_rate > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3" />{community.resolution_rate}%
              </span>
            )}
          </div>

          {/* Follow button */}
          <Button
            size="sm"
            variant={community.is_following ? "secondary" : "default"}
            className={cn(
              "w-full h-9 rounded-xl text-sm font-semibold gap-2 transition-all",
              community.is_following
                ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                : ""
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFollow(community);
            }}
            disabled={loading}
          >
            {community.is_following ? (
              <><BookmarkCheck className="w-4 h-4" /> Following</>
            ) : (
              <><Bookmark className="w-4 h-4" /> Follow</>
            )}
          </Button>
        </div>
      </div>
    </Link>
  )
}

// ─── Sort options ──────────────────────────────────────────────────────────────
type SortOption = 'active' | 'resolution'

const SORT_OPTIONS: { id: SortOption; label: string; icon: React.ElementType }[] = [
  { id: 'active', label: 'Most Active', icon: Flame },
  { id: 'resolution', label: 'Best Resolution', icon: CheckCircle2 },
]

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { profile, isHydrated, setMemberships, memberships } = useUserStore()

  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('active')
  const [followingOnly, setFollowingOnly] = useState(false)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Fetch communities
  const fetchCommunities = useCallback(async (useCache = true) => {
    if (!isHydrated) return
    setIsLoading(true)

    if (useCache) {
      const cached = readCache(sort, debouncedSearch, followingOnly)
      if (cached) {
        setCommunities(cached)
        setIsLoading(false)
        return
      }
    }

    const data = await getCommunitiesList({
      search: debouncedSearch,
      sort,
      followingOnly,
      limit: 50,
    })

    setCommunities(data)
    writeCache(data, sort, debouncedSearch, followingOnly)
    setIsLoading(false)
  }, [isHydrated, debouncedSearch, sort, followingOnly])

  useEffect(() => { fetchCommunities(true) }, [fetchCommunities])

  // Toggle follow / unfollow
  const handleToggleFollow = useCallback(async (community: Community) => {
    if (!profile?.id) { toast.error('You must be logged in'); return }
    setTogglingId(community.area_id)

    const res = await toggleAreaMembership(profile.id, community.area_id, community.is_following)
    if (!res.ok) {
      toast.error(res.error || 'Something went wrong')
      setTogglingId(null)
      return
    }

    setCommunities(prev =>
      prev.map(c =>
        c.area_id === community.area_id
          ? {
            ...c,
            is_following: !c.is_following,
            members_count: c.is_following ? c.members_count - 1 : c.members_count + 1,
          }
          : c
      )
    )

    // Invalidate cache so home feed sidebar re-fetches on next load
    invalidateCommunityCache()
    try { sessionStorage.removeItem('civic_home_followed_areas') } catch { }

    toast.success(community.is_following ? 'Unfollowed community' : 'Now following community!')
    setTogglingId(null)
  }, [profile?.id])

  const totalCommunities = communities.length
  const totalFollowing = communities.filter(c => c.is_following).length

  return (
    <div className="bg-background min-h-screen text-foreground pb-16">

      {/* ═══ Banner ═══════════════════════════════════════════════════════════ */}
      <div className="relative bg-card border-b border-border">
        <div className="h-32 sm:h-48 lg:h-56 w-full overflow-hidden relative bg-muted group/cover">
          <Image
            src={communityImg}
            alt="Community banner"
            className="w-full h-full object-cover group-hover/cover:scale-105  transition-transform duration-700"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end -mt-8 sm:-mt-12 pb-4 relative z-10">
            {/* Logo */}
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 p-1 bg-card border-2 border-border rounded-xl shadow-sm">
                <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                  <IconUsersGroup className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-tight">
                Community Hub
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Explore, follow and engage with civic communities in your area
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {isLoading ? '—' : totalCommunities} communities
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  {isLoading ? '—' : totalFollowing} followed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Filter bar ════════════════════════════════════════════════════════ */}
      <div className="sticky top-10 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">

          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search city, ward or area…"
              className="pl-9 h-10 rounded-xl bg-card border-border"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort pills */}
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSort(opt.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                  sort === opt.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}

            {/* Following filter toggle */}
            <button
              onClick={() => setFollowingOnly(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                followingOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Following
            </button>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <CommunityCardSkeleton key={i} />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {followingOnly ? 'No followed communities yet' : 'No communities found'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
              {followingOnly
                ? 'Follow a community from the all-communities list to see it here.'
                : debouncedSearch
                  ? 'Try a different search term.'
                  : 'Communities will appear here once areas are added.'}
            </p>
            {followingOnly && (
              <Button variant="outline" className="rounded-xl" onClick={() => setFollowingOnly(false)}>
                Browse All Communities
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map(community => (
              <CommunityCard
                key={community.area_id}
                community={community}
                onToggleFollow={handleToggleFollow}
                loading={togglingId === community.area_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
