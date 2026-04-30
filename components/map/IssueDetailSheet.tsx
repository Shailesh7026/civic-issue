"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { MapIssue } from "@/lib/api/map"
import { MapPin, Share2, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface IssueDetailSheetProps {
  issue: MapIssue | null
  onClose: () => void
}

export function IssueDetailSheet({ issue, onClose }: IssueDetailSheetProps) {
  if (!issue) return null

  // Placeholder for media since MapIssue doesn't have media directly. 
  // You would fetch full issue details or assume it has image_url.
  const mediaFiles = (issue as any).image_url 
    ? [(issue as any).image_url] 
    : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80'] // Placeholder pothole

  return (
    <Sheet open={!!issue} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto bg-background/95 backdrop-blur-xl border-l">
        {/* Media Carousel */}
        <div className="relative w-full h-64 bg-muted">
          <ScrollArea className="w-full h-full whitespace-nowrap">
            <div className="flex w-max space-x-1 h-full">
              {mediaFiles.map((url, i) => (
                <div key={i} className="relative w-full sm:w-[400px] h-full inline-block shrink-0">
                  <img src={url} alt="Issue media" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 bg-background/50 backdrop-blur-md rounded-full hover:bg-background/80 transition">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-background/90 text-foreground backdrop-blur-md hover:bg-background/90 shadow-lg">
              {issue.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Header Info */}
          <div className="space-y-3">
            <SheetTitle className="text-2xl font-bold leading-tight">
              {issue.title}
            </SheetTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{issue.area_name}</span>
              <span>•</span>
              <span>Reported just now</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground pt-2">
              {issue.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Status Timeline</h4>
            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
              
              {/* Report Filed */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-blue-500 shadow shrink-0 absolute left-[-24px]" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Report Filed</span>
                  <span className="text-xs text-muted-foreground">Citizen • Pending</span>
                </div>
              </div>

              {/* In Progress */}
              {issue.status === 'in_progress' || issue.status === 'resolved' ? (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-orange-500 shadow shrink-0 absolute left-[-24px]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">In Progress</span>
                    <span className="text-xs text-muted-foreground">Officer Assigned</span>
                  </div>
                </div>
              ) : null}

              {/* Resolved */}
              {issue.status === 'resolved' ? (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-green-500 shadow shrink-0 absolute left-[-24px]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Resolved</span>
                    <span className="text-xs text-muted-foreground">Completed</span>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group opacity-40">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-background bg-muted shadow shrink-0 absolute left-[-24px]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Resolved</span>
                    <span className="text-xs text-muted-foreground">Expected soon</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  )
}
