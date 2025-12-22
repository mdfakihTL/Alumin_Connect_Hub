/**
 * RoadmapForm Component
 * 
 * A clean form for users to input their career goals and generate a roadmap.
 * No templates - direct input fields for personalized roadmap generation.
 */

import { useState } from 'react';
import { Sparkles, Loader2, Target, Briefcase, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoadmapFormData {
  careerGoal: string;
  currentRole: string;
  yearsExperience: number;
  additionalContext: string;
  targetTimeline?: string;
  industry?: string;
}

interface RoadmapFormProps {
  onSubmit: (data: RoadmapFormData) => void;
  isLoading?: boolean;
  initialGoal?: string;
}

const INDUSTRIES = [
  'Technology & IT',
  'Finance & Banking',
  'Healthcare & Pharma',
  'Consulting',
  'Education',
  'Manufacturing',
  'E-commerce & Retail',
  'Media & Entertainment',
  'Real Estate',
  'Government & Public Sector',
  'Other'
];

const TIMELINES = [
  { value: '6-months', label: '6 months' },
  { value: '1-year', label: '1 year' },
  { value: '2-years', label: '2 years' },
  { value: '3-years', label: '3 years' },
  { value: '5-years', label: '5 years' },
  { value: 'flexible', label: 'Flexible / No preference' },
];

export const RoadmapForm = ({ onSubmit, isLoading = false, initialGoal = '' }: RoadmapFormProps) => {
  const [careerGoal, setCareerGoal] = useState(initialGoal);
  const [currentRole, setCurrentRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [additionalContext, setAdditionalContext] = useState('');
  const [targetTimeline, setTargetTimeline] = useState('2-years');
  const [industry, setIndustry] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerGoal.trim()) return;

    onSubmit({
      careerGoal,
      currentRole,
      yearsExperience,
      additionalContext,
      targetTimeline,
      industry,
    });
  };

  return (
    <Card className="p-6 sm:p-8 bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 rounded-2xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Plan Your Career Journey</h2>
          <p className="text-sm text-muted-foreground">Tell us about your goals and we'll create a personalized roadmap</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Goal - Required */}
        <div className="space-y-2">
          <Label htmlFor="career-goal" className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            What's your dream career goal? <span className="text-destructive">*</span>
          </Label>
          <Input
            id="career-goal"
            placeholder="e.g., Senior Product Manager, Tech Lead, Chief Marketing Officer..."
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            className="h-12 text-base border-2 focus:border-primary"
            required
          />
          <p className="text-xs text-muted-foreground">Be specific about the role you want to achieve</p>
        </div>

        {/* Current Role */}
        <div className="space-y-2">
          <Label htmlFor="current-role" className="text-sm font-semibold flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            Your Current Role
          </Label>
          <Input
            id="current-role"
            placeholder="e.g., Software Developer, Marketing Executive, Fresh Graduate..."
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Two columns: Experience & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="years-exp" className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Years of Experience
            </Label>
            <Input
              id="years-exp"
              type="number"
              min={0}
              max={50}
              placeholder="0"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Target Timeline
            </Label>
            <Select value={targetTimeline} onValueChange={setTargetTimeline}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2 text-muted-foreground hover:text-foreground px-0"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide additional options
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Add more details for better results
              </>
            )}
          </Button>

          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Industry */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select industry (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label htmlFor="context" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Additional Skills & Background
                </Label>
                <Textarea
                  id="context"
                  placeholder="e.g., I have a Computer Science degree, know Python and SQL, have led a team of 3, interested in AI/ML..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Share your skills, certifications, or any other relevant information
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !careerGoal.trim()}
          className="w-full h-12 text-base font-semibold gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Your Roadmap...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate My Career Roadmap
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default RoadmapForm;
