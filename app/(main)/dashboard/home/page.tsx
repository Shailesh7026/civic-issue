"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Search,
    Plus,
    Users,
    Compass,
    Sparkles,
    MapPin,
    Activity,
    SlidersHorizontal,
    X,
    Flame,
    Clock,
    AlertCircle,
    Map as MapIcon,
    Droplet,
    Zap,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserStore } from "@/store/useUserStore";
import { getIssuesFeed, getFollowedIssuesFeed, getFollowedAreaIds } from "@/lib/api/community";
import { Post } from "@/components/community/post";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { IconShieldFilled } from "@tabler/icons-react";


const CATEGORIES = [
    { name: "Road", icon: MapPin },
    { name: "Water", icon: Droplet },
    { name: "Electricity", icon: Zap },
    { name: "Safety", icon: IconShieldFilled },
    { name: "Sanitation", icon: Sparkles },
    { name: "Other", icon: Activity },
];

const ADVANCED_FILTERS = [
    { id: "trending", icon: Flame, label: "Trending", desc: "Upvotes + recency" },
    { id: "latest", icon: Clock, label: "Latest", desc: "Most recently reported" },
    { id: "unresolved", icon: AlertCircle, label: "Unresolved", desc: "Old open issues" },
    { id: "nearby", icon: MapIcon, label: "Nearby", desc: "Close to your location" },
];

type Tab = "discover" | "following";

export default function CommunityPageContent() {
    const router = useRouter();
    const { user, profile, isHydrated, memberships } = useUserStore();
    const isMobile = useIsMobile();

    const [activeTab, setActiveTab] = useState<Tab>("discover");
    
    // Core search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    
    // Cacheable selected filters
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [activeAdvancedFilter, setActiveAdvancedFilter] = useState<string | null>(null);

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Data lists
    const [issues, setIssues] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Followed areas sidebar
    const SIDEBAR_CACHE_KEY = 'civic_home_followed_areas'
    const [followedAreas, setFollowedAreas] = useState<any[]>([]);
    const [areasLoading, setAreasLoading] = useState(true);

    // Initialize from cache (client side only)
    useEffect(() => {
        const savedCats = localStorage.getItem('civicFiltersCats');
        const savedAdv = localStorage.getItem('civicFiltersAdv');
        if (savedCats) setSelectedCategories(JSON.parse(savedCats));
        if (savedAdv) setActiveAdvancedFilter(savedAdv);
    }, []);

    // Fetch followed areas for sidebar (with session cache, invalidated by community page)
    useEffect(() => {
        if (!isHydrated || !profile?.id) return;
        const COMM_CACHE = 'civic_communities_cache';

        // Try session cache first (the community page writes/invalidates this key)
        const raw = sessionStorage.getItem(SIDEBAR_CACHE_KEY);
        if (raw) {
            try {
                const { data, ts } = JSON.parse(raw);
                if (Date.now() - ts < 5 * 60 * 1000) {
                    setFollowedAreas(data);
                    setAreasLoading(false);
                    return;
                }
            } catch {}
        }

        getFollowedAreaIds(profile.id).then(data => {
            const list = data || [];
            setFollowedAreas(list);
            setAreasLoading(false);
            try {
                sessionStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() }));
            } catch {}
        });
    }, [isHydrated, profile?.id]);

    // Save to cache when filters change
    useEffect(() => {
        localStorage.setItem('civicFiltersCats', JSON.stringify(selectedCategories));
        if (activeAdvancedFilter) {
            localStorage.setItem('civicFiltersAdv', activeAdvancedFilter);
        } else {
            localStorage.removeItem('civicFiltersAdv');
        }
    }, [selectedCategories, activeAdvancedFilter]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        if (!isHydrated) return;
        if (!user) {
            router.replace("/auth/login");
            return;
        }

        let isMounted = true;
        
        async function fetchFeed() {
            setIsLoading(true);
            
            // Build the compound search if categories exist.
            // Since Supabase RPC doesn't accept category natively yet,
            // we will pass the selected categories appended to the search to simulate filtering via description or title match
            let finalSearch = debouncedSearch;
            if (selectedCategories.length > 0) {
                finalSearch += " " + selectedCategories.join(" ");
            }
            finalSearch = finalSearch.trim();

            // Handle the advanced filters logically mapping to what backend exposes right now
            let orderBy: "new" | "popular" = "new";
            if (activeAdvancedFilter === "trending") orderBy = "popular";
            if (activeAdvancedFilter === "latest") orderBy = "new";

            let data;
            if (activeTab === "discover") {
                data = await getIssuesFeed({
                    areaId: null, // "All public issues" based on RPC defaults
                    search: finalSearch,
                    orderBy,
                    limit: 15
                });
            } else {
                data = await getFollowedIssuesFeed({
                    search: finalSearch,
                    orderBy,
                    limit: 15
                });
            }

            if (!isMounted) return;

            // Handle "Unresolved" filter client-side mock since our queries right now return all statuses
            if (activeAdvancedFilter === "unresolved" && data) {
                data = data.filter((d: any) => d.status === "open" || d.status === "in_progress");
            }
            
            setIssues(data || []);
            setIsLoading(false);
        }

        fetchFeed();
        
        return () => { isMounted = false; };
    }, [isHydrated, user, activeTab, debouncedSearch, selectedCategories, activeAdvancedFilter, router]);

    const toggleCategory = (name: string) => {
        setSelectedCategories((prev) =>
            prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setActiveAdvancedFilter(null);
        setSearchQuery("");
    };

    const FilterContent = () => (
        <div className="flex flex-col gap-6 py-4">
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground/80">Sort & View</h4>
                <div className="grid grid-cols-2 gap-2">
                    {ADVANCED_FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setActiveAdvancedFilter(prev => prev === f.id ? null : f.id)}
                            className={cn(
                                "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                                activeAdvancedFilter === f.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            <span className="flex flex-row items-center gap-2 font-bold text-sm tracking-tight">
                                <f.icon className="w-3.5 h-3.5" />{f.label}
                            </span>
                            <span className={cn("text-[10px]", activeAdvancedFilter === f.id ? "text-primary-foreground/80" : "text-muted-foreground/70")}>{f.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground/80">Issue Category</h4>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => toggleCategory(cat.name)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                                selectedCategories.includes(cat.name)
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                            )}
                        >
                            <cat.icon className="w-3.5 h-3.5" />
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center mt-auto">
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground text-sm">
                    Clear All
                </Button>
                <Button onClick={() => setIsFilterOpen(false)} className="px-6">
                    Apply Filters
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex overflow-hidden">
           
            <div className="space-y-8 w-full min-w-0 max-w-3xl mx-auto px-0 md:px-4 pb-12">
                {/* Tabs & Search controls */}
                <div className="space-y-4">
                    <div className="flex items-center gap-1 bg-muted rounded-xl p-1 overflow-x-auto w-full md:w-fit">
                        {[
                            { id: "discover" as Tab, label: "Discover", icon: Compass },
                            { id: "following" as Tab, label: "Following", icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap w-full md:w-fit flex-1 cursor-pointer",
                                    activeTab === tab.id
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search issues, titles or descriptions..."
                                className="pl-10 pr-12 h-11 bg-card rounded-xl border-border"
                            />
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setIsFilterOpen(true)}
                                  className={cn(
                                      "h-8 w-8 rounded-xl transition-colors", 
                                      (selectedCategories.length > 0 || activeAdvancedFilter) 
                                        ? "bg-primary/10 text-primary hover:bg-primary/20" 
                                        : "text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Selected Filters Pill Strip */}
                        {(selectedCategories.length > 0 || activeAdvancedFilter) && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-muted-foreground font-medium mr-1">Active Filters:</span>
                                
                                {activeAdvancedFilter && ADVANCED_FILTERS.find(f => f.id === activeAdvancedFilter)?.label && (
                                   <Badge variant="secondary" className="px-2.5 py-1 rounded-full gap-1.5 bg-primary/10 text-primary border-0 font-semibold tracking-tight">
                                       {ADVANCED_FILTERS.find(f => f.id === activeAdvancedFilter)?.label}
                                       <button onClick={() => setActiveAdvancedFilter(null)} className="ml-0.5 hover:text-primary/70">
                                          <X className="w-3 h-3" />
                                       </button>
                                   </Badge>
                                )}

                                {selectedCategories.map(cat => {
                                    const categoryDef = CATEGORIES.find(c => c.name === cat);
                                    const Icon = categoryDef?.icon || MapPin;
                                    return (
                                        <Badge key={cat} variant="outline" className="px-2.5 py-1 rounded-full gap-1.5 border-border bg-card">
                                            <Icon className="w-3 h-3 text-muted-foreground" />
                                            {cat}
                                            <button onClick={() => toggleCategory(cat)} className="ml-0.5 text-muted-foreground hover:text-foreground">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    )
                                })}

                                <button onClick={clearFilters} className="text-xs font-semibold text-muted-foreground hover:underline ml-1">
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feed Result */}
                <div className="space-y-5">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-border bg-card shadow w-[85vw] lg:w-[40vw] md:w-[65vw]">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex flex-col gap-1.5">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-8 h-8 rounded-md" />
                                </div>
                                
                                {/* Content */}
                                <div className="space-y-2 px-4 py-2">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <div className="flex gap-2 mb-2">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="w-full aspect-video max-h-72 rounded-md mb-3" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                                
                                {/* Footer */}
                                <div className="flex items-center gap-2 px-4 pb-4 pt-2 border-t mt-2">
                                    <Skeleton className="h-8 w-16 rounded-md" />
                                    <Skeleton className="h-8 w-16 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        ))
                    ) : issues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
                                <Compass className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                                {debouncedSearch || selectedCategories.length > 0 || activeAdvancedFilter
                                    ? "No matching issues found"
                                    : activeTab === "following" ? "No issues in tracked areas" : "No issues available"}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-xs mb-6">
                                {(debouncedSearch || selectedCategories.length > 0 || activeAdvancedFilter)
                                    ? "Try broadening your search or clearing active filters."
                                    : "Be the first to report an issue and bring attention to your local concerns!"}
                            </p>
                            <Button
                                onClick={() => router.push("/report-issue")}
                                className="h-10 rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Report an Issue
                            </Button>
                        </div>
                    ) : (
                        issues.map((issue) => (
                            <Post key={issue.id} issue={issue} />
                        ))
                    )}
                </div>

            </div>

            {/* Followed Communities Sidebar */}
            <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
                <div className="sticky top-20 bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Following
                        </h3>
                        <button
                            onClick={() => router.push('/dashboard/community')}
                            className="text-[11px] text-primary font-semibold hover:underline"
                        >
                            Manage
                        </button>
                    </div>

                    {areasLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2 p-1.5">
                                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-3/4 rounded" />
                                        <Skeleton className="h-2.5 w-1/2 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : followedAreas.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground mb-3">No communities followed yet.</p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs rounded-xl h-8"
                                onClick={() => router.push('/dashboard/community')}
                            >
                                Explore Communities
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {followedAreas.slice(0, 8).map((m: any) => (
                                <button
                                    key={m.area_id}
                                    onClick={() => router.push('/dashboard/community')}
                                    className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-muted/60 transition-colors group text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-[10px]">
                                        {(m.areas?.name || '??').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{m.areas?.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.areas?.type}</p>
                                    </div>
                                </button>
                            ))}
                            {followedAreas.length > 8 && (
                                <button
                                    onClick={() => router.push('/dashboard/community')}
                                    className="w-full text-[11px] text-muted-foreground hover:text-primary font-semibold text-center pt-2 hover:underline transition-colors"
                                >
                                    +{followedAreas.length - 8} more
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Global Settings/Filters Drawer Map */}
            {isMobile ? (
                <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <DrawerContent className="px-4 pb-6">
                        <DrawerHeader className="px-0 text-left">
                            <DrawerTitle>Filters</DrawerTitle>
                            <DrawerDescription>
                                Refine issues displayed in your feed
                            </DrawerDescription>
                        </DrawerHeader>
                        <FilterContent />
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>Filter Issues</DialogTitle>
                            <DialogDescription>
                                Refine the civic issues displayed in your feed.
                            </DialogDescription>
                        </DialogHeader>
                        <FilterContent />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
