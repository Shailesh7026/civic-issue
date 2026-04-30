"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, MessageSquare, AlertCircle, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CommentUser {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  user_roles?: { role: string }[] | { role: string }
}

interface CommentData {
  id: string
  content: string
  created_at: string
  user: CommentUser
  parent_id?: string | null
  replies?: CommentData[]
  _hasMoreReplies?: boolean
}

export function IssueComment({ comment, depth = 0, issueId, profile }: { comment: CommentData; depth?: number; issueId: string; profile: any }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [replies, setReplies] = useState<CommentData[]>(comment.replies || [])
  const [isFetchingReplies, setIsFetchingReplies] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState("")
  const supabase = createClient()

  // For the badge
  const roleRaw = comment.user?.user_roles
  const role = Array.isArray(roleRaw) ? roleRaw[0]?.role : (roleRaw as any)?.role

  const handleFetchReplies = async () => {
    setIsFetchingReplies(true)
    const { data } = await supabase
      .from("comments")
      .select(`
        id, content, created_at, parent_id,
        user:profiles!user_id(id, first_name, last_name, avatar_url, user_roles(role))
      `)
      .eq("parent_id", comment.id)
      .order("created_at", { ascending: true })

    if (data) {
      setReplies(data as any)
    }
    setIsFetchingReplies(false)
  }

  const handlePostReply = async () => {
    if (!replyText.trim() || !profile) return
    const { data, error } = await supabase
      .from("comments")
      .insert({ issue_id: issueId, user_id: profile.id, content: replyText.trim(), parent_id: comment.id })
      .select(`id, content, created_at, parent_id, user:profiles!user_id(id, first_name, last_name, avatar_url, user_roles(role))`)
      .single()

    if (!error && data) {
      setReplies(prev => [...prev, data as any])
      setReplyText("")
      setShowReplyBox(false)
      setIsCollapsed(false)
    }
  }

  return (
    <div className={`flex flex-col ${depth > 0 ? "ml-8 mt-3" : "mt-5"}`}>
      <div className="flex gap-3 group">
        <div className="flex flex-col items-center">
          <Avatar className="h-8 w-8 shrink-0 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
            <AvatarImage src={comment.user?.avatar_url || ""} />
            <AvatarFallback className="text-xs">{comment.user?.first_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {!isCollapsed && replies.length > 0 && (
            <div className="w-[2px] h-full bg-border mt-2 rounded-full cursor-pointer hover:bg-primary/50" onClick={() => setIsCollapsed(true)} />
          )}
        </div>
        
        <div className="flex-1 space-y-1.5 pb-2">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsCollapsed(!isCollapsed)}>
            <span className="font-semibold text-sm hover:underline">
              {comment.user?.first_name} {comment.user?.last_name}
            </span>
            {role && (role === "officer" || role === "admin" || role === "super_admin") && (
              <Badge variant="default" className="h-4 text-[9px] px-1.5 font-bold uppercase tracking-wide bg-blue-600 hover:bg-blue-600">
                {role.replace('_', ' ')}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground ml-1">
              {new Date(comment.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
            {isCollapsed && (
              <span className="text-[11px] text-primary/70 font-medium ml-2 bg-primary/10 px-1.5 rounded">
                +{replies.length || 1} collapsed
              </span>
            )}
          </div>
          
          {!isCollapsed && (
            <>
              <p className="text-sm bg-muted/30 dark:bg-muted/10 p-3 rounded-xl rounded-tl-sm border border-muted/50 leading-relaxed text-foreground/90">
                {comment.content}
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
                {profile && (
                  <button onClick={() => setShowReplyBox(!showReplyBox)} className="hover:text-foreground transition-colors">
                    Reply
                  </button>
                )}
                {replies.length === 0 && !isFetchingReplies && (
                  <button onClick={handleFetchReplies} className="hover:text-foreground transition-colors flex items-center gap-1">
                    <ChevronDown className="h-3 w-3" /> See replies
                  </button>
                )}
              </div>

              {showReplyBox && (
                <div className="flex gap-2 mt-3 mb-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 h-8 rounded-md border bg-background px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePostReply()
                    }}
                  />
                  <Button size="sm" className="h-8 px-3 text-xs" onClick={handlePostReply} disabled={!replyText.trim()}>
                    Reply
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!isCollapsed && replies.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {replies.map(reply => (
            <IssueComment key={reply.id} comment={reply} depth={depth + 1} issueId={issueId} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
