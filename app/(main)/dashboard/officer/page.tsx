'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, AlertCircle, Clock, CheckCircle2,
  Loader2, User, MapPin, Calendar, Zap,
  ChevronDown, Filter, RefreshCw, ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

// ── types ──────────────────────────────────────────────────────────────────────
interface OfficerIssue {
  id: string
  title: string
  description: string
  status: string
  priority: string
  area_id: string
  area_name: string
  area_type: string
  created_by: string
  assigned_to: string | null
  image_urls: string[] | null
  created_at: string
  updated_at: string
  upvotes_count: number
  comments_count: number
  author_first_name: string | null
  author_last_name: string | null
  author_avatar_url: string | null
  author_email: string | null
}

// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open:        { label: 'Open',        color: 'bg-red-500/10 text-red-600 border-red-500/20',       icon: AlertCircle  },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock       },
  resolved:    { label: 'Resolved',    color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:      { label: 'Low',      color: 'bg-blue-500/10 text-blue-600'    },
  medium:   { label: 'Medium',   color: 'bg-yellow-500/10 text-yellow-600' },
  high:     { label: 'High',     color: 'bg-orange-500/10 text-orange-600' },
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-600'      },
}

// ── Issue card (officer-centric view) ─────────────────────────────────────────
function OfficerIssueCard({
  issue,
  onStatusChange,
  updating,
}: {
  issue: OfficerIssue
  onStatusChange: (id: string, status: string) => void
  updating: boolean
}) {
  const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open
  const priorityCfg = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium
  const StatusIcon = statusCfg.icon

  const authorName = [issue.author_first_name, issue.author_last_name].filter(Boolean).join(' ') || issue.author_email || 'Unknown'

  return (
    <div className={cn(
      "bg-card border rounded-2xl p-4 space-y-3 transition-all hover:shadow-sm",
      issue.priority === 'critical' ? "border-red-500/30" : "border-border"
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={cn("text-[11px] px-2 py-0.5 border rounded-full font-semibold", statusCfg.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusCfg.label}
            </Badge>
            <Badge className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold border-0", priorityCfg.color)}>
              {priorityCfg.label}
            </Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {issue.area_name} ({issue.area_type})
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{issue.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{issue.description}</p>
        </div>
      </div>

      {/* Media thumbnails */}
      {issue.image_urls && issue.image_urls.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {issue.image_urls.slice(0, 4).map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
            </a>
          ))}
          {issue.image_urls.length > 4 && (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground font-semibold shrink-0">
              +{issue.image_urls.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><User className="w-3 h-3" />{authorName}</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
        </span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{issue.upvotes_count} upvotes</span>
        <span>{issue.comments_count} comments</span>
      </div>

      {/* Officer actions */}
      {issue.status !== 'resolved' && (
        <div className="flex gap-2 pt-1">
          {issue.status === 'open' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs rounded-xl flex-1 border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10"
              onClick={() => onStatusChange(issue.id, 'in_progress')}
              disabled={updating}
            >
              {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : '→ Mark In Progress'}
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 text-xs rounded-xl flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
            onClick={() => onStatusChange(issue.id, 'resolved')}
            disabled={updating}
          >
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3 mr-1" />Mark Resolved</>}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function IssueSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-2/3 rounded" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OfficerDashboardPage() {
  const router = useRouter()
  const { user, isHydrated } = useUserStore()
  const supabase = createClient()

  const [issues, setIssues] = useState<OfficerIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [officerArea, setOfficerArea] = useState<{ name: string; type: string } | null>(null)
  const [isOfficer, setIsOfficer] = useState<boolean | null>(null)

  // filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // verify officer role
  useEffect(() => {
    if (!isHydrated) return
    if (!user) { router.replace('/auth/login'); return }

    supabase
      .from('user_roles')
      .select('role, area_id, areas!area_id(name, type)')
      .eq('user_id', user.id)
      .in('role', ['officer', 'admin', 'super_admin'])
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setIsOfficer(false)
        } else {
          setIsOfficer(true)
          const area = (data as any).areas
          if (area) setOfficerArea({ name: area.name, type: area.type })
        }
      })
  }, [isHydrated, user])

  // fetch issues
  const fetchIssues = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_officer_issues_feed', {
      p_status: statusFilter === 'all' ? null : statusFilter,
      p_priority: priorityFilter === 'all' ? null : priorityFilter,
      p_search: search || null,
      p_limit: 50,
      p_offset: 0,
    })
    if (error) {
      toast.error('Failed to fetch issues')
    } else {
      setIssues(data || [])
    }
    setLoading(false)
  }, [statusFilter, priorityFilter, search])

  useEffect(() => {
    if (isOfficer) fetchIssues()
  }, [isOfficer, fetchIssues])

  // update status
  const handleStatusChange = useCallback(async (issueId: string, newStatus: string) => {
    setUpdatingId(issueId)
    const { error } = await supabase.rpc('officer_update_issue', {
      p_issue_id: issueId,
      p_status: newStatus,
    })
    if (error) {
      toast.error('Failed to update: ' + error.message)
    } else {
      toast.success(`Issue marked as ${newStatus.replace('_', ' ')}`)
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i))
    }
    setUpdatingId(null)
  }, [supabase])

  // ── access denied ──────────────────────────────────────────────────────────
  if (isOfficer === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-lg font-bold mb-1">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          This dashboard is only available to authorised officers.
        </p>
      </div>
    )
  }

  const open = issues.filter(i => i.status === 'open').length
  const inProgress = issues.filter(i => i.status === 'in_progress').length
  const resolved = issues.filter(i => i.status === 'resolved').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Officer Dashboard</h1>
        {officerArea && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            Assigned to: <span className="font-semibold text-foreground">{officerArea.name}</span>
            <Badge className="ml-1 text-[10px] bg-muted text-muted-foreground border-0">{officerArea.type}</Badge>
            <span className="text-[11px] text-muted-foreground ml-1">· includes all child areas</span>
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', count: open, color: 'text-red-600 bg-red-500/10', icon: AlertCircle },
          { label: 'In Progress', count: inProgress, color: 'text-yellow-600 bg-yellow-500/10', icon: Clock },
          { label: 'Resolved', count: resolved, color: 'text-green-600 bg-green-500/10', icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-4 flex flex-col gap-1", s.color)}>
            <s.icon className="w-5 h-5" />
            <p className="text-2xl font-black">{loading ? '—' : s.count}</p>
            <p className="text-xs font-semibold opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search issues…"
            className="pl-9 h-10 rounded-xl bg-card border-border"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={() => fetchIssues()} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Issues list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <IssueSkeleton key={i} />)
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No issues found</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'all' || priorityFilter !== 'all' || search
                ? 'Try adjusting your filters.'
                : 'All caught up! No issues assigned to your area yet.'}
            </p>
          </div>
        ) : (
          issues.map(issue => (
            <OfficerIssueCard
              key={issue.id}
              issue={issue}
              onStatusChange={handleStatusChange}
              updating={updatingId === issue.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
