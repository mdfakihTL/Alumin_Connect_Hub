/**
 * RoadTimeline Component
 * 
 * A visual "road" style timeline for displaying career milestones.
 * Features:
 * - Visual road path connecting milestones
 * - Checkable milestones for progress tracking
 * - Expandable details for each milestone
 * - Mobile responsive design
 */

import { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, BookOpen, ChevronDown, ChevronUp,
  Flag, MapPin, Lightbulb, ArrowDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Milestone {
  id: number;
  title: string;
  description: string;
  duration: string;
  skills: string[];
  resources: string[];
  tips?: string;
}

interface RoadTimelineProps {
  milestones: Milestone[];
  completedMilestones: Set<number>;
  onToggleComplete: (milestoneId: number) => void;
  goalTitle?: string;
}

export const RoadTimeline = ({ 
  milestones, 
  completedMilestones, 
  onToggleComplete,
  goalTitle 
}: RoadTimelineProps) => {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  const progressPercentage = Math.round((completedMilestones.size / milestones.length) * 100);

  return (
    <div className="relative">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold">Your Journey</span>
          </div>
          <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
            {progressPercentage}% Complete
          </Badge>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Road markings */}
          <div className="absolute inset-0 flex justify-evenly items-center pointer-events-none">
            {milestones.slice(0, -1).map((_, i) => (
              <div key={i} className="w-0.5 h-full bg-background/30" />
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Start</span>
          <span>{goalTitle || 'Goal'}</span>
        </div>
      </div>

      {/* Road Timeline */}
      <div className="relative">
        {/* The Road - Center Line */}
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 rounded-full" />
        
        {/* Milestones */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const isCompleted = completedMilestones.has(milestone.id);
            const isExpanded = expandedMilestone === milestone.id;
            const isLast = index === milestones.length - 1;

            return (
              <div key={milestone.id} className="relative">
                {/* Milestone Marker */}
                <div className="flex items-start gap-4">
                  {/* Road Marker */}
                  <div className="relative z-10 flex-shrink-0">
                    <button
                      onClick={() => onToggleComplete(milestone.id)}
                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-110'
                          : 'bg-card border-4 border-primary/30 hover:border-primary hover:scale-105'
                      }`}
                      title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
                      ) : isLast ? (
                        <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      ) : (
                        <span className="text-lg sm:text-xl font-bold text-muted-foreground">{index + 1}</span>
                      )}
                    </button>
                    
                    {/* Connecting arrow (except for last) */}
                    {!isLast && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-primary/40">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Milestone Card */}
                  <Card className={`flex-1 p-4 sm:p-5 rounded-xl transition-all duration-300 ${
                    isCompleted
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'hover:border-primary/30 hover:shadow-md'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge 
                            variant={isCompleted ? "default" : "outline"} 
                            className={`text-xs ${isCompleted ? 'bg-green-500' : ''}`}
                          >
                            {isLast ? '🎯 Final Goal' : `Step ${index + 1}`}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {milestone.duration}
                          </Badge>
                        </div>
                        <h4 className={`font-semibold text-base sm:text-lg ${
                          isCompleted ? 'text-green-700 dark:text-green-400' : ''
                        }`}>
                          {milestone.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                        className="flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {milestone.skills.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <span className="text-lg">🛠️</span> Skills to Develop
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {milestone.skills.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {milestone.resources.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" /> Resources
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-1.5">
                              {milestone.resources.map((resource, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">→</span>
                                  {resource}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {milestone.tips && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-sm flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span><strong>Pro Tip:</strong> {milestone.tips}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {/* Finish Line */}
        <div className="mt-6 ml-6 sm:ml-8 pl-4 border-l-2 border-dashed border-primary/30">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white">
              🏆
            </div>
            <div>
              <p className="font-semibold">Goal: {goalTitle}</p>
              <p className="text-sm text-muted-foreground">
                {progressPercentage === 100 
                  ? "Congratulations! You've achieved all milestones!" 
                  : `${milestones.length - completedMilestones.size} milestones remaining`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadTimeline;

