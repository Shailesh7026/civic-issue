import { MapModeConfig } from './types'

export const MAP_MODES: Record<string, MapModeConfig> = {
  issues: {
    id: 'issues',
    label: 'Issues',
    previewImage: '/assets/map-modes/issues.png',
    component: () => null,
  },
  heatmap: {
    id: 'heatmap',
    label: 'Heatmap',
    previewImage: '/assets/map-modes/heatmap.png',
    component: () => null,
  }
}
