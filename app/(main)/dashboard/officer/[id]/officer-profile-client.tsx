'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Clock, MapPin, Shield, Star, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useUserStore } from "@/store/useUserStore"

export default function OfficerProfileClient({ officer, issues }: { officer: any, issues: any[] }) {
  const { profile } = useUserStore()
  
  const totalIssues = issues.length
  const activeIssues = issues.filter(i => i.status !== 'resolved').length
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length
  const resolutionRate = totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0
  
  // Mock monthly data for graph
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const chartData = months.map(m => Math.floor(Math.random() * 20) + 5)
  const maxVal = Math.max(...chartData, 1)

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24">
      <Link href="/dashboard/admin/officers">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Officials
        </Button>
      </Link>

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-primary/10">
          <AvatarImage src={officer.avatar_url} />
          <AvatarFallback className="text-3xl">{officer.first_name?.charAt(0)}{officer.last_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{officer.first_name} {officer.last_name}</h1>
            <Badge className="w-fit bg-blue-600 hover:bg-blue-600"><Shield className="w-3 h-3 mr-1"/> Official</Badge>
          </div>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" /> 
            {officer.user_roles?.[0]?.area_id ? "Local Officer" : "Global Admin"}
          </p>
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> 4.8 / 5.0 Rating
            </div>
            <div className="flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
              <Clock className="w-4 h-4" /> ~1.5 days avg response
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Stats & Graph */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted p-4 rounded-xl">
                  <p className="text-3xl font-black text-primary">{totalIssues}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold tracking-wider">Total Handled</p>
                </div>
                <div className="bg-muted p-4 rounded-xl">
                  <p className="text-3xl font-black">{activeIssues}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold tracking-wider">Active Now</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Resolution Rate</span>
                  <span className="text-sm font-bold text-green-600">{resolutionRate}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${resolutionRate}%` }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Graph Mock */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issues Resolved (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40 pt-4">
                {chartData.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-primary/20 rounded-t-sm relative group">
                      <div 
                        className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-500"
                        style={{ height: `${(val / maxVal) * 100}%` }}
                      ></div>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded transition-opacity">
                        {val}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">{months[idx]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Assigned Issues List */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Assigned Issues ({totalIssues})</CardTitle>
              <CardDescription>All active and past issues handled by this officer.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No issues assigned yet.</p>
                  </div>
                ) : (
                  issues.map(issue => (
                    <Link key={issue.id} href={`/dashboard/community/issue/${issue.id}`}>
                      <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">{issue.title}</h4>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                            {issue.areas?.name && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-foreground/70">{issue.areas.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={issue.priority === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {issue.priority}
                          </Badge>
                          <Badge variant={issue.status === 'resolved' ? 'outline' : 'default'} className="text-[10px]">
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
