/**
 * World Heat Map Component
 * Interactive alumni discovery map with role-based functionality
 * 
 * Alumni: Can drill-down to individual profiles and connect
 * Admin: Aggregate view only - no individual data access
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, Users, MapPin, ZoomIn, ZoomOut, Filter, 
  X, UserPlus, Building2, GraduationCap, Briefcase,
  RefreshCw, Info, Eye, EyeOff, Loader2, ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  heatmapApi, 
  HeatmapCluster, 
  AlumniMarker, 
  HeatmapFilters,
  ViewportBounds,
  getClusterSize
} from '@/api/heatmap';

// Constants
const DRILLDOWN_ZOOM_THRESHOLD = 10; // Zoom level at which we switch to individual markers
const INITIAL_CENTER: [number, number] = [20, 0]; // World center
const INITIAL_ZOOM = 2;

interface WorldHeatMapProps {
  className?: string;
}

const WorldHeatMap = ({ className = '' }: WorldHeatMapProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [bounds, setBounds] = useState<ViewportBounds | null>(null);
  
  // Data state
  const [clusters, setClusters] = useState<HeatmapCluster[]>([]);
  const [alumni, setAlumni] = useState<AlumniMarker[]>([]);
  const [stats, setStats] = useState<{ total: number; countries: number } | null>(null);
  const [filters, setFilters] = useState<HeatmapFilters | null>(null);
  
  // Loading state
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [isLoadingAlumni, setIsLoadingAlumni] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filter state
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Drill-down state
  const [selectedCluster, setSelectedCluster] = useState<HeatmapCluster | null>(null);
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniMarker | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [hasMoreAlumni, setHasMoreAlumni] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Determine if we should show drill-down (individual markers)
  const showDrilldown = useMemo(() => {
    return !isAdmin && zoom >= DRILLDOWN_ZOOM_THRESHOLD;
  }, [isAdmin, zoom]);

  // Load filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filtersData = await heatmapApi.getFilters();
        setFilters(filtersData);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await heatmapApi.getStats(selectedUniversity || undefined);
        setStats({
          total: statsData.total_discoverable,
          countries: statsData.top_countries.length
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    loadStats();
  }, [selectedUniversity]);

  // Load aggregate data
  const loadAggregateData = useCallback(async () => {
    setIsLoadingClusters(true);
    try {
      const data = await heatmapApi.getAggregate({
        zoom,
        bounds: bounds || undefined,
        university_id: selectedUniversity || undefined,
        graduation_year: selectedYear ? parseInt(selectedYear) : undefined,
        country: selectedCountry || undefined,
        major: selectedMajor || undefined,
      });
      setClusters(data.clusters);
    } catch (error: any) {
      console.error('Failed to load heatmap data:', error);
      toast({
        title: 'Error loading map data',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClusters(false);
    }
  }, [zoom, bounds, selectedUniversity, selectedYear, selectedCountry, selectedMajor, toast]);

  // Load drill-down data (Alumni only)
  const loadDrilldownData = useCallback(async (geohash?: string, page: number = 1) => {
    if (isAdmin) return; // Admin cannot access drill-down
    
    if (page === 1) {
      setIsLoadingAlumni(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const data = await heatmapApi.getDrilldown({
        geohash,
        bounds: bounds || undefined,
        university_id: selectedUniversity || undefined,
        graduation_year: selectedYear ? parseInt(selectedYear) : undefined,
        country: selectedCountry || undefined,
        major: selectedMajor || undefined,
        page,
        page_size: 50,
      });
      
      if (page === 1) {
        setAlumni(data.alumni);
      } else {
        setAlumni(prev => [...prev, ...data.alumni]);
      }
      setHasMoreAlumni(data.has_more);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Failed to load alumni data:', error);
      // Don't show error for 403 (expected for admins)
      if (error.message?.includes('403')) {
        return;
      }
      toast({
        title: 'Error loading alumni',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAlumni(false);
      setIsLoadingMore(false);
    }
  }, [isAdmin, bounds, selectedUniversity, selectedYear, selectedCountry, selectedMajor, toast]);

  // Effect to load data when zoom/bounds change
  useEffect(() => {
    if (showDrilldown) {
      loadDrilldownData();
    } else {
      loadAggregateData();
    }
  }, [showDrilldown, loadAggregateData, loadDrilldownData]);

  // Handle cluster click
  const handleClusterClick = (cluster: HeatmapCluster) => {
    if (isAdmin) {
      // Admin just sees count info
      toast({
        title: `${cluster.count} Alumni`,
        description: 'Zoom in to see regional distribution',
      });
    } else {
      // Alumni can drill down
      setSelectedCluster(cluster);
      setCurrentPage(1);
      loadDrilldownData(cluster.geohash, 1);
      setIsSidePanelOpen(true);
    }
  };

  // Handle alumni click
  const handleAlumniClick = (alumniMember: AlumniMarker) => {
    setSelectedAlumni(alumniMember);
  };

  // Handle connect
  const handleConnect = (alumniId: string) => {
    // Navigate to profile or open connection modal
    window.location.href = `/alumni/${alumniId}`;
  };

  // Load more alumni
  const handleLoadMore = () => {
    if (hasMoreAlumni && !isLoadingMore) {
      loadDrilldownData(selectedCluster?.geohash, currentPage + 1);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedUniversity('');
    setSelectedYear('');
    setSelectedCountry('');
    setSelectedMajor('');
  };

  const hasActiveFilters = selectedUniversity || selectedYear || selectedCountry || selectedMajor;

  // Get max count for intensity calculation
  const maxCount = useMemo(() => {
    if (clusters.length === 0) return 1;
    return Math.max(...clusters.map(c => c.count));
  }, [clusters]);

  // Render cluster marker
  const renderClusterMarker = (cluster: HeatmapCluster) => {
    const size = getClusterSize(cluster.count);
    const intensity = Math.min(cluster.count / maxCount, 1);
    
    // Color gradient from green to red
    const hue = (1 - intensity) * 120; // 120 = green, 0 = red
    const color = `hsl(${hue}, 80%, 50%)`;
    
    return (
      <div
        key={cluster.geohash}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          border: '3px solid white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => handleClusterClick(cluster)}
      >
        <span className="text-white font-bold text-xs drop-shadow">
          {cluster.count > 999 ? `${(cluster.count / 1000).toFixed(1)}k` : cluster.count}
        </span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <Card className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Alumni World Map
                {isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    Aggregate View
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stats ? (
                  <>
                    {stats.total.toLocaleString()} discoverable alumni across {stats.countries} countries
                  </>
                ) : (
                  'Loading statistics...'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen(true)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {[selectedUniversity, selectedYear, selectedCountry, selectedMajor].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => showDrilldown ? loadDrilldownData() : loadAggregateData()}
              disabled={isLoadingClusters || isLoadingAlumni}
            >
              <RefreshCw className={`w-4 h-4 ${(isLoadingClusters || isLoadingAlumni) ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Zoom guidance for Alumni */}
        {!isAdmin && zoom < DRILLDOWN_ZOOM_THRESHOLD && (
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Tip:</strong> Zoom in to discover and connect with alumni nearby
            </p>
          </div>
        )}

        {/* Admin restriction notice */}
        {isAdmin && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Admin View:</strong> You can only see aggregate data. Individual alumni profiles are not accessible.
            </p>
          </div>
        )}
      </Card>

      {/* Map Container */}
      <Card className="relative overflow-hidden" style={{ height: '600px' }}>
        {/* Loading overlay */}
        {(isLoadingClusters || isLoadingAlumni) && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading map data...</span>
            </div>
          </div>
        )}

        {/* Map placeholder - In production, replace with actual Leaflet/Mapbox map */}
        <div 
          ref={mapContainerRef}
          className="w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative"
        >
          {/* World map background pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 1000 500" className="w-full h-full">
              <path
                d="M100,200 Q200,150 300,200 T500,180 T700,220 T900,200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white"
              />
              <circle cx="200" cy="180" r="5" fill="currentColor" className="text-green-400" />
              <circle cx="400" cy="200" r="8" fill="currentColor" className="text-yellow-400" />
              <circle cx="600" cy="170" r="6" fill="currentColor" className="text-orange-400" />
              <circle cx="800" cy="190" r="10" fill="currentColor" className="text-red-400" />
            </svg>
          </div>

          {/* Cluster visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full p-8">
              {clusters.length === 0 && !isLoadingClusters ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No alumni data in this region</p>
                    <p className="text-sm">Try adjusting filters or zoom out</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 h-full">
                  {clusters.slice(0, 16).map((cluster, idx) => (
                    <div
                      key={cluster.geohash}
                      className="flex items-center justify-center"
                      style={{
                        gridColumn: (idx % 4) + 1,
                        gridRow: Math.floor(idx / 4) + 1,
                      }}
                    >
                      {renderClusterMarker(cluster)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setZoom(z => Math.min(z + 1, 18))}
              className="w-10 h-10 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setZoom(z => Math.max(z - 1, 1))}
              className="w-10 h-10 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom level indicator */}
          <div className="absolute left-4 bottom-4 bg-black/50 text-white px-3 py-1 rounded text-sm z-10">
            Zoom: {zoom}x {showDrilldown && !isAdmin && <span className="text-green-400">(Individual view)</span>}
          </div>
        </div>

        {/* Note about Leaflet integration */}
        <div className="absolute bottom-4 right-4 z-10">
          <Badge variant="secondary" className="bg-black/50 text-white border-none">
            Install react-leaflet for full map functionality
          </Badge>
        </div>
      </Card>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Alumni</DialogTitle>
            <DialogDescription>
              Narrow down the map view with these filters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* University filter */}
            {filters?.universities && filters.universities.length > 0 && (
              <div className="space-y-2">
                <Label>University</Label>
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Universities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Universities</SelectItem>
                    {filters.universities.map(uni => (
                      <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Graduation year filter */}
            {filters?.graduation_years && filters.graduation_years.length > 0 && (
              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Years</SelectItem>
                    {filters.graduation_years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Country filter */}
            {filters?.countries && filters.countries.length > 0 && (
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    {filters.countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Major filter */}
            {filters?.majors && filters.majors.length > 0 && (
              <div className="space-y-2">
                <Label>Major / Program</Label>
                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Majors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Majors</SelectItem>
                    {filters.majors.map(major => (
                      <SelectItem key={major} value={major}>{major}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear All
              </Button>
              <Button onClick={() => setIsFilterOpen(false)} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Side Panel for Alumni List (Alumni only) */}
      <Sheet open={isSidePanelOpen} onOpenChange={setIsSidePanelOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Alumni in this Area
              {selectedCluster && (
                <Badge variant="secondary">{selectedCluster.count}</Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              Click on an alumni to view their profile or send a connection request
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)] mt-4 -mx-6 px-6">
            {isLoadingAlumni ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : alumni.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No alumni found in this area</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alumni.map(alumniMember => (
                  <Card
                    key={alumniMember.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleAlumniClick(alumniMember)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={alumniMember.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-white">
                          {alumniMember.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{alumniMember.name}</h4>
                        
                        {(alumniMember.job_title || alumniMember.company) && (
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {alumniMember.job_title}{alumniMember.company && ` at ${alumniMember.company}`}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {alumniMember.university_name && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              {alumniMember.university_name}
                            </Badge>
                          )}
                          {alumniMember.graduation_year && (
                            <Badge variant="outline" className="text-xs">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {alumniMember.graduation_year}
                            </Badge>
                          )}
                        </div>
                        
                        {(alumniMember.city || alumniMember.country) && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[alumniMember.city, alumniMember.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(alumniMember.id);
                        }}
                        className="flex-shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {/* Load more button */}
                {hasMoreAlumni && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Alumni Detail Modal */}
      <Dialog open={!!selectedAlumni} onOpenChange={() => setSelectedAlumni(null)}>
        <DialogContent className="max-w-md">
          {selectedAlumni && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedAlumni.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-white text-xl">
                      {selectedAlumni.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedAlumni.name}</DialogTitle>
                    <DialogDescription>
                      {selectedAlumni.job_title}{selectedAlumni.company && ` at ${selectedAlumni.company}`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {selectedAlumni.university_name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">University</p>
                      <p className="font-medium">{selectedAlumni.university_name}</p>
                    </div>
                  </div>
                )}

                {selectedAlumni.major && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Major / Program</p>
                      <p className="font-medium">{selectedAlumni.major}</p>
                    </div>
                  </div>
                )}

                {selectedAlumni.graduation_year && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Graduation Year</p>
                      <p className="font-medium">{selectedAlumni.graduation_year}</p>
                    </div>
                  </div>
                )}

                {(selectedAlumni.city || selectedAlumni.country) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {[selectedAlumni.city, selectedAlumni.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = `/alumni/${selectedAlumni.id}`}
                  >
                    View Profile
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleConnect(selectedAlumni.id)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorldHeatMap;

