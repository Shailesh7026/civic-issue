'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/store/useUserStore"
import { createClient } from "@/lib/supabase/client"
import { getIssuesFeed, toggleAreaMembership } from "@/lib/api/community"
import { Post } from "@/components/community/post"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Loader2, Eye, Shield, AlertCircle, Search, Check, Globe, Share2,
  UserPlus, ArrowLeft, Settings, Trophy, Medal, Users
} from "lucide-react"

const TAB_CONFIG = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "issues", label: "Reported Issues", icon: AlertCircle },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
] as const

type TabId = typeof TAB_CONFIG[number]["id"] | "settings"

export default function CommunityDetailedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const { profile, isHydrated } = useUserStore()
  const supabase = createClient()

  const initialTab = (searchParams.get("tab") as TabId) || "overview"
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  const [community, setCommunity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState({ members: 0, activeIssues: 0, resolvedIssues: 0 })
  const [childAreas, setChildAreas] = useState<any[]>([])

  useEffect(() => {
    if (!isHydrated) return

    async function fetchCommunity() {
      setLoading(true)
      
      // Fetch community details
      const { data: areaData } = await supabase
        .from('areas')
        .select(`
          id, name, type, parent_id,
          area_meta ( description, banner_url, logo_url )
        `)
        .eq('id', id)
        .single()
      
      if (areaData) {
        setCommunity({
           ...areaData,
           description: areaData.area_meta?.[0]?.description || "",
           banner_url: areaData.area_meta?.[0]?.banner_url || "",
           logo_url: areaData.area_meta?.[0]?.logo_url || "",
        })
      }

      // Check following and role
      if (profile?.id) {
        const { data: memData } = await supabase
          .from('area_memberships')
          .select('role')
          .eq('user_id', profile.id)
          .eq('area_id', id)
          .maybeSingle()
        
        if (memData) {
          setIsFollowing(true)
          setUserRole(memData.role)
        } else {
          setIsFollowing(false)
          setUserRole(null)
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .eq('area_id', id)
          .maybeSingle()

        if (roleData && ['admin', 'moderator', 'super_admin'].includes(roleData.role)) {
          setUserRole(roleData.role) // Override with stronger role
        }
      }

      // Fetch stats mocks
      const { count: membersCount } = await supabase.from('area_memberships').select('*', { count: 'exact', head: true }).eq('area_id', id)
      const { count: activeCount } = await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('area_id', id).neq('status', 'resolved')
      const { count: resolvedCount } = await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('area_id', id).eq('status', 'resolved')
      
      setStats({
        members: membersCount || 0,
        activeIssues: activeCount || 0,
        resolvedIssues: resolvedCount || 0,
      })

      // Fetch child areas
      const { data: children } = await supabase.from('areas').select('id, name, type').eq('parent_id', id)
      setChildAreas(children || [])

      setLoading(false)
    }

    fetchCommunity()
  }, [id, isHydrated, profile?.id])

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", tabId)
    window.history.replaceState({}, "", url.toString())
  }

  const toggleFollow = async () => {
    if (!profile?.id) {
      toast.error("Please login to follow")
      return
    }
    const res = await toggleAreaMembership(profile.id, id, isFollowing)
    if (res.ok) {
      setIsFollowing(!isFollowing)
      setStats(s => ({ ...s, members: isFollowing ? s.members - 1 : s.members + 1 }))
      toast.success(isFollowing ? "Unfollowed" : "Followed")
    } else {
      toast.error(res.error)
    }
  }

  const canEdit = userRole === 'admin' || userRole === 'moderator' || userRole === 'super_admin' || userRole === 'officer'

  const availableTabs: {id: TabId, label: string, icon: any}[] = [...TAB_CONFIG]
  if (canEdit) {
    availableTabs.push({ id: "settings", label: "Settings", icon: Settings })
  }

  if (loading || !isHydrated) {
    return <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!community) {
    return <div className="text-center py-24">Community not found.</div>
  }

  const initials = community.name.substring(0, 2).toUpperCase()

  return (
    <div className="bg-background flex flex-col min-h-screen text-foreground pb-24">
      {/* Banner */}
      <div className="relative bg-card border-b border-border shrink-0">
        <div className="h-32 sm:h-52 lg:h-64 w-full overflow-hidden relative bg-muted group/cover">
          {community.banner_url ? (
             <img src={community.banner_url} alt="banner" className="w-full h-full object-cover transition-transform duration-700 group-hover/cover:scale-105" />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
               <span className="text-6xl opacity-20">📍</span>
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-4">
            <Button variant="ghost" size="sm" className="h-9 px-3 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 hover:text-white gap-2" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline text-xs">Back</span>
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end -mt-8 sm:-mt-14 pb-4 sm:pb-5 relative z-10">
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-24 sm:h-24 p-1 bg-card border-2 border-border rounded-lg overflow-hidden shadow-md">
                {community.logo_url ? (
                  <img src={community.logo_url} alt="logo" className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center rounded-md text-2xl font-black text-muted-foreground">{initials}</div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 pb-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="text-[10px] font-mono uppercase">{community.type}</Badge>
                <Badge variant="outline" className="text-[10px] gap-1"><Globe className="w-3 h-3" />Public</Badge>
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-tight">
                {community.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {stats.activeIssues} Active issues</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {stats.members} Members</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast.success("Link copied")
              }}>
                <Share2 className="w-4 h-4" />
              </Button>
              {canEdit && (
                <Button variant="default" className="h-9 gap-2 flex-1 sm:flex-none" onClick={() => handleTabChange("settings")}>
                  <Shield className="w-4 h-4" /> Manage
                </Button>
              )}
              <Button variant={isFollowing ? "secondary" : "default"} className="h-9 gap-2 flex-1 sm:flex-none" onClick={toggleFollow}>
                {isFollowing ? <><Check className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="sticky top-10 z-30 bg-card border-b border-border shrink-0">
        <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0 overflow-x-auto scrollbar-hide -mb-px">
            {availableTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as TabId)}
                className={cn(
                  "relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap border-b-2 select-none",
                  activeTab === id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && <OverviewTab community={community} stats={stats} childAreas={childAreas} />}
        {activeTab === "issues" && <IssuesTab areaId={community.id} />}
        {activeTab === "leaderboard" && <LeaderboardTab areaId={community.id} />}
        {activeTab === "settings" && canEdit && <SettingsTab community={community} setCommunity={setCommunity} />}
      </div>
    </div>
  )
}

function OverviewTab({ community, stats, childAreas }: { community: any, stats: any, childAreas: any[] }) {
  const supabase = createClient()
  const [recentIssues, setRecentIssues] = useState<any[]>([])

  useEffect(() => {
    async function loadRecent() {
      const data = await getIssuesFeed({ areaId: community.id, limit: 3 })
      setRecentIssues(data || [])
    }
    loadRecent()
  }, [community.id])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">About {community.name}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {community.description || "No description provided for this area."}
            </p>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Recent Activity</h3>
          </div>
          {recentIssues.length === 0 ? (
            <div className="p-8 text-center border rounded-xl bg-card/50 text-muted-foreground text-sm">No recent issues reported here yet.</div>
          ) : (
            recentIssues.map(issue => <Post key={issue.id} issue={issue} />)
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Key Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
              <span className="text-sm text-muted-foreground font-medium">Total Members</span>
              <span className="font-bold text-lg">{stats.members}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
              <span className="text-sm text-muted-foreground font-medium">Active Issues</span>
              <span className="font-bold text-lg">{stats.activeIssues}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
              <span className="text-sm text-muted-foreground font-medium">Resolved Issues</span>
              <span className="font-bold text-lg text-green-500">{stats.resolvedIssues}</span>
            </div>
          </CardContent>
        </Card>

        {childAreas.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Sub-Areas</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {childAreas.map(child => (
                  <Badge key={child.id} variant="secondary" className="px-3 py-1.5 cursor-pointer hover:bg-secondary/80 text-sm font-medium transition-colors" asChild>
                    <Link href={`/dashboard/community/${child.id}`}>{child.name}</Link>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function IssuesTab({ areaId }: { areaId: string }) {
  const [issues, setIssues] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [orderBy, setOrderBy] = useState<"new" | "popular">("new")
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const offsetRef = useRef(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchIssues = useCallback(async (isLoadMore = false) => {
    const currentOffset = isLoadMore ? offsetRef.current : 0
    if (isLoadMore) setLoadingMore(true)
    else { setLoading(true); setHasMore(true) }

    const data = await getIssuesFeed({ areaId, search: debouncedSearch, orderBy, limit: 10, offset: currentOffset })
    
    if (data.length < 10) setHasMore(false)
    if (isLoadMore) {
      setIssues(prev => [...prev, ...data])
      offsetRef.current = currentOffset + data.length
    } else {
      setIssues(data)
      offsetRef.current = data.length
    }
    setLoading(false)
    setLoadingMore(false)
  }, [areaId, debouncedSearch, orderBy])

  useEffect(() => { fetchIssues(false) }, [fetchIssues])

  useEffect(() => {
    const el = observerTarget.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
        fetchIssues(true)
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.unobserve(el)
  }, [hasMore, loading, loadingMore, fetchIssues])

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search issues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card border-border shadow-sm rounded-xl" />
        </div>
        <Select value={orderBy} onValueChange={(v: any) => setOrderBy(v)}>
          <SelectTrigger className="w-36 bg-card border-border shadow-sm rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 pt-2">
        {loading ? (
           <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
        ) : issues.length === 0 ? (
           <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">No issues found.</div>
        ) : (
          issues.map(issue => <Post key={issue.id} issue={issue} />)
        )}
        <div ref={observerTarget} className="py-4 flex justify-center">
          {loadingMore && <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />}
        </div>
      </div>
    </div>
  )
}

function LeaderboardTab({ areaId }: { areaId: string }) {
  const [officers, setOfficers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true)
      const supabase = createClient()
      
      const { data } = await supabase
        .from('user_roles')
        .select(`
          user_id, role,
          profiles ( first_name, last_name, avatar_url )
        `)
        .eq('area_id', areaId)
        .in('role', ['officer', 'admin', 'moderator'])

      const parsed = (data || []).map((d: any) => ({
        id: d.user_id,
        name: `${d.profiles?.first_name || 'Unknown'} ${d.profiles?.last_name || ''}`,
        avatar: d.profiles?.avatar_url,
        score: Math.floor(Math.random() * 50) + 5, // Mock score for ranking
        role: d.role
      })).sort((a, b) => b.score - a.score)

      setOfficers(parsed)
      setLoading(false)
    }
    loadLeaderboard()
  }, [areaId])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>

  if (officers.length === 0) {
    return <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">No officers found for this area.</div>
  }

  return (
    <div className="max-w-2xl mx-auto bg-card rounded-2xl border p-4 sm:p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Top Officers</h2>
      <div className="space-y-3">
        {officers.map((off, idx) => {
          const rank = idx + 1
          let medalColor = "bg-muted text-muted-foreground"
          let borderClass = "border-transparent"
          if (rank === 1) { medalColor = "bg-yellow-500 text-white"; borderClass = "border-yellow-500 bg-yellow-500/5 shadow-md scale-[1.02]" }
          else if (rank === 2) { medalColor = "bg-slate-300 text-slate-800"; borderClass = "border-slate-300 bg-slate-300/5 shadow-sm scale-[1.01]" }
          else if (rank === 3) { medalColor = "bg-amber-700 text-white"; borderClass = "border-amber-700 bg-amber-700/5 shadow-sm scale-[1.01]" }

          return (
            <div key={off.id} className={cn("flex items-center gap-4 p-3 rounded-xl border transition-all hover:scale-[1.01]", borderClass, rank > 3 && "hover:bg-muted/50 border-border")}>
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm", medalColor)}>
                {rank <= 3 ? <Medal className="w-5 h-5" /> : `#${rank}`}
              </div>
              <Avatar className="w-12 h-12 border shadow-sm">
                <AvatarImage src={off.avatar} />
                <AvatarFallback>{off.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{off.name}</p>
                <p className="text-xs text-muted-foreground capitalize font-medium">{off.role}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-xl text-primary">{off.score}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Resolved</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SettingsTab({ community, setCommunity }: { community: any, setCommunity: any }) {
  const [formData, setFormData] = useState({
    name: community.name || "",
    description: community.description || "",
    banner_url: community.banner_url || "",
    logo_url: community.logo_url || ""
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const [newArea, setNewArea] = useState({ name: "", type: "ward" })
  const [addingArea, setAddingArea] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('areas').update({ name: formData.name }).eq('id', community.id)
    
    const { data: existingMeta } = await supabase.from('area_meta').select('area_id').eq('area_id', community.id).maybeSingle()
    if (existingMeta) {
      await supabase.from('area_meta').update({ description: formData.description, banner_url: formData.banner_url, logo_url: formData.logo_url }).eq('area_id', community.id)
    } else {
      await supabase.from('area_meta').insert({ area_id: community.id, description: formData.description, banner_url: formData.banner_url, logo_url: formData.logo_url })
    }

    setCommunity({ ...community, ...formData })
    toast.success("Community settings saved!")
    setSaving(false)
  }

  const handleAddArea = async () => {
    if (!newArea.name) {
      toast.error("Area name is required")
      return
    }
    setAddingArea(true)
    const { error } = await supabase.from('areas').insert({
      name: newArea.name,
      type: newArea.type,
      parent_id: community.id
    })
    
    if (error) {
      toast.error("Failed to add area: " + error.message)
    } else {
      toast.success("Area added successfully")
      setNewArea({ name: "", type: "ward" })
      // Ideally trigger a refresh here, but for now just clear form
    }
    setAddingArea(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Community Name</Label>
            <Input className="bg-background rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea className="bg-background rounded-xl resize-y" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Media Links</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input className="bg-background rounded-xl" value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Banner URL</Label>
            <Input className="bg-background rounded-xl" value={formData.banner_url} onChange={e => setFormData({ ...formData, banner_url: e.target.value })} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl text-base font-bold shadow-md">
        {saving && <Loader2 className="w-5 h-5 mr-2 animate-spin" />} Save Settings
      </Button>

      <div className="pt-6 border-t">
        <Card className="shadow-sm border-primary/20">
          <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Globe className="w-5 h-5" /> Add Sub-Area</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Area Name</Label>
                <Input placeholder="e.g. Ward No. 5" className="bg-background rounded-xl" value={newArea.name} onChange={e => setNewArea({ ...newArea, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Area Type</Label>
                <Select value={newArea.type} onValueChange={(v) => setNewArea({ ...newArea, type: v })}>
                  <SelectTrigger className="bg-background rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="zone">Zone</SelectItem>
                    <SelectItem value="ward">Ward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddArea} disabled={addingArea} variant="secondary" className="w-full h-10 rounded-xl font-bold">
              {addingArea && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Add Area
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
