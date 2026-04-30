"use client"

import { useEffect } from 'react'
import { useMap } from '@/components/ui/map'
import { MapIssue } from '@/lib/api/map'

export function HeatmapLayer({ issues }: { issues: MapIssue[] }) {
  const mapContext = useMap()
  const map = mapContext?.map // The internal MapLibre instance from mapcn's context

  useEffect(() => {
    if (!map) return

    const addOrUpdateHeatmap = () => {
      const geojson: any = {
        type: 'FeatureCollection',
        features: issues.map(issue => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [issue.longitude, issue.latitude] },
          properties: { 
            // Give higher weights to critical/high priority issues
            weight: issue.priority === 'critical' ? 4 : issue.priority === 'high' ? 3 : issue.priority === 'medium' ? 2 : 1 
          }
        }))
      }

      if (map.getSource('issues-heatmap')) {
        (map.getSource('issues-heatmap') as any).setData(geojson)
      } else {
        map.addSource('issues-heatmap', {
          type: 'geojson',
          data: geojson
        })
        
        map.addLayer({
          id: 'issues-heatmap-layer',
          type: 'heatmap',
          source: 'issues-heatmap',
          paint: {
            // Increase the heatmap weight based on frequency and property weight
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'weight'],
              1, 0.5,
              4, 2
            ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,255,0)',
              0.2, 'royalblue',
              0.4, 'cyan',
              0.6, 'lime',
              0.8, 'yellow',
              1, 'red'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              9, 20,
              15, 40
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, 1,
              18, 0.3
            ]
          }
        })
      }
    }

    // Wait until map style is loaded
    if (map.isStyleLoaded()) {
      addOrUpdateHeatmap()
    } else {
      map.once('styledata', addOrUpdateHeatmap)
    }

    return () => {
      if (map && map.getStyle()) {
        if (map.getLayer('issues-heatmap-layer')) map.removeLayer('issues-heatmap-layer')
        if (map.getSource('issues-heatmap')) map.removeSource('issues-heatmap')
      }
    }
  }, [map, issues])

  return null
}
