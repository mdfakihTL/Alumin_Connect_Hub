import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Briefcase, GraduationCap } from 'lucide-react';
import { AlumniLocation, getAlumniByLocation } from '@/data/alumniLocations';

interface WorldMapHeatmapProps {
  universityId: string;
  title?: string;
  height?: string;
}

const WorldMapHeatmap = ({ universityId, title = "Global Alumni Network", height = "600px" }: WorldMapHeatmapProps) => {
  const [hoveredLocation, setHoveredLocation] = useState<{ alumni: AlumniLocation[]; x: number; y: number } | null>(null);
  const locationMap = getAlumniByLocation(universityId);

  // Convert lat/lng to SVG coordinates (simplified mercator projection)
  const latLngToXY = (lat: number, lng: number) => {
    // Map bounds: lng -180 to 180, lat -85 to 85 (Web Mercator limits)
    const x = ((lng + 180) / 360) * 100;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = ((1 - mercN / Math.PI) / 2) * 100;
    return { x, y };
  };

  const locations = Array.from(locationMap.entries()).map(([key, alumni]) => {
    const [lat, lng] = key.split(',').map(Number);
    const { x, y } = latLngToXY(lat, lng);
    return { alumni, x, y, lat, lng };
  });

  const getMarkerSize = (count: number) => {
    if (count === 1) return { size: 8, class: 'w-8 h-8' };
    if (count <= 3) return { size: 12, class: 'w-12 h-12' };
    if (count <= 5) return { size: 16, class: 'w-16 h-16' };
    return { size: 20, class: 'w-20 h-20' };
  };

  const getMarkerColor = (count: number) => {
    if (count === 1) return 'bg-blue-500/60';
    if (count <= 3) return 'bg-orange-500/60';
    if (count <= 5) return 'bg-red-500/60';
    return 'bg-purple-500/60';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {locations.length} locations • {Array.from(locationMap.values()).flat().length} alumni worldwide
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {locations.length} Cities
        </Badge>
      </div>

      <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-hidden border border-border" style={{ height }}>
        {/* World Map SVG Background */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 2000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="worldgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#worldgrid)" />
          
          {/* Simple world map shapes */}
          <g className="fill-muted-foreground/30 stroke-muted-foreground/40" strokeWidth="2">
            {/* North America */}
            <path d="M 200,200 L 150,250 L 180,320 L 250,350 L 300,320 L 350,280 L 320,220 L 280,180 Z" />
            <path d="M 280,180 L 320,150 L 380,160 L 400,200 L 380,240 L 320,220 Z" />
            
            {/* South America */}
            <path d="M 350,400 L 320,480 L 300,560 L 320,620 L 380,640 L 420,600 L 430,520 L 400,450 L 380,420 Z" />
            
            {/* Europe */}
            <path d="M 900,180 L 920,200 L 950,190 L 980,210 L 1000,200 L 1020,220 L 1000,250 L 960,260 L 920,240 L 900,220 Z" />
            
            {/* Africa */}
            <path d="M 950,320 L 980,380 L 1000,450 L 1020,520 L 1000,580 L 960,600 L 920,580 L 900,520 L 920,450 L 940,380 L 960,340 Z" />
            
            {/* Asia */}
            <path d="M 1100,180 L 1180,200 L 1250,220 L 1320,240 L 1380,280 L 1400,320 L 1380,380 L 1320,400 L 1250,380 L 1180,350 L 1120,320 L 1080,280 L 1080,220 Z" />
            <path d="M 1320,400 L 1360,440 L 1380,480 L 1360,520 L 1320,540 L 1280,520 L 1260,480 L 1280,440 Z" />
            
            {/* Australia */}
            <path d="M 1450,600 L 1500,620 L 1560,640 L 1600,620 L 1580,580 L 1540,560 L 1490,570 L 1460,590 Z" />
          </g>
        </svg>

        {/* Decorative ocean waves */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" className="text-blue-400" />
              <stop offset="100%" stopColor="currentColor" className="text-cyan-400" />
            </linearGradient>
          </defs>
          <circle cx="20%" cy="30%" r="100" fill="url(#oceanGradient)" opacity="0.3" />
          <circle cx="80%" cy="60%" r="120" fill="url(#oceanGradient)" opacity="0.3" />
          <circle cx="50%" cy="80%" r="80" fill="url(#oceanGradient)" opacity="0.3" />
        </svg>

        {/* Alumni Markers */}
        <div className="absolute inset-0">
          {locations.map((location, index) => {
            const markerSize = getMarkerSize(location.alumni.length);
            const markerColor = getMarkerColor(location.alumni.length);

            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredLocation({
                    alumni: location.alumni,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                }}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                {/* Pulsing ring animation */}
                <div className={`absolute inset-0 ${markerColor} rounded-full animate-ping ${markerSize.class}`} />
                
                {/* Main marker */}
                <div className={`relative ${markerColor} ${markerSize.class} rounded-full border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-125 transition-transform duration-200`}>
                  <span className="text-white font-bold text-xs">
                    {location.alumni.length}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredLocation && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: hoveredLocation.x,
              top: hoveredLocation.y - 10,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <Card className="p-4 shadow-2xl border-2 border-primary/20 max-w-xs bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-bold text-lg">
                    {hoveredLocation.alumni[0].city}, {hoveredLocation.alumni[0].country}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {hoveredLocation.alumni.length} {hoveredLocation.alumni.length === 1 ? 'Alumni' : 'Alumni'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hoveredLocation.alumni.map((alumni, idx) => (
                  <div key={alumni.id} className={`text-sm p-2 rounded ${idx % 2 === 0 ? 'bg-muted/50' : ''}`}>
                    <p className="font-semibold text-sm">{alumni.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <GraduationCap className="w-3 h-3" />
                      <span>{alumni.major} '{alumni.graduationYear.toString().slice(-2)}</span>
                    </div>
                    {alumni.currentPosition && alumni.company && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Briefcase className="w-3 h-3" />
                        <span>{alumni.currentPosition} at {alumni.company}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <p className="font-medium">Concentration:</p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500/60 border-2 border-white" />
          <span className="text-muted-foreground">1 alumni</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500/60 border-2 border-white" />
          <span className="text-muted-foreground">2-3 alumni</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-red-500/60 border-2 border-white" />
          <span className="text-muted-foreground">4-5 alumni</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-purple-500/60 border-2 border-white" />
          <span className="text-muted-foreground">6+ alumni</span>
        </div>
      </div>
    </Card>
  );
};

export default WorldMapHeatmap;

