/**
 * World Map Heatmap Component
 * Interactive 3D alumni distribution map with role-based functionality
 * 
 * Alumni: Can drill-down to individual profiles and connect
 * Admin: Aggregate view only - no individual data access
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, Users, Briefcase, GraduationCap, Loader2, 
  UserPlus, Building2, Eye, EyeOff, RefreshCw, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { heatmapApi, HeatmapCluster, AlumniMarker } from '@/api/heatmap';
import { AlumniLocation, getAlumniByLocation } from '@/data/alumniLocations';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WorldMapHeatmapProps {
  universityId?: string;
  title?: string;
  height?: string;
  useBackendData?: boolean; // If true, use backend API; if false, use mock data
}

interface LocationData {
  lng: number;
  lat: number;
  alumni: AlumniLocation[];
  count: number;
  city: string;
  country: string;
  geohash?: string;
}

// CARTO Dark Matter basemap (free, no API key needed)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Create a circular polygon around a point (for 3D extrusion)
const createCirclePolygon = (lng: number, lat: number, radiusKm: number, numSides: number = 16) => {
  const coords: [number, number][] = [];
  const earthRadius = 6371; // km
  
  for (let i = 0; i <= numSides; i++) {
    const angle = (i / numSides) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);
    
    const newLat = lat + (dy / earthRadius) * (180 / Math.PI);
    const newLng = lng + (dx / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    
    coords.push([newLng, newLat]);
  }
  
  return coords;
};

// Detail Modal Component for Alumni
const AlumniDetailModal = ({ 
  open, 
  onOpenChange, 
  alumni, 
  location,
  isAdmin,
  onConnect
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  alumni: (AlumniLocation | AlumniMarker)[] | null;
  location: string;
  isAdmin: boolean;
  onConnect?: (id: string) => void;
}) => {
  if (!alumni || !alumni.length) return null;

  // Admin can only see count, not individual data
  if (isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{location}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4" />
                  {alumni.length} Alumni in this location
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <EyeOff className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                <p className="font-medium">Admin View - Aggregate Only</p>
                <p className="mt-1 text-xs">
                  As an administrator, you can see alumni counts by location but cannot access individual profiles. 
                  This protects alumni privacy.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">{location}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4" />
                {alumni.length} {alumni.length === 1 ? 'Alumni' : 'Alumni'} in this location
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3 mt-4">
            {alumni.map((person) => {
              const isApiData = 'university_name' in person;
              const name = person.name;
              const major = isApiData ? (person as AlumniMarker).major : (person as AlumniLocation).major;
              const graduationYear = isApiData ? (person as AlumniMarker).graduation_year : (person as AlumniLocation).graduationYear;
              const jobTitle = isApiData ? (person as AlumniMarker).job_title : (person as AlumniLocation).currentPosition;
              const company = isApiData ? (person as AlumniMarker).company : (person as AlumniLocation).company;
              const universityName = isApiData ? (person as AlumniMarker).university_name : undefined;
              const avatar = isApiData ? (person as AlumniMarker).avatar : undefined;
              const id = person.id;
              
              return (
                <Card key={id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-white text-sm">
                          {name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg mb-1.5 truncate">{name}</h4>
                        <div className="space-y-1.5">
                          {universityName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{universityName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{major}</span>
                            {graduationYear && (
                              <>
                                <span className="text-muted-foreground/70">•</span>
                                <span>Class of {graduationYear}</span>
                              </>
                            )}
                          </div>
                          {(jobTitle || company) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{jobTitle}</span>
                              {company && (
                                <>
                                  <span className="text-muted-foreground/70">•</span>
                                  <span className="truncate font-medium">{company}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Badge variant="secondary">Alumni</Badge>
                      {onConnect && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onConnect(id)}
                          className="gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const WorldMapHeatmap = ({ 
  universityId, 
  title = "Global Alumni Distribution", 
  height = "600px",
  useBackendData = false
}: WorldMapHeatmapProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<{ 
    alumni: (AlumniLocation | AlumniMarker)[]; 
    location: string;
    geohash?: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  
  // Backend data
  const [apiClusters, setApiClusters] = useState<HeatmapCluster[]>([]);
  const [drilldownAlumni, setDrilldownAlumni] = useState<AlumniMarker[]>([]);

  // Memoize location map for mock data
  const locationMap = useMemo(() => {
    if (useBackendData) return new Map();
    return getAlumniByLocation(universityId || 'MIT');
  }, [universityId, useBackendData]);

  // Process location data from either source
  const locationData: LocationData[] = useMemo(() => {
    if (useBackendData && apiClusters.length > 0) {
      // Use backend API data
      return apiClusters.map(cluster => ({
        lng: cluster.longitude,
        lat: cluster.latitude,
        alumni: [], // Will be loaded on click
        count: cluster.count,
        city: 'Region', // Backend returns geohash-based clusters
        country: '',
        geohash: cluster.geohash,
      }));
    }
    
    // Use mock data
    if (!locationMap || locationMap.size === 0) {
      return [];
    }
    return Array.from(locationMap.entries()).map(([key, alumni]) => {
      const [lat, lng] = key.split(',').map(Number);
      return {
        lng,
        lat,
        alumni,
        count: alumni.length,
        city: alumni[0]?.city || 'Unknown',
        country: alumni[0]?.country || 'Unknown',
      };
    });
  }, [locationMap, useBackendData, apiClusters]);

  const maxCount = useMemo(() => 
    Math.max(...locationData.map(d => d.count), 1), 
    [locationData]
  );

  const totalAlumni = useMemo(() => 
    locationData.reduce((sum, d) => sum + d.count, 0),
    [locationData]
  );

  // Load data from backend
  const loadBackendData = useCallback(async () => {
    if (!useBackendData) return;
    
    setIsRefreshing(true);
    try {
      const data = await heatmapApi.getAggregate({
        zoom: Math.round(zoom),
        university_id: universityId,
      });
      setApiClusters(data.clusters);
    } catch (error: any) {
      console.error('Failed to load heatmap data:', error);
      // Silently fail and use mock data as fallback
    } finally {
      setIsRefreshing(false);
    }
  }, [useBackendData, zoom, universityId]);

  // Load drill-down data (Alumni only)
  const loadDrilldownData = useCallback(async (geohash: string, city: string, country: string) => {
    if (isAdmin) {
      // Admin sees only count
      setSelectedAlumni({
        alumni: Array(apiClusters.find(c => c.geohash === geohash)?.count || 0).fill({ id: '0', name: 'Alumni' }) as AlumniMarker[],
        location: city && country ? `${city}, ${country}` : 'This Region',
        geohash,
      });
      setModalOpen(true);
      return;
    }

    try {
      const data = await heatmapApi.getDrilldown({
        geohash,
        university_id: universityId,
        page: 1,
        page_size: 50,
      });
      
      setDrilldownAlumni(data.alumni);
      setSelectedAlumni({
        alumni: data.alumni,
        location: city && country ? `${city}, ${country}` : 'This Region',
        geohash,
      });
      setModalOpen(true);
    } catch (error: any) {
      // Handle 403 for admin trying to access drill-down
      if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        toast({
          title: 'Access Restricted',
          description: 'Drill-down view is only available to alumni users.',
          variant: 'destructive',
        });
        return;
      }
      console.error('Failed to load alumni data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alumni details',
        variant: 'destructive',
      });
    }
  }, [isAdmin, apiClusters, universityId, toast]);

  // Load backend data on mount and when filters change
  useEffect(() => {
    if (useBackendData) {
      loadBackendData();
    }
  }, [loadBackendData, useBackendData]);

  // Get color based on count (white to pink gradient)
  const getColor = useCallback((count: number) => {
    const ratio = Math.min(count / maxCount, 1);
    const r = 255;
    const g = Math.round(255 - (150 * ratio));
    const b = Math.round(255 - (75 * ratio));
    return `rgb(${r}, ${g}, ${b})`;
  }, [maxCount]);

  // Calculate height based on count
  const getHeight = useCallback((count: number) => {
    const minHeight = 30000;
    const maxHeight = 500000;
    const ratio = Math.pow(count / maxCount, 0.6);
    return minHeight + (maxHeight - minHeight) * ratio;
  }, [maxCount]);

  // Create GeoJSON for 3D columns (polygon-based)
  const createColumnsGeoJSON = useCallback(() => {
    const features = locationData.map((loc, index) => {
      const radiusKm = 30;
      const coordinates = createCirclePolygon(loc.lng, loc.lat, radiusKm, 16);
      
      return {
        type: 'Feature' as const,
        id: index,
        properties: {
          count: loc.count,
          city: loc.city,
          country: loc.country,
          height: getHeight(loc.count),
          color: getColor(loc.count),
          geohash: loc.geohash || '',
          alumniData: JSON.stringify(loc.alumni),
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coordinates],
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [locationData, getHeight, getColor]);

  // Create point GeoJSON for labels
  const createPointsGeoJSON = useCallback(() => {
    return {
      type: 'FeatureCollection' as const,
      features: locationData.map((loc, index) => ({
        type: 'Feature' as const,
        id: index,
        properties: {
          count: loc.count,
          city: loc.city,
          country: loc.country,
          geohash: loc.geohash || '',
          alumniData: JSON.stringify(loc.alumni),
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [loc.lng, loc.lat],
        },
      })),
    };
  }, [locationData]);

  // Handle marker/column click
  const handleLocationClick = useCallback((city: string, country: string, alumniData: string, geohash?: string) => {
    if (useBackendData && geohash) {
      // Load from backend
      loadDrilldownData(geohash, city, country);
    } else {
      // Use mock data
      const alumni = JSON.parse(alumniData);
      setSelectedAlumni({
        alumni,
        location: `${city}, ${country}`,
      });
      setModalOpen(true);
    }
  }, [useBackendData, loadDrilldownData]);

  // Handle connect
  const handleConnect = (alumniId: string) => {
    window.location.href = `/alumni/${alumniId}`;
  };

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [20, 20],
      zoom: 1.5,
      pitch: 50,
      bearing: -15,
    });

    map.current = mapInstance;

    mapInstance.on('load', () => {
      setIsLoading(false);
    });

    mapInstance.on('zoom', () => {
      setZoom(mapInstance.getZoom());
    });

    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Setup map layers
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    const mapInstance = map.current;
    
    if (locationData.length > 0) {
      // Add or update columns source
      if (mapInstance.getSource('alumni-columns')) {
        (mapInstance.getSource('alumni-columns') as maplibregl.GeoJSONSource).setData(createColumnsGeoJSON());
      } else {
        mapInstance.addSource('alumni-columns', {
          type: 'geojson',
          data: createColumnsGeoJSON(),
        });
      }

      // Add or update points source
      if (mapInstance.getSource('alumni-points')) {
        (mapInstance.getSource('alumni-points') as maplibregl.GeoJSONSource).setData(createPointsGeoJSON());
      } else {
        mapInstance.addSource('alumni-points', {
          type: 'geojson',
          data: createPointsGeoJSON(),
        });
      }

      // Add layers if not exist
      if (!mapInstance.getLayer('alumni-columns-3d')) {
        mapInstance.addLayer({
          id: 'alumni-columns-3d',
          type: 'fill-extrusion',
          source: 'alumni-columns',
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.85,
          },
        });
      }

      if (!mapInstance.getLayer('alumni-columns-glow')) {
        mapInstance.addLayer({
          id: 'alumni-columns-glow',
          type: 'fill-extrusion',
          source: 'alumni-columns',
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['*', ['get', 'height'], 1.02],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.3,
          },
        }, 'alumni-columns-3d');
      }

      if (!mapInstance.getLayer('alumni-markers')) {
        mapInstance.addLayer({
          id: 'alumni-markers',
          type: 'circle',
          source: 'alumni-points',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 6, 5, 12, 10, 20],
            'circle-color': 'transparent',
            'circle-stroke-color': 'transparent',
            'circle-stroke-width': 0,
          },
        });

        // Popup
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -10],
          className: 'alumni-popup',
        });

        mapInstance.on('mouseenter', 'alumni-markers', (e) => {
          mapInstance.getCanvas().style.cursor = 'pointer';
          if (e.features && e.features[0]) {
            const coordinates = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
            const { city, count } = e.features[0].properties;
            const locationText = city || 'Region';
            popup
              .setLngLat(coordinates)
              .setHTML(`
                <div style="font-family: system-ui, -apple-system, sans-serif; padding: 8px 12px; background: white; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                  <div style="font-weight: 600; color: #1a1a1a; font-size: 14px;">${locationText}</div>
                  <div style="color: #666; font-size: 12px;">${count.toLocaleString()} Alumni</div>
                  ${isAdmin ? '<div style="color: #999; font-size: 10px; margin-top: 4px;">Admin: Aggregate view only</div>' : '<div style="color: #666; font-size: 10px; margin-top: 4px;">Click to view alumni</div>'}
                </div>
              `)
              .addTo(mapInstance);
          }
        });

        mapInstance.on('mouseleave', 'alumni-markers', () => {
          mapInstance.getCanvas().style.cursor = '';
          popup.remove();
        });

        // Click handlers
        const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          if (e.features && e.features[0]) {
            const { city, country, alumniData, geohash } = e.features[0].properties;
            handleLocationClick(city, country, alumniData, geohash);
          }
        };

        mapInstance.on('click', 'alumni-markers', clickHandler);
        mapInstance.on('click', 'alumni-columns-3d', clickHandler);

        mapInstance.on('mouseenter', 'alumni-columns-3d', () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', 'alumni-columns-3d', () => {
          mapInstance.getCanvas().style.cursor = '';
        });
      }
    }
  }, [locationData, createColumnsGeoJSON, createPointsGeoJSON, isAdmin, handleLocationClick]);

  return (
    <>
      <Card className="p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              {title}
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Aggregate
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locationData.length} locations • {totalAlumni.toLocaleString()} alumni worldwide
            </p>
          </div>
          <div className="flex items-center gap-2">
            {useBackendData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadBackendData()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Badge variant="outline" className="flex items-center gap-2 w-fit">
              <MapPin className="w-4 h-4" />
              {locationData.length} Regions
            </Badge>
          </div>
        </div>

        {/* Admin notice */}
        {isAdmin && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Admin View:</strong> You can see aggregate counts only. Individual alumni profiles are not accessible.
            </p>
          </div>
        )}

        {/* Alumni drill-down tip */}
        {!isAdmin && zoom < 5 && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Tip:</strong> Click on columns to discover and connect with alumni in that region
            </p>
          </div>
        )}

        <div 
          className="relative rounded-lg overflow-hidden border border-border"
          style={{ height, minHeight: '300px' }}
        >
          <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '300px' }} />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-sm text-white/70">Loading map...</p>
              </div>
            </div>
          )}

          {!isLoading && locationData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <MapPin className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">No alumni location data available</p>
                <p className="text-xs text-muted-foreground/70">Alumni location data will appear here once available</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-2 sm:left-4 bg-black/80 backdrop-blur-md rounded-lg p-2 sm:p-3 text-[10px] sm:text-xs text-white pointer-events-none border border-white/10 z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <span className="font-medium text-[10px] sm:text-xs">Alumni Density:</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm" style={{ backgroundColor: 'rgb(255, 255, 255)' }} />
              <span className="text-[9px] sm:text-[10px] text-white/70">Low</span>
              <div className="w-8 sm:w-12 h-1.5 sm:h-2 rounded-sm mx-0.5 sm:mx-1" style={{ 
                background: 'linear-gradient(to right, rgb(255, 255, 255), rgb(255, 105, 180))' 
              }} />
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm" style={{ backgroundColor: 'rgb(255, 105, 180)' }} />
              <span className="text-[9px] sm:text-[10px] text-white/70">High</span>
            </div>
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-4 right-2 sm:right-4 bg-black/80 backdrop-blur-md rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-white pointer-events-none border border-white/10 z-10 max-w-[calc(100%-8rem)] sm:max-w-none">
            <p className="hidden sm:block">🖱️ Drag to rotate • Scroll to zoom • Click columns for {isAdmin ? 'count' : 'alumni'}</p>
            <p className="sm:hidden">👆 Drag to rotate • Pinch to zoom • Tap columns</p>
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          💡 Column height and color represent alumni count. Taller/pinker columns = more alumni in that location.
        </div>
      </Card>

      {selectedAlumni && (
        <AlumniDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          alumni={selectedAlumni.alumni}
          location={selectedAlumni.location}
          isAdmin={isAdmin}
          onConnect={!isAdmin ? handleConnect : undefined}
        />
      )}

      <style>{`
        .alumni-popup .maplibregl-popup-content {
          padding: 0;
          background: transparent;
          box-shadow: none;
          border-radius: 6px;
        }
        .alumni-popup .maplibregl-popup-tip {
          display: none;
        }
      `}</style>
    </>
  );
};

export default WorldMapHeatmap;
