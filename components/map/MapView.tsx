"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
import { getMapIssues, MapIssue } from '@/lib/api/map'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'sonner'
import MapLibreGL from 'maplibre-gl'
import { MAP_MODES } from './config'
import { Layers, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MapFilters } from './MapFilters'
import { HeatmapLayer } from './HeatmapLayer'
import { MapLegend } from './MapLegend'
import { IssueDetailSheet } from './IssueDetailSheet'

export function MapView() {
  const mapRef = useRef<MapLibreGL.Map>(null)
  const [issues, setIssues] = useState<MapIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('issues')
  const [mapType, setMapType] = useState('default')
  const [locDenied, setLocDenied] = useState(false)
  
  // Filter States
  const [search, setSearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null)
  
  // Viewport tracking for debounced fetching
  const [viewportBounds, setViewportBounds] = useState<{south: number, north: number, west: number, east: number} | null>(null)
  const debouncedBounds = useDebounce(viewportBounds, 500)

  // Fetch when debounced bounds change
  useEffect(() => {
    if (!debouncedBounds) return
    let isMounted = true

    const fetchMapData = async () => {
      setLoading(true)
      try {
        const data = await getMapIssues(debouncedBounds)
        if (isMounted) setIssues(data)
      } catch (error) {
        if (isMounted) toast.error('Failed to fetch map data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMapData()
    return () => { isMounted = false }
  }, [debouncedBounds])

  // Filter Issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = search ? issue.title.toLowerCase().includes(search.toLowerCase()) || issue.description?.toLowerCase().includes(search.toLowerCase()) : true
      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(issue.category) : true
      const matchesStatus = selectedStatus.length > 0 ? selectedStatus.includes(issue.status) : true
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [issues, search, selectedCategories, selectedStatus])

  const handleViewportChange = useCallback(() => {
    if (!mapRef.current) return
    const bounds = mapRef.current.getBounds()
    setViewportBounds({
      south: bounds.getSouth(),
      north: bounds.getNorth(),
      west: bounds.getWest(),
      east: bounds.getEast()
    })
  }, [])

  // Locate user
  const handleLocate = useCallback((coords: { longitude: number; latitude: number }) => {
    setLocDenied(false)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    
  }, [mapRef.current])

  // Handle 3D Pitch
  useEffect(() => {
    if (!mapRef.current) return;
    const is3D = mapType === 'osm3d';
    mapRef.current.easeTo({ 
      pitch: is3D ? 60 : 0, 
      duration: 500 
    });
  }, [mapType]);

  const mapStylesConfig = {
    default: undefined,
    osm: {
      light: "https://tiles.openfreemap.org/styles/bright",
      dark: "https://tiles.openfreemap.org/styles/bright"
    },
    osm3d: {
      light: "https://tiles.openfreemap.org/styles/liberty",
      dark: "https://tiles.openfreemap.org/styles/liberty"
    },
    satellite: {
      light: {
        version: 8 as const,
        sources: { sat: { type: 'raster' as const, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Tiles &copy; Esri' } },
        layers: [{ id: 'sat', type: 'raster' as const, source: 'sat' }]
      },
      dark: {
        version: 8 as const,
        sources: { sat: { type: 'raster' as const, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Tiles &copy; Esri' } },
        layers: [{ id: 'sat', type: 'raster' as const, source: 'sat' }]
      }
    }
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col">
      {/* Location Denied Warning */}
      {locDenied && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold cursor-pointer animate-in fade-in slide-in-from-top-4"
          onClick={() => {
            toast.info('Please enable location access in your browser settings to use this feature.')
          }}
        >
          <AlertTriangle className="w-4 h-4" />
          Location not allowed
        </div>
      )}

      <Map
        ref={mapRef}
        center={[78.9629, 20.5937]}
        zoom={4}
        minZoom={4}
        styles={mapType === 'default' ? undefined : mapStylesConfig[mapType as keyof typeof mapStylesConfig]}
        onViewportChange={handleViewportChange}
        className="w-full h-full"
      >
        <MapControls 
          position="bottom-right" 
          showLocate 
          showCompass 
          showFullscreen
          onLocate={handleLocate} 
        />

        {/* Render Issues if mode is 'issues' */}
        {mode === 'issues' && filteredIssues.map(issue => (
          <MapMarker 
            key={issue.id} 
            longitude={issue.longitude} 
            latitude={issue.latitude}
            onClick={() => setSelectedIssue(issue)}
          >
            <MarkerContent>
              <div className={`relative h-4 w-4 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform ${
                issue.priority === 'critical' ? 'bg-red-500' :
                issue.priority === 'high' ? 'bg-orange-500' :
                issue.priority === 'medium' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
            </MarkerContent>
          </MapMarker>
        ))}

        {/* Heatmap Layer */}
        {mode === 'heatmap' && <HeatmapLayer issues={filteredIssues} />}
      </Map>

      {/* Map Legend */}
      <MapLegend mode={mode} />

      {/* Issue Detail Sheet */}
      <IssueDetailSheet issue={selectedIssue} onClose={() => setSelectedIssue(null)} />

      {/* Overlays: Top Left (Search & Filters), Bottom Left (Mode Switcher) */}
      <div className="absolute top-4 left-4 z-10 w-[calc(100vw-2rem)] md:w-auto flex justify-start">
        <MapFilters 
          mapType={mapType} setMapType={setMapType} 
          search={search} setSearch={setSearch}
          selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
          selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
        />
      </div>

      <div className="absolute bottom-6 left-4 z-10 flex flex-col items-start gap-2">
        {/* Mode Switcher */}
        <div className="bg-background/80 backdrop-blur-md p-1.5 rounded-2xl border shadow-lg flex gap-1">
          {Object.values(MAP_MODES).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`relative rounded-xl overflow-hidden w-20 h-20 border-2 transition-all ${
                mode === m.id ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={m.previewImage} alt={m.label} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white text-center py-0.5">
                {m.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
