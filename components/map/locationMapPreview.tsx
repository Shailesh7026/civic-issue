"use client"

import { useRef } from 'react'
import { Map, MapMarker, MarkerContent } from '@/components/ui/map'
import MapLibreGL from 'maplibre-gl'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { useTheme } from 'next-themes'

interface LocationMapPreviewProps {
  latitude: number
  longitude: number
  className?: string
}

export function LocationMapPreview({ latitude, longitude, className }: LocationMapPreviewProps) {
  const mapRef = useRef<MapLibreGL.Map>(null)
  const router = useRouter()

  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const mapStyle = isDark 
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"

  const handleClick = () => {
    // Navigate to map view with coordinates
    router.push(`/dashboard/map?lat=${latitude}&lng=${longitude}`)
  }

  return (
    <div 
      className={`relative w-full h-48 rounded-xl overflow-hidden cursor-pointer border shadow-sm ${className || ''}`}
      onClick={handleClick}
      title="Click to view on map"
    >
      <div className="absolute inset-0 z-10 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
        <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
          <MapPin className="w-4 h-4" />
          View on Map
        </div>
      </div>
      <Map
        ref={mapRef}
        center={[longitude, latitude]}
        zoom={14}
        interactive={false}
        styles={{ light: mapStyle, dark: mapStyle }}
        className="w-full h-full pointer-events-none"
      >
        <MapMarker longitude={longitude} latitude={latitude}>
          <MarkerContent>
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </MarkerContent>
        </MapMarker>
      </Map>
    </div>
  )
}
