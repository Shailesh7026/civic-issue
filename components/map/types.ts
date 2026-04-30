import { ComponentType } from "react"
import { MapIssue } from "@/lib/api/map"

export interface MapModeConfig {
  id: string
  label: string
  previewImage: string
  component: ComponentType<any>
  legend?: ComponentType<any>
}

export interface MapState {
  mode: string
  issues: MapIssue[]
  isLoading: boolean
  bbox: { south: number; north: number; west: number; east: number } | null
}
