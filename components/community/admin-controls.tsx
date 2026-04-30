'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, ShieldAlert } from 'lucide-react'

export function AdminControls({ issue, onIssueUpdate, userRole }: { issue: any, onIssueUpdate: (issue: any) => void, userRole: string }) {
  const [officers, setOfficers] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    status: issue.status,
    priority: issue.priority,
    assigned_to: issue.assigned_to || "unassigned",
    area_id: issue.area_id
  })

  useEffect(() => {
    async function loadData() {
      // Load officers for this area
      const { data: offData } = await supabase
        .from('user_roles')
        .select('user_id, profiles(first_name, last_name)')
        .eq('area_id', issue.area_id)
        .in('role', ['officer', 'admin', 'super_admin'])
      
      if (offData) {
        setOfficers(offData.map((o: any) => {
          const prof = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
          return { 
            id: o.user_id, 
            name: `${prof?.first_name || ''} ${prof?.last_name || ''}`.trim() || 'Unnamed Officer'
          };
        }))
      }

      // Load all areas for transfer
      const { data: areaData } = await supabase.from('areas').select('id, name')
      if (areaData) setAreas(areaData)
    }
    loadData()
  }, [issue.area_id])

  const handleUpdate = async () => {
    setSaving(true)
    const updates = {
      status: formData.status,
      priority: formData.priority,
      assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
      area_id: formData.area_id
    }
    const { error } = await supabase.from('issues').update(updates).eq('id', issue.id)
    if (error) {
      toast.error("Failed to update issue: " + error.message)
    } else {
      toast.success("Issue updated successfully")
      onIssueUpdate({ ...issue, ...updates })
    }
    setSaving(false)
  }

  return (
    <Card className="mt-6 border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2 text-base">
          <ShieldAlert className="w-5 h-5" /> Admin Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
              <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
              <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign Officer</Label>
            <Select value={formData.assigned_to} onValueChange={v => setFormData({...formData, assigned_to: v})}>
              <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {officers.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Transfer Area</Label>
            <Select value={formData.area_id} onValueChange={v => setFormData({...formData, area_id: v})}>
              <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
              <SelectContent>
                {areas.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleUpdate} disabled={saving} variant="destructive">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
