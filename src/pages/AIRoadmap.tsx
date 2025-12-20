import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, ArrowRight, Menu, Loader2, Lightbulb, Target, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface GeneratedRoadmap {
  title: string;
  overview: string;
  duration: string;
  steps: string[];
  tips: string[];
}

const AIRoadmap = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<GeneratedRoadmap | null>(null);

  const generateRoadmap = async () => {
    if (!goal.trim()) {
      toast({
        title: 'Please enter a career goal',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use the chat API to generate a roadmap
      const response = await apiClient.chatQuery(
        `Create a detailed career roadmap for someone who wants to: ${goal}. 
        
Please provide:
1. A brief overview of this career path
2. Estimated timeline to achieve this goal
3. 5-6 key steps/milestones to achieve this goal
4. 3 practical tips for success

Format your response clearly with numbered steps and bullet points for tips.`
      );

      // Parse the AI response into structured roadmap
      const aiResponse = response.answer;
      
      // Simple parsing of the AI response
      const lines = aiResponse.split('\n').filter((l: string) => l.trim());
      const steps: string[] = [];
      const tips: string[] = [];
      let overview = '';
      let duration = '2-4 years';
      
      let currentSection = '';
      lines.forEach((line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().includes('overview') || trimmedLine.toLowerCase().includes('path')) {
          currentSection = 'overview';
        } else if (trimmedLine.toLowerCase().includes('timeline') || trimmedLine.toLowerCase().includes('duration')) {
          currentSection = 'duration';
        } else if (trimmedLine.toLowerCase().includes('step') || trimmedLine.toLowerCase().includes('milestone')) {
          currentSection = 'steps';
        } else if (trimmedLine.toLowerCase().includes('tip') || trimmedLine.toLowerCase().includes('advice')) {
          currentSection = 'tips';
        } else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('-')) {
          const content = trimmedLine.replace(/^[\d\-\.\*\•]+\s*/, '');
          if (currentSection === 'steps' && steps.length < 6) {
            steps.push(content);
          } else if (currentSection === 'tips' && tips.length < 3) {
            tips.push(content);
          } else if (steps.length < 6) {
            steps.push(content);
          }
        } else if (currentSection === 'overview' && !overview) {
          overview = trimmedLine;
        } else if (currentSection === 'duration') {
          const durationMatch = trimmedLine.match(/(\d+[-–]\d+\s*(years?|months?))/i);
          if (durationMatch) {
            duration = durationMatch[1];
          }
        }
      });

      // Fallback if parsing didn't get enough steps
      if (steps.length === 0) {
        steps.push('Research the field and understand requirements');
        steps.push('Build foundational skills and knowledge');
        steps.push('Gain practical experience through projects');
        steps.push('Network with professionals in the field');
        steps.push('Apply for entry-level positions');
        steps.push('Continue learning and advancing');
      }

      if (tips.length === 0) {
        tips.push('Connect with alumni who have achieved similar goals');
        tips.push('Stay updated with industry trends and technologies');
        tips.push('Build a strong professional network');
      }

      setGeneratedRoadmap({
        title: goal,
        overview: overview || `A comprehensive path to achieve your goal of becoming a ${goal}`,
        duration,
        steps: steps.slice(0, 6),
        tips: tips.slice(0, 3),
      });

    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      toast({
        title: 'Failed to generate roadmap',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      generateRoadmap();
    }
  };

  // Popular career path suggestions
  const popularGoals = [
    'Software Engineer to Tech Lead',
    'Product Manager',
    'Data Scientist',
    'Startup Founder',
    'Engineering Manager',
    'UX Designer',
  ];

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <MobileNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-9 w-9"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Header */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-3">AI Career Roadmap</h1>
            <p className="text-muted-foreground text-lg">
              Get personalized career guidance powered by AI
            </p>
          </div>

          {/* Input */}
          <Card className="p-6">
            <label className="block text-sm font-medium mb-2">What's your career goal?</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Become a Senior Product Manager"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isGenerating}
              />
              <Button 
                className="gap-2" 
                onClick={generateRoadmap}
                disabled={isGenerating || !goal.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Roadmap
                  </>
                )}
              </Button>
            </div>

            {/* Popular suggestions */}
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Popular career goals:</p>
              <div className="flex flex-wrap gap-2">
                {popularGoals.map((suggestion) => (
                  <Badge 
                    key={suggestion}
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setGoal(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Generated Roadmap */}
          {generatedRoadmap && (
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{generatedRoadmap.title}</h3>
                  <p className="text-muted-foreground">{generatedRoadmap.overview}</p>
                  <Badge variant="secondary" className="mt-2">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Estimated: {generatedRoadmap.duration}
                  </Badge>
                </div>
              </div>

              {/* Steps */}
              <div className="mb-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Key Steps to Success
                </h4>
                <div className="space-y-3">
                  {generatedRoadmap.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                        {idx + 1}
                      </div>
                      <p className="text-sm pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Pro Tips
                </h4>
                <ul className="space-y-2">
                  {generatedRoadmap.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex gap-3">
                <Button className="flex-1 gap-2">
                  <Users className="w-4 h-4" />
                  Find Alumni Mentors
                </Button>
                <Button variant="outline" onClick={() => setGeneratedRoadmap(null)}>
                  Generate Another
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!generatedRoadmap && !isGenerating && (
            <Card className="p-8 text-center border-dashed border-2">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary/50" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Your Personalized Roadmap Awaits</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Enter your career goal above and our AI will create a customized roadmap
                based on successful alumni career paths.
              </p>
            </Card>
          )}

          {/* Loading State */}
          {isGenerating && (
            <Card className="p-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="font-semibold text-lg mb-2">Generating Your Roadmap...</h3>
              <p className="text-muted-foreground text-sm">
                Analyzing career paths and creating personalized guidance
              </p>
            </Card>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default AIRoadmap;
