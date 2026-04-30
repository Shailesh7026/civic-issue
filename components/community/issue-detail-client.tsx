'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowBigUp, Share2, MessageCircleIcon, ArrowLeft, Send, AlertCircle, Clock, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { upvoteIssue } from "@/lib/api/community"
import { createClient } from "@/lib/supabase/client"
import { IssueMediaCarousel } from "./issue-media-carousel"
import { IssueTimeline } from "./issue-timeline"
import { IssueComment } from "./issue-comments"
import { LocationMapPreview } from "@/components/map/locationMapPreview"
import { useUserStore } from "@/store/useUserStore"

import { AdminControls } from "./admin-controls"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-red-100 text-red-700" },
  critical: { label: "Critical", color: "bg-red-600 text-white" },
}

interface IssueDetailClientProps {
  issue: any
  initialComments: any[]
  updates?: any[]
}

export default function IssueDetailClient({ issue: initialIssue, initialComments, updates = [] }: IssueDetailClientProps) {
  const { profile } = useUserStore()
  const [issue, setIssue] = useState(initialIssue)
  const [upvotes, setUpvotes] = useState<number>(issue.upvotes_count ?? 0)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [comments, setComments] = useState(initialComments)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function checkRole() {
      if (!profile?.id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .eq('area_id', issue.area_id)
        .maybeSingle()
      
      if (data) setUserRole(data.role)
      else {
        // Check if global admin
        const { data: globalData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .is('area_id', null)
          .maybeSingle()
        if (globalData) setUserRole(globalData.role)
      }
    }
    checkRole()
  }, [profile?.id, issue.area_id])

  const statusCfg = STATUS_CONFIG[issue.status] ?? { label: issue.status, color: "bg-muted text-muted-foreground" }
  const priorityCfg = PRIORITY_CONFIG[issue.priority] ?? { label: issue.priority, color: "bg-muted text-muted-foreground" }

  const handleUpvote = async () => {
    if (!profile) return
    const delta = hasUpvoted ? -1 : 1
    setUpvotes(u => u + delta)
    setHasUpvoted(!hasUpvoted)
    try {
      await upvoteIssue(issue.id, profile.id, delta as 1 | -1)
    } catch {
      // Revert on error
      setUpvotes(u => u - delta)
      setHasUpvoted(h => !h)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/community/issue/${issue.id}`
    if (navigator.share) {
      navigator.share({ title: issue.title, text: issue.description ?? '', url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const handlePostComment = async () => {
    if (!commentText.trim() || !profile) return
    setPostingComment(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("comments")
      .insert({ issue_id: issue.id, user_id: profile.id, content: commentText.trim() })
      .select(`id, content, created_at, user:profiles!user_id(id, first_name, last_name, avatar_url, user_roles(role))`)
      .single()

    if (!error && data) {
      setComments(prev => [...prev, data])
      setCommentText('')
    }
    setPostingComment(false)
  }

  return (
    <div className="w-full md:w-[90%] mx-auto px-4 py-6 pb-24">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Column: Post and Comments */}
        <div className="flex-1 max-w-3xl w-full space-y-6 mx-auto lg:mx-0">
          {/* Back Navigation */}
          <Link href="/dashboard/community">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          {/* Main Issue Card */}
      <Card className="shadow-md overflow-hidden mt-4">
       
        <CardHeader className="pb-3 px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-muted">
                <AvatarImage src={issue.author?.avatar_url || ''} />
                <AvatarFallback className="text-sm font-bold">
                  {issue.author?.first_name?.charAt(0)}{issue.author?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm leading-tight">
                  {issue.author?.first_name} {issue.author?.last_name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  {new Date(issue.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {issue.area?.name && (
                    <>
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{issue.area.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Status + Priority Badges */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusCfg.color)}>
                {statusCfg.label}
              </span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", priorityCfg.color)}>
                {priorityCfg.label}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-4 space-y-4">
          {/* Title */}
          <h1 className="text-xl font-extrabold leading-snug tracking-tight">
            {issue.title}
          </h1>

          {/* Images / Media */}
          {Array.isArray(issue.image_urls) && issue.image_urls.length > 0 && (
            <div className="w-full my-4">
              <IssueMediaCarousel mediaUrls={issue.image_urls} />
            </div>
          )}

          {/* Description */}
          {issue.description && (
            <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {issue.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center gap-1 border-t px-5 py-3 bg-muted/20">
          {/* Upvote */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvote}
            disabled={!profile}
            className={cn("gap-1.5 font-semibold", hasUpvoted && "text-teal-600")}
          >
            <ArrowBigUp
              className={cn("h-5 w-5 transition-all", hasUpvoted && "fill-teal-500 stroke-teal-500 scale-110")}
            />
            {upvotes}
          </Button>

          {/* Comment count (scrolls down) */}
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <a href="#comments">
              <MessageCircleIcon className="h-4 w-4" />
              {comments.length}
            </a>
          </Button>

          {/* Share */}
          <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </CardFooter>
      </Card>

      {/* Admin Controls */}
      {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'officer') && (
        <AdminControls issue={issue} onIssueUpdate={setIssue} userRole={userRole} />
      )}

      {/* Comments Section */}
      <div id="comments" className="space-y-4 scroll-mt-6">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-base">
            Comments <span className="text-muted-foreground font-normal">({comments.length})</span>
          </h2>
          <Separator className="flex-1" />
        </div>

        {/* Post a Comment */}
        {profile ? (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 mt-1 shrink-0">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="text-xs font-bold">
                {profile.first_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Share your thoughts or updates on this issue..."
                className="min-h-[80px] resize-none text-sm"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-2 bg-teal-500 hover:bg-teal-400 text-white"
                  onClick={handlePostComment}
                  disabled={postingComment || !commentText.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  {postingComment ? "Posting…" : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <Link href="/auth/login" className="text-teal-600 font-semibold hover:underline">
              Sign in
            </Link>{" "}
            to leave a comment.
          </div>
        )}

        {/* Comment List */}
        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No comments yet. Be the first to speak up!
            </p>
          ) : (
            comments.map((comment: any) => (
              <IssueComment key={comment.id} comment={comment} issueId={issue.id} profile={profile} />
            ))
          )}
        </div>
      </div>
        </div>

        {/* Right Column: Timeline & Map */}
        <div className="w-full md:w-[32%] xl:w-[35%] shrink-0 mt-4">
          <div className="sticky top-6 space-y-6">
            <IssueTimeline issue={issue} updates={updates} />
            
            {issue.latitude && issue.longitude && (
              <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-base">Location</h3>
                <LocationMapPreview latitude={issue.latitude} longitude={issue.longitude} className="h-48 sm:h-56 rounded-xl border-0" />
                <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1">
                  {issue.area?.name && <span className="font-medium text-foreground">{issue.area.name}</span>}
                  <span>{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
