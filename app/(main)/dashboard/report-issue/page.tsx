'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  MapPin, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ArrowLeft, FileText, Map
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { LocationMapPreview } from "@/components/map/locationMapPreview"
import { NearbyIssues } from "@/components/community/nearby-issue"
import { MediaUpload, type MediaFile } from "@/components/community/media-upload"

// ── constants ──────────────────────────────────────────────────────────────────
const MAX_IMAGES = 5
const MAX_VIDEOS = 2
const MAX_IMAGE_SIZE_MB = 8
const MAX_VIDEO_SIZE_MB = 50

const CATEGORIES = [
  'Road & Infrastructure',
  'Water Supply',
  'Electricity',
  'Sanitation & Waste',
  'Public Safety',
  'Parks & Recreation',
  'Noise Pollution',
  'Other',
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-600' },
  { value: 'high', label: 'High', color: 'bg-orange-500/10 text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-600' },
]

// Image compression and types are now handled in the MediaUpload component.
interface AreaMatch {
  id: string
  name: string
  type: string
}

interface LocationResult {
  lat: number
  lng: number
  cityName: string
  regionName: string
  country: string
  matchedArea: AreaMatch | null
  unserved: boolean
}


// ── Geocode + area match ──────────────────────────────────────────────────────
async function detectLocation(): Promise<LocationResult> {
  const supabase = createClient()

  const pos = await new Promise<GeolocationPosition>((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
  )
  const { latitude: lat, longitude: lng } = pos.coords

  // Reverse geocode with nominatim (free, no API key)
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  )
  const geo = await resp.json()
  const addr = geo.address || {}
  const cityName: string = addr.city || addr.town || addr.village || addr.county || ''
  const regionName: string = addr.state || ''
  const country: string = addr.country || ''

  // Try to match: ward → city → state in our areas table
  const rawCandidates = [
    addr.suburb, addr.neighbourhood, addr.city_district, // ward-level
    addr.city, addr.town, addr.village, addr.county, addr.state_district, // city-level
    addr.state,                                          // state-level
  ].filter(Boolean)

  const candidates = rawCandidates.map(c => c.replace(/\s+(Taluka|District|City)$/i, ''))

  let matchedArea: AreaMatch | null = null
  for (const name of candidates) {
    const { data } = await supabase
      .from('areas')
      .select('id, name, type')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single()
    if (data) { matchedArea = data; break }
  }

  const unserved = !matchedArea

  return { lat, lng, cityName, regionName, country, matchedArea, unserved }
}

// ── Map & Guidelines Sub-Component ────────────────────────────────────────────
const MapAndGuidelines = ({ location }: { location: LocationResult | null }) => (
  <div className="space-y-6">
    {/* Map View */}
    <div className="hidden sm:block rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Map className="w-4 h-4 text-primary" /> Location Preview
        </h3>
      </div>
      {location ? (
        <LocationMapPreview latitude={location.lat} longitude={location.lng} className="h-48 sm:h-64 rounded-none border-0 shadow-none" />
      ) : (
        <div className="h-48 sm:h-64 bg-muted/50 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm">
            <MapPin className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium">Detect location to see map preview</p>
        </div>
      )}
    </div>

    {/* Nearby Issues */}
    {location?.matchedArea?.id && (
      <NearbyIssues areaId={location.matchedArea.id} />
    )}

    {/* Guidelines */}
    <div className="rounded-2xl border bg-primary/5 border-primary/20 p-5 space-y-4 shadow-sm">
      <h3 className="font-semibold text-primary flex items-center gap-2 text-sm">
        <FileText className="w-4 h-4" /> Reporting Guidelines
      </h3>
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li className="flex gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="leading-tight">Provide accurate location by allowing location access.</span>
        </li>
        <li className="flex gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="leading-tight">Upload clear photos or videos of the issue.</span>
        </li>
        <li className="flex gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="leading-tight">Write a descriptive title and detailed explanation.</span>
        </li>
        <li className="flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <span className="leading-tight">Do not report emergencies here. Call emergency services instead.</span>
        </li>
      </ul>
    </div>
  </div>
)

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportIssuePage() {
  const router = useRouter()
  const { user, profile, isHydrated } = useUserStore()
  const supabase = createClient()

  // form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('medium')
  const [media, setMedia] = useState<MediaFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // location state
  const [location, setLocation] = useState<LocationResult | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  // Auto-detect on mount
  useEffect(() => {
    if (isHydrated) handleDetectLocation()
  }, [isHydrated])

  // ── auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isHydrated && !user) router.replace('/auth/login')
  }, [isHydrated, user, router])

  // ── location detection ─────────────────────────────────────────────────────
  const handleDetectLocation = useCallback(async () => {
    setLocLoading(true)
    setLocError(null)
    try {
      const result = await detectLocation()
      setLocation(result)
      if (result.unserved) {
        toast.warning("Your area is not yet supported. We've logged your location for future expansion.")
      }
    } catch (e: any) {
      setLocError(e?.message === 'User denied Geolocation' || e?.code === 1
        ? 'Location permission denied. Please allow location access.'
        : 'Could not detect location. Please try again.')
    } finally {
      setLocLoading(false)
    }
  }, [])

  // Media handling is now delegated to the MediaUpload component.

  // ── upload to supabase storage ─────────────────────────────────────────────
  const uploadMedia = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const m of media) {
      const uploadFile = m.type === 'image' && m.compressed ? m.compressed : m.file
      const ext = uploadFile.name.split('.').pop()
      const path = `issues/${profile!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('issue-media').upload(path, uploadFile)
      if (error) throw new Error(`Upload failed: ${error.message}`)
      const { data } = supabase.storage.from('issue-media').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please enter a title'); return }
    if (!description.trim()) { toast.error('Please enter a description'); return }
    if (!category) { toast.error('Please select a category'); return }
    if (!location) { toast.error('Please allow location access first'); return }

    setSubmitting(true)
    try {
      // If unserved region — log it and show message
      if (location.unserved) {
        const { error } = await supabase.from('unserved_regions').insert({
          user_id: profile!.id,
          latitude: location.lat,
          longitude: location.lng,
          city_name: location.cityName,
          region_name: location.regionName,
          country: location.country,
        })
        if (error) throw error
        toast.info('Your area is not yet supported. Your report has been logged and will help us expand coverage!')
        setSubmitted(true)
        return
      }

      // Upload media
      const mediaUrls = media.length > 0 ? await uploadMedia() : []

      // Insert issue
      const { error } = await supabase.from('issues').insert({
        title: title.trim(),
        description: description.trim(),
        area_id: location.matchedArea!.id,
        created_by: profile!.id,
        priority,
        status: 'open',
        visibility: 'public',
        category: category,
        latitude: location.lat,
        longitude: location.lng,
        image_urls: mediaUrls.length > 0 ? mediaUrls : null,
      })
      if (error) throw error

      toast.success('Issue reported successfully!')
      setSubmitted(true)
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-black mb-2">
          {location?.unserved ? "Location Logged!" : "Issue Reported!"}
        </h2>
        <p className="text-muted-foreground max-w-sm mb-8">
          {location?.unserved
            ? "Your area is not yet covered. We've logged your location to prioritize expansion."
            : "Your civic issue has been submitted and assigned to the local authority."}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl" onClick={() => router.push('/dashboard/home')}>
            Back to Home
          </Button>
          <Button className="rounded-xl" onClick={() => {
            setSubmitted(false); setTitle(''); setDescription(''); setCategory(''); setMedia([])
          }}>
            Report Another
          </Button>
        </div>
      </div>
    )
  }

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'video')

  return (
    <div className="w-full md:w-[90%] mx-auto px-4 py-6 pb-24">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Left Column: Form */}
        <div className="flex-1 max-w-7xl w-full space-y-6 mx-auto lg:mx-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-black tracking-tight">Report a Civic Issue</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Help improve your community</p>
              </div>
            </div>

            {/* Mobile Map/Guidelines Trigger */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden rounded-xl h-10 w-10 shrink-0">
                  <Map className="w-5 h-5 text-primary" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="px-4 py-6 max-h-[80vh] overflow-y-auto">
                  <MapAndGuidelines location={location} />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

      {/* Location Card */}
      <div className={cn(
        "rounded-2xl border p-4 space-y-2 transition-colors",
        location?.unserved ? "border-yellow-500/40 bg-yellow-500/5"
          : location?.matchedArea ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      )}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Detected Location
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-lg"
            onClick={handleDetectLocation}
            disabled={locLoading}
          >
            {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Retry'}
          </Button>
        </div>

        {locLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Detecting your location…
          </div>
        )}

        {locError && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertTriangle className="w-4 h-4" /> {locError}
          </div>
        )}

        {location && !locLoading && (
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              {location.cityName}{location.regionName ? `, ${location.regionName}` : ''}{location.country ? `, ${location.country}` : ''}
            </p>
            {location.unserved ? (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-500/10 gap-1">
                <AlertTriangle className="w-3 h-3" /> Not yet supported — logged for expansion
              </Badge>
            ) : (
              <Badge className="bg-primary/10 text-primary border-0 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Assigned to: {location.matchedArea?.name} ({location.matchedArea?.type})
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Issue Title <span className="text-destructive">*</span></label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Broken streetlight on MG Road"
          className="h-11 rounded-xl"
          maxLength={120}
        />
        <p className="text-[11px] text-muted-foreground text-right">{title.length}/120</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Description <span className="text-destructive">*</span></label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the issue in detail — what, where, how severe…"
          className="min-h-[120px] rounded-xl resize-none"
          maxLength={1000}
        />
        <p className="text-[11px] text-muted-foreground text-right">{description.length}/1000</p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Category <span className="text-destructive">*</span></label>
        <div className="relative">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full h-11 rounded-xl border border-input bg-card px-4 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Priority</label>
        <div className="flex gap-2 flex-wrap">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all",
                priority === p.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Upload */}
      <MediaUpload
        media={media}
        setMedia={setMedia}
        maxImages={MAX_IMAGES}
        maxVideos={MAX_VIDEOS}
        maxImageSizeMB={MAX_IMAGE_SIZE_MB}
        maxVideoSizeMB={MAX_VIDEO_SIZE_MB}
        allowVideo={true}
      />

      {/* Submit */}
          <Button
            className="w-full h-12 rounded-xl text-base font-bold"
            onClick={handleSubmit}
            disabled={submitting || locLoading || (!location && !locError)}
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting…</>
            ) : (
              <><FileText className="w-5 h-5 mr-2" /> Submit Issue Report</>
            )}
          </Button>
        </div>

        {/* Right Column: Desktop Map & Guidelines */}
        <div className="hidden lg:block w-[25%] xl:w-[35%] shrink-0">
          <div className="sticky top-6">
            <MapAndGuidelines location={location} />
          </div>
        </div>
      </div>
    </div>
  )
}
