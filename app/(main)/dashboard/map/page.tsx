import { MapView } from "@/components/map/MapView"

export const metadata = {
  title: 'Interactive Map - CivicIssue',
  description: 'View reported civic issues and heatmaps across your city.',
}

export default function MapPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <MapView />
    </div>
  )
}
