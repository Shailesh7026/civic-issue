"use client"

import { Clock, CheckCircle2, UserCircle2, ArrowRight } from "lucide-react"

interface IssueTimelineProps {
  issue: any
  updates: any[]
}

export function IssueTimeline({ issue, updates }: IssueTimelineProps) {
  // Sort updates if necessary
  const sortedUpdates = [...updates].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Issue Timeline</h3>
        <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
          {updates.length + 1}
        </span>
      </div>

      <div className="relative border-l-2 border-muted ml-3 pl-5 space-y-6">
        {/* Creation Event */}
        <div className="relative">
          <div className="absolute -left-[27px] top-1 h-5 w-5 rounded-full border-4 border-background bg-teal-500 shadow-sm" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Issue Created</h4>
            <div className="flex items-center text-xs text-muted-foreground gap-2">
              <Clock className="h-3 w-3" />
              {new Date(issue.created_at).toLocaleString("en-IN", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
              })}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Reported by {issue.author?.first_name} {issue.author?.last_name}
            </p>
          </div>
        </div>

        {/* Updates */}
        {sortedUpdates.map((update, i) => {
          const role = update.user?.user_roles?.[0]?.role
          return (
            <div key={update.id} className="relative">
              <div className="absolute -left-[27px] top-1 h-5 w-5 rounded-full border-4 border-background bg-blue-500 shadow-sm" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground leading-tight">Update</h4>
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                  <Clock className="h-3 w-3" />
                  {new Date(update.created_at).toLocaleString("en-IN", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                  })}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    {update.user?.first_name} {update.user?.last_name}
                    {role && (
                      <span className="uppercase text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded-sm">
                        {role}
                      </span>
                    )}
                  </span>
                </div>
                {update.message && (
                  <p className="text-sm bg-muted/40 p-2.5 rounded-lg border text-foreground/80 mt-2">
                    {update.message}
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {/* Current status as last step */}
        {issue.status !== 'open' && (
          <div className="relative">
            <div className={`absolute -left-[27px] top-1 h-5 w-5 rounded-full border-4 border-background shadow-sm ${issue.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}`} />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold capitalize flex items-center gap-1.5">
                {issue.status.replace('_', ' ')}
                {issue.status === 'resolved' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
              </h4>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
