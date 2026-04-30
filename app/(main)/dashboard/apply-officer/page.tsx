"use client"

import { useState, useEffect } from "react"
import { useUserStore } from "@/store/useUserStore"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, FileText, Info, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { useRouter } from "next/navigation"
import { MediaUpload, type MediaFile } from "@/components/community/media-upload"

export default function ApplyOfficerPage() {
  const { profile } = useUserStore()
  const router = useRouter()
  const supabase = createClient()
  
  const [areas, setAreas] = useState<any[]>([])
  const [selectedArea, setSelectedArea] = useState<string>("")
  const [media, setMedia] = useState<MediaFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingData(true)
      const { data: areasData } = await supabase.from('areas').select('id, name, type').order('name')
      if (areasData) {
        setAreas(areasData)
      }

      if (profile?.id) {
        const { data: requestData } = await supabase
          .from('officer_requests')
          .select(`
            *,
            areas (
              name,
              type
            )
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (requestData) {
          setExistingApplication(requestData)
        }
      }
      setIsLoadingData(false)
    }

    if (profile !== undefined) {
      loadInitialData()
    }
  }, [profile, supabase])

  const uploadDocuments = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const m of media) {
      const uploadFile = m.compressed || m.file
      const ext = uploadFile.name.split('.').pop()
      const path = `officer-proofs/${profile!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('officer-proofs').upload(path, uploadFile)
      if (error) throw new Error(`Upload failed: ${error.message}`)
      const { data } = supabase.storage.from('officer-proofs').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) {
      toast.error("You must be logged in to apply")
      return
    }
    
    if (!selectedArea) {
      toast.error("Please select an area")
      return
    }

    if (media.length === 0) {
      toast.error("Please upload proof of your identity/office")
      return
    }

    setIsSubmitting(true)
    try {
      // Upload proofs
      const proofUrls = await uploadDocuments()

      const { error } = await supabase.from('officer_requests').insert({
        user_id: profile.id,
        requested_area_id: selectedArea,
        status: 'pending',
        documents: { proof_urls: proofUrls }
      })

      if (error) throw error
      
      toast.success("Application submitted successfully!")
      router.push('/dashboard/home')
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const GuidelinesContent = () => (
    <div className="rounded-2xl border bg-primary/5 border-primary/20 p-5 space-y-4 shadow-sm text-foreground">
      <h3 className="font-semibold text-primary flex items-center gap-2 text-sm">
        <ShieldCheck className="w-4 h-4" /> Official Officer Guidelines
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        This application is strictly for verified government officials and authorized personnel.
      </p>
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="leading-tight font-medium">Verify your official status by uploading 1-3 proof documents.</span>
        </li>
        <li className="flex gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="leading-tight">Proofs can include ID cards, appointment letters, or duty certificates.</span>
        </li>
        <li className="flex gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="leading-tight">Applications with blurred or invalid proofs will be rejected immediately.</span>
        </li>
        <li className="flex gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="leading-tight">You will gain dashboard access only after manual admin verification.</span>
        </li>
      </ul>
    </div>
  )

  if (isLoadingData) {
    return (
      <div className="w-full flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (existingApplication) {
    return (
      <div className="w-full md:w-[90%] mx-auto px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Application Status</h1>
              <p className="text-sm text-muted-foreground">View the status of your officer application</p>
            </div>
          </div>
          
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Current Application</h3>
              {existingApplication.status === 'pending' && (
                <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-sm font-medium">Pending Review</span>
              )}
              {existingApplication.status === 'approved' && (
                <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-medium">Approved</span>
              )}
              {existingApplication.status === 'rejected' && (
                <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-sm font-medium">Rejected</span>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Requested Area</span>
                <span className="font-medium">{existingApplication.areas?.name || 'Unknown'} ({existingApplication.areas?.type || 'Unknown'})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Applied On</span>
                <span className="font-medium">{new Date(existingApplication.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {existingApplication.status === 'rejected' && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setExistingApplication(null)}
              >
                Apply Again
              </Button>
            )}
            
            {existingApplication.status === 'approved' && (
              <Button 
                className="w-full mt-4"
                onClick={() => router.push('/dashboard/home')}
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:w-[90%] mx-auto px-4 py-6 pb-24">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Left Column: Form */}
        <div className="flex-1 max-w-2xl w-full space-y-6 mx-auto lg:mx-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Apply as an Officer</h1>
                <p className="text-sm text-muted-foreground">Request officer privileges for a specific area</p>
              </div>
            </div>

            {/* Mobile Guidelines Trigger */}
            <div className="lg:hidden">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                    <Info className="h-4 w-4 text-primary" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="p-4 pb-8">
                    <GuidelinesContent />
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area">Select Area</Label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger id="area" className="w-full">
                    <SelectValue placeholder="Select an area you wish to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name} <span className="text-xs text-muted-foreground">({area.type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-2">
                <MediaUpload 
                  media={media}
                  setMedia={setMedia}
                  maxImages={3}
                  label="Official Proof / ID Card"
                  helperText="Upload 1-3 clear images of your official credentials"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full font-bold h-12 rounded-xl text-base shadow-md active:translate-y-0.5 transition-all"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying & Submitting...</>
              ) : (
                "Submit Official Application"
              )}
            </Button>
          </form>
        </div>

        {/* Right Column: Guidelines */}
        <div className="hidden lg:block w-[25%] xl:w-[35%] shrink-0">
          <div className="sticky top-6">
             <GuidelinesContent />
          </div>
        </div>

      </div>
    </div>
  )
}
