'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUserStore } from "@/store/useUserStore"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, Eye, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function ManageOfficialsPage() {
  const [officers, setOfficers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { profile, isHydrated } = useUserStore()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isHydrated) return
    
    async function fetchOfficers() {
      // Get all officers across areas
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          area_id,
          profiles (first_name, last_name, avatar_url),
          areas (name)
        `)
        .in('role', ['officer', 'admin'])

      if (error) {
        toast.error("Failed to load officers")
        setLoading(false)
        return
      }

      // Compute additional stats per officer
      const officersWithStats = await Promise.all(data.map(async (o: any) => {
        const { count: assignedCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', o.user_id)
          .neq('status', 'resolved')

        return {
          ...o,
          name: `${o.profiles?.first_name} ${o.profiles?.last_name}`,
          avatar: o.profiles?.avatar_url,
          areaName: o.areas?.name || 'Global',
          activeIssuesCount: assignedCount || 0,
          rating: (Math.random() * 2 + 3).toFixed(1) // Mock rating between 3.0 and 5.0
        }
      }))

      setOfficers(officersWithStats)
      setLoading(false)
    }

    fetchOfficers()
  }, [isHydrated])

  if (loading || !isHydrated) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Manage Officials
          </h1>
          <p className="text-muted-foreground mt-1">Control workforce and view performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {officers.map((officer) => (
          <Card key={officer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                  <AvatarImage src={officer.avatar} />
                  <AvatarFallback>{officer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{officer.name}</CardTitle>
                  <CardDescription className="text-xs uppercase tracking-wider font-semibold text-primary">{officer.role}</CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/officer/${officer.user_id}`)}>
                    <Eye className="w-4 h-4 mr-2" /> View Profile
                  </DropdownMenuItem>
                  {/* Additional actions would be wired here */}
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">Deactivate</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-muted/50 p-2 rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Area</p>
                  <p className="font-semibold line-clamp-1">{officer.areaName}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Active</p>
                  <p className="font-semibold">{officer.activeIssuesCount}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded-xl flex flex-col items-center justify-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Rating</p>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">
                    ⭐ {officer.rating}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => router.push(`/dashboard/officer/${officer.user_id}`)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
