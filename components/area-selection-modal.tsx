'use client'

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUserStore } from "@/store/useUserStore"
import { getAvailableAreas, joinAreas } from "@/app/actions/areas"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"
import { toast } from "sonner"

export function AreaSelectionModal() {
  const { user, profile, memberships, isHydrated, setMemberships } = useUserStore()
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const [areas, setAreas] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    // Only prompt for members who haven't selected an area yet during this session
    if (isHydrated && user && profile && memberships.length === 0) {
      setOpen(true)
      getAvailableAreas().then(res => {
        if (res.success && res.data) {
          setAreas(res.data)
        }
      })
    }
  }, [isHydrated, user, profile, memberships.length])

  const toggleArea = (id: string) => {
    setSelectedAreas(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selectedAreas.length === 0) {
      toast.error("Please select at least one area to follow")
      return
    }
    
    setIsLoading(true)
    const res = await joinAreas(selectedAreas)
    setIsLoading(false)

    if (res.success) {
      toast.success("Successfully joined areas!")
      setOpen(false)
      // Optimistically update local state to hide prompt permanently without full refresh
      setMemberships(selectedAreas.map(area_id => ({ 
        id: crypto.randomUUID(), 
        area_id, 
        role: 'member' 
      })))
    } else {
      toast.error(res.error || "Failed to join areas")
    }
  }

  const filteredAreas = areas.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  const ModalContent = () => (
    <div className="flex flex-col gap-4 py-2 sm:py-4 h-full max-h-full">
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search localities or cities" 
          className="pl-9 bg-background"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto p-1 grow shrink" style={{ minHeight: '30vh' }}>
        {filteredAreas.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground col-span-full py-8">
            {areas.length === 0 ? "Loading areas..." : "No areas found matching your search."}
          </p>
        ) : (
          filteredAreas.map((area) => (
            <div 
              key={area.id}
              onClick={() => toggleArea(area.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAreas.includes(area.id) 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'hover:border-foreground/20 bg-background'
              }`}
            >
              <div className="p-2 bg-muted rounded-full shrink-0">
                <MapPin className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-sm truncate">{area.name}</span>
                <span className="text-xs text-muted-foreground truncate">{area.type || 'Locality'}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 pt-4 border-t flex justify-end shrink-0">
        <Button onClick={handleSubmit} disabled={isLoading || selectedAreas.length === 0} className="w-full sm:w-auto">
          {isLoading ? "Joining..." : `Follow ${selectedAreas.length} Area${selectedAreas.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  )

  // Drawer overrides standard interactive behaviors so the user must select an area.
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerContent className="h-[90vh] px-4">
          <DrawerHeader className="px-0 pt-4 text-left">
            <DrawerTitle>Where do you live?</DrawerTitle>
            <DrawerDescription>
              Select your local areas to personalize your community feed.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden pointer-events-auto">
             <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Welcome to CivicIssue</DialogTitle>
          <DialogDescription>
            Let's get your feed set up. Select areas you care about to stay updated.
          </DialogDescription>
        </DialogHeader>
        <ModalContent />
      </DialogContent>
    </Dialog>
  )
}
