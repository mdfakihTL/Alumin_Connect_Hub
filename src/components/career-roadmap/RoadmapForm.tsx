import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RoadmapFormData {
  careerGoal: string;
  currentRole: string;
  yearsExperience: number;
  additionalContext: string;
}

interface RoadmapFormProps {
  onSubmit: (data: RoadmapFormData) => void;
  isLoading?: boolean;
  initialGoal?: string;
}

export const RoadmapForm = ({ onSubmit, isLoading = false, initialGoal = '' }: RoadmapFormProps) => {
  const [careerGoal, setCareerGoal] = useState(initialGoal);
  const [currentRole, setCurrentRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(1);
  const [additionalContext, setAdditionalContext] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update careerGoal when initialGoal prop changes (e.g., from "Use Template")
  useEffect(() => {
    if (initialGoal) {
      setCareerGoal(initialGoal);
    }
  }, [initialGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerGoal.trim()) return;

    onSubmit({
      careerGoal,
      currentRole,
      yearsExperience,
      additionalContext,
    });
  };

  return (
    <Card className="p-5 sm:p-6 bg-card border border-border rounded-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dream Career Goal Field */}
        <div className="space-y-2">
          <Label htmlFor="career-goal" className="text-sm font-medium text-foreground">
            Dream Career Goal <span className="text-destructive">*</span>
          </Label>
          <Input
            id="career-goal"
            placeholder="e.g., Senior Consultant / Partner"
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            className="h-11 text-base"
            required
          />
        </div>

        {/* Expandable Advanced Options */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-1.5 text-muted-foreground hover:text-foreground px-0"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide more options
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more options
              </>
            )}
          </Button>

          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-border space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Two Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-role" className="text-sm font-medium text-foreground">
                    Current Role
                  </Label>
                  <Input
                    id="current-role"
                    placeholder="e.g., Graduate Management Trainee"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="years-exp" className="text-sm font-medium text-foreground">
                    Years of Experience
                  </Label>
                  <Input
                    id="years-exp"
                    type="number"
                    min={0}
                    max={50}
                    placeholder="1"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Additional Context Textarea */}
              <div className="space-y-2">
                <Label htmlFor="context" className="text-sm font-medium text-foreground">
                  Additional Context
                </Label>
                <Textarea
                  id="context"
                  placeholder="e.g., Python, Data Science, MBA background..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !careerGoal.trim()}
          className="w-full sm:w-auto gap-2 h-11 px-6 text-sm font-medium"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate My Roadmap
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default RoadmapForm;

