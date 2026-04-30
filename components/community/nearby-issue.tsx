"use client";

import { useState, useEffect } from "react";
import { getIssuesFeed } from "@/lib/api/community";
import { MapPin, Clock, AlertTriangle, MessageSquare, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface NearbyIssuesProps {
  areaId: string;
}

export function NearbyIssues({ areaId }: NearbyIssuesProps) {
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadIssues() {
      setIsLoading(true);
      try {
        const data = await getIssuesFeed({ areaId, limit: 5 });
        setIssues(data || []);
      } catch (e) {
        console.error("Failed to load nearby issues", e);
      } finally {
        setIsLoading(false);
      }
    }
    if (areaId) {
      loadIssues();
    }
  }, [areaId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground px-1">
          <MapPin className="w-4 h-4" /> Nearby Issues
        </h3>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground px-1">
          <MapPin className="w-4 h-4" /> Nearby Issues
        </h3>
        <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground flex flex-col items-center justify-center">
          <MapPin className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No recent issues in your area.</p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2 text-sm px-1">
        <MapPin className="w-4 h-4 text-primary" /> Nearby Issues
      </h3>
      <div className="flex flex-col gap-2">
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => router.push(`/dashboard/issue/${issue.id}`)}
            className="group rounded-xl border bg-card p-3 hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {issue.title}
              </h4>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-md shrink-0 border uppercase tracking-wider ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2">
              {issue.description}
            </p>
            
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                </span>
                {issue.upvotes_count > 0 && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    {issue.upvotes_count}
                  </span>
                )}
              </div>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>
      {issues.length > 0 && (
        <Button 
          variant="ghost" 
          className="w-full text-xs h-8 text-muted-foreground hover:text-primary transition-colors mt-1"
          onClick={() => router.push('/dashboard/home')}
        >
          View More <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
