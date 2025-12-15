import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Users, Briefcase, GraduationCap, Loader2 } from 'lucide-react';
import { AlumniLocation, getAlumniByLocation } from '@/data/alumniLocations';
import { usersApi } from '@/api/users';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WorldMapHeatmapProps {
  universityId: string;
  title?: string;
  height?: string;
}

interface LocationData {
  lng: number;
  lat: number;
  alumni: AlumniLocation[];
  count: number;
  city: string;
  country: string;
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

// Detail Modal Component
const AlumniDetailModal = ({ 
  open, 
  onOpenChange, 
  alumni, 
  location 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  alumni: AlumniLocation[] | null;
  location: string;
}) => {
  if (!alumni || !alumni.length) return null;

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
            {alumni.map((person) => (
              <Card key={person.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg mb-1.5">{person.name}</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4 flex-shrink-0" />
                        <span>{person.major}</span>
                        <span className="text-muted-foreground/70">•</span>
                        <span>Class of {person.graduationYear}</span>
                      </div>
                      {person.currentPosition && person.company && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{person.currentPosition}</span>
                          <span className="text-muted-foreground/70">•</span>
                          <span className="truncate font-medium">{person.company}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    Alumni
                  </Badge>
                </div>
              </Card>
            ))}
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
  height = "600px" 
}: WorldMapHeatmapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState<{ alumni: AlumniLocation[]; location: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [apiLocationData, setApiLocationData] = useState<LocationData[] | null>(null);

  // Fetch location data from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await usersApi.getAlumniLocations();
        if (response.locations && response.locations.length > 0) {
          const transformedData: LocationData[] = response.locations.map(loc => ({
            lng: loc.lng,
            lat: loc.lat,
            alumni: loc.alumni.map(a => ({
              id: a.id,
              name: a.name,
              city: loc.location.split(',')[0] || loc.location,
              country: loc.location.split(',')[1]?.trim() || '',
              coordinates: { lat: loc.lat, lng: loc.lng },
              universityId: universityId,
              graduationYear: 2020, // Default as API doesn't have this yet
              major: 'Alumni',
              currentPosition: a.job_title,
              company: a.company,
            })),
            count: loc.count,
            city: loc.location.split(',')[0] || loc.location,
            country: loc.location.split(',')[1]?.trim() || '',
          }));
          setApiLocationData(transformedData);
        }
      } catch (error) {
        console.error('Failed to fetch alumni locations from API, using local data:', error);
        // Will fall back to local data
      }
    };
    
    fetchLocations();
  }, [universityId]);

  // Memoize location map to prevent recreation on every render (fallback)
  const localLocationMap = useMemo(() => getAlumniByLocation(universityId), [universityId]);

  // Process location data - prefer API data, fall back to local
  const locationData: LocationData[] = useMemo(() => {
    // Use API data if available
    if (apiLocationData && apiLocationData.length > 0) {
      return apiLocationData;
    }
    
    // Fallback to local data
    if (!localLocationMap || localLocationMap.size === 0) {
      return [];
    }
    return Array.from(localLocationMap.entries()).map(([key, alumni]) => {
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
  }, [apiLocationData, localLocationMap]);

  const maxCount = useMemo(() => 
    Math.max(...locationData.map(d => d.count), 1), 
    [locationData]
  );

  const totalAlumni = useMemo(() => 
    locationData.reduce((sum, d) => sum + d.count, 0),
    [locationData]
  );

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
      const radiusKm = 30; // Base radius in km
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
          alumniData: JSON.stringify(loc.alumni),
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [loc.lng, loc.lat],
        },
      })),
    };
  }, [locationData]);

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
      setupMapLayers(mapInstance);
    });

    // Add navigation controls
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []); // Only run once on mount

  // Setup map layers and interactions (only once)
  const setupMapLayers = useCallback((mapInstance: maplibregl.Map) => {
    // Only add sources if we have data
    if (locationData.length > 0) {
      // Add columns source (polygons for extrusion)
      if (!mapInstance.getSource('alumni-columns')) {
        mapInstance.addSource('alumni-columns', {
          type: 'geojson',
          data: createColumnsGeoJSON(),
        });
      }

      // Add points source (for labels and interaction)
      if (!mapInstance.getSource('alumni-points')) {
        mapInstance.addSource('alumni-points', {
          type: 'geojson',
          data: createPointsGeoJSON(),
        });
      }

      // Add 3D extruded columns layer
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

      // Add a glow effect layer
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

      // Add interactive circle markers
      if (!mapInstance.getLayer('alumni-markers')) {
        mapInstance.addLayer({
          id: 'alumni-markers',
          type: 'circle',
          source: 'alumni-points',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1, 6,
              5, 12,
              10, 20,
            ],
            'circle-color': 'transparent',
            'circle-stroke-color': 'transparent',
            'circle-stroke-width': 0,
          },
        });

        // Create a popup for hover (only set up once)
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -10],
          className: 'alumni-popup',
        });

        // Show popup on hover
        mapInstance.on('mouseenter', 'alumni-markers', (e) => {
          mapInstance.getCanvas().style.cursor = 'pointer';

          if (e.features && e.features[0]) {
            const coordinates = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
            const { city, count } = e.features[0].properties;

            popup
              .setLngLat(coordinates)
              .setHTML(`
                <div style="font-family: system-ui, -apple-system, sans-serif; padding: 8px 12px; background: white; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                  <div style="font-weight: 600; color: #1a1a1a; font-size: 14px;">${city}</div>
                  <div style="color: #666; font-size: 12px;">(Alumni Count: ${count.toLocaleString()})</div>
                </div>
              `)
              .addTo(mapInstance);
          }
        });

        mapInstance.on('mouseleave', 'alumni-markers', () => {
          mapInstance.getCanvas().style.cursor = '';
          popup.remove();
        });

        // Handle click on markers
        mapInstance.on('click', 'alumni-markers', (e) => {
          if (e.features && e.features[0]) {
            const { city, country, alumniData } = e.features[0].properties;
            const alumni = JSON.parse(alumniData);
            setSelectedAlumni({
              alumni,
              location: `${city}, ${country}`,
            });
            setModalOpen(true);
          }
        });

        // Also handle click on the 3D columns
        mapInstance.on('click', 'alumni-columns-3d', (e) => {
          if (e.features && e.features[0]) {
            const { city, country, alumniData } = e.features[0].properties;
            const alumni = JSON.parse(alumniData);
            setSelectedAlumni({
              alumni,
              location: `${city}, ${country}`,
            });
            setModalOpen(true);
          }
        });

        mapInstance.on('mouseenter', 'alumni-columns-3d', () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', 'alumni-columns-3d', () => {
          mapInstance.getCanvas().style.cursor = '';
        });
      }
    }
  }, [locationData.length, createColumnsGeoJSON, createPointsGeoJSON]);

  // Update source data when locationData changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      if (locationData.length > 0) {
        const columnsSource = map.current.getSource('alumni-columns') as maplibregl.GeoJSONSource;
        const pointsSource = map.current.getSource('alumni-points') as maplibregl.GeoJSONSource;
        
        if (columnsSource) {
          columnsSource.setData(createColumnsGeoJSON());
        } else {
          // If sources don't exist yet, set them up
          setupMapLayers(map.current);
        }
        if (pointsSource) {
          pointsSource.setData(createPointsGeoJSON());
        }
      }
    }
  }, [createColumnsGeoJSON, createPointsGeoJSON, locationData.length, setupMapLayers]);

  return (
    <>
      <Card className="p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {locationData.length} locations • {totalAlumni.toLocaleString()} alumni worldwide
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 w-fit">
            <MapPin className="w-4 h-4" />
            {locationData.length} Cities
          </Badge>
        </div>

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
            <p className="hidden sm:block">🖱️ Drag to rotate • Scroll to zoom • Click columns for details</p>
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
