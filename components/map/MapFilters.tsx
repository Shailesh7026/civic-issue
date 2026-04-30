"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Map as MapIcon, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Layers } from "lucide-react"

const CATEGORIES = [
  'Road & Infrastructure', 'Water Supply', 'Electricity', 
  'Sanitation & Waste', 'Public Safety', 'Parks & Recreation', 
  'Noise Pollution', 'Other'
]

export function MapFilters({ 
  mapType, setMapType,
  search, setSearch,
  selectedCategories, setSelectedCategories,
  selectedStatus, setSelectedStatus
}: { 
  mapType: string; setMapType: (type: string) => void;
  search: string; setSearch: (s: string) => void;
  selectedCategories: string[]; setSelectedCategories: (c: string[]) => void;
  selectedStatus: string[]; setSelectedStatus: (s: string[]) => void;
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const toggleCategory = (cat: string) => {
    setSelectedCategories(
      selectedCategories.includes(cat)
        ? selectedCategories.filter((c) => c !== cat)
        : [...selectedCategories, cat]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatus(
      selectedStatus.includes(status)
        ? selectedStatus.filter((s) => s !== status)
        : [...selectedStatus, status]
    )
  }

  const FilterContent = () => (
    <div className="flex flex-col gap-6 py-4">
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Status</h4>
        <div className="flex flex-wrap gap-2">
          {['Open', 'In Progress', 'Resolved'].map(status => (
            <Badge
              key={status}
              variant={selectedStatus.includes(status.toLowerCase()) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleStatus(status.toLowerCase())}
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Categories</h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategories.includes(cat) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <Button className="w-full mt-2" onClick={() => setOpen(false)}>
        Apply Filters
      </Button>
    </div>
  )

  return (
    <div className="flex items-center gap-2 max-w-[calc(100vw-2rem)] w-[350px]">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input 
          className="pl-9 pr-24 h-12 bg-background/90 backdrop-blur-md border-border/50 shadow-lg rounded-2xl" 
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {/* Map Type Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                <Layers className="w-4 h-4 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={() => setMapType('default')}>
                Default (Carto)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType('osm')}>
                OpenStreetMap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType('satellite')}>
                Satellite View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType('osm3d')}>
                3D View (Liberty)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Trigger */}
          {isMobile ? (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <button className="p-1.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                  <SlidersHorizontal className="w-4 h-4 text-foreground" />
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>Filter Map</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-8">
                  <FilterContent />
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="p-1.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                  <SlidersHorizontal className="w-4 h-4 text-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Map</DialogTitle>
                </DialogHeader>
                <FilterContent />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}
