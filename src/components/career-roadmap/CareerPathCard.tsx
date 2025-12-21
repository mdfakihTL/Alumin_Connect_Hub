import { Users, TrendingUp, ArrowRight, Clock, Star, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface AlumniPreview {
  id: string;
  name: string;
  avatar?: string;
  job_title?: string;
  company?: string;
  is_mentor: boolean;
}

export interface CareerPath {
  id: string;
  title: string;
  alumniCount: number;
  successRate: number;
  timeline: string;
  keySteps: string[];
  topCompanies?: string[];
  alumniPreview?: AlumniPreview[];
  hasMentors?: boolean;
}

interface CareerPathCardProps {
  careerPath: CareerPath;
  onUseTemplate: (careerPath: CareerPath) => void;
  onAlumniClick?: (alumni: AlumniPreview) => void;
}

export const CareerPathCard = ({ careerPath, onUseTemplate, onAlumniClick }: CareerPathCardProps) => {
  const hasAlumni = careerPath.alumniPreview && careerPath.alumniPreview.length > 0;
  
  return (
    <Card className="w-full p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-border/60">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {careerPath.title}
          </h3>
          {careerPath.hasMentors && (
            <Badge variant="default" className="flex items-center gap-1 text-xs shrink-0">
              <Star className="w-3 h-3" />
              Mentors Available
            </Badge>
          )}
        </div>
        
        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{careerPath.alumniCount} alumni</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{careerPath.successRate}% success</span>
          </div>
          
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full"
          >
            <Clock className="w-3 h-3" />
            {careerPath.timeline}
          </Badge>
        </div>
      </div>

      {/* Alumni Preview Section */}
      {hasAlumni && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/40">
          <p className="text-xs font-medium text-muted-foreground mb-2">Alumni who achieved this:</p>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {careerPath.alumniPreview!.slice(0, 3).map((alumni) => (
                <Avatar 
                  key={alumni.id} 
                  className="h-8 w-8 border-2 border-background cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                  onClick={() => onAlumniClick?.(alumni)}
                >
                  <AvatarImage src={alumni.avatar} />
                  <AvatarFallback className="text-xs">{alumni.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate">
                {careerPath.alumniPreview![0]?.name}
                {careerPath.alumniPreview!.length > 1 && (
                  <span className="text-muted-foreground"> +{careerPath.alumniPreview!.length - 1} more</span>
                )}
              </p>
              {careerPath.alumniPreview![0]?.job_title && (
                <p className="text-xs text-muted-foreground truncate">
                  {careerPath.alumniPreview![0].job_title}
                  {careerPath.alumniPreview![0].company && ` at ${careerPath.alumniPreview![0].company}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Companies */}
      {careerPath.topCompanies && careerPath.topCompanies.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span>Top companies: {careerPath.topCompanies.slice(0, 4).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Key Steps Section */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground mb-3">Key Steps:</p>
        <div className="flex flex-wrap gap-2">
          {careerPath.keySteps.map((step, index) => (
            <Badge 
              key={index}
              variant="outline"
              className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-muted/30"
            >
              {index + 1}. {step}
            </Badge>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        variant="secondary"
        className="w-full gap-2 h-11 text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors"
        onClick={() => onUseTemplate(careerPath)}
      >
        Use This Template
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Card>
  );
};

export default CareerPathCard;

