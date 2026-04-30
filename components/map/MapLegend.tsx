"use client"

export function MapLegend({ mode }: { mode: string }) {
  if (mode === 'heatmap') {
    return (
      <div className="absolute bottom-32 left-4 z-10 bg-background/90 backdrop-blur-md p-3 rounded-2xl border shadow-lg w-48 animate-in fade-in slide-in-from-bottom-4">
        <h4 className="text-xs font-bold mb-2 uppercase text-muted-foreground tracking-wider">Density Heatmap</h4>
        <div className="w-full h-3 rounded-full bg-gradient-to-r from-blue-500 via-lime-400 to-red-600 mb-1" />
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    )
  }

  // Issues Mode Legend
  return (
    <div className="absolute bottom-32 left-4 z-10 bg-background/90 backdrop-blur-md p-3 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-bottom-4">
      <h4 className="text-xs font-bold mb-2 uppercase text-muted-foreground tracking-wider">Issue Priority</h4>
      <div className="space-y-1.5 text-xs font-medium">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-sm" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-sm" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm" />
          <span>Low</span>
        </div>
      </div>
    </div>
  )
}
