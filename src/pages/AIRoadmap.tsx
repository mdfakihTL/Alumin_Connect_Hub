import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, ArrowRight, Menu } from 'lucide-react';

const mockRoadmaps = [
  {
    id: 1,
    title: 'Software Engineer to Tech Lead',
    alumniCount: 23,
    successRate: 89,
    duration: '2-3 years',
    steps: ['Master system design', 'Lead projects', 'Mentor juniors', 'Build influence'],
  },
  {
    id: 2,
    title: 'Product Manager Career Path',
    alumniCount: 17,
    successRate: 92,
    duration: '3-4 years',
    steps: ['Learn product strategy', 'Stakeholder management', 'Data analytics', 'Leadership'],
  },
  {
    id: 3,
    title: 'Startup Founder Journey',
    alumniCount: 12,
    successRate: 78,
    duration: '4-5 years',
    steps: ['Validate idea', 'Build MVP', 'Raise funding', 'Scale team'],
  },
];

const AIRoadmap = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const [goal, setGoal] = useState('');

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
              Get personalized career guidance powered by alumni success stories
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
                className="flex-1"
              />
              <Button className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Roadmap
              </Button>
            </div>
          </Card>

          {/* Popular Roadmaps */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Popular Career Paths</h2>
            <div className="space-y-4">
              {mockRoadmaps.map((roadmap) => (
                <Card key={roadmap.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{roadmap.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {roadmap.alumniCount} alumni followed
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          {roadmap.successRate}% success rate
                        </div>
                        <Badge variant="secondary">{roadmap.duration}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Key Steps:</p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.steps.map((step, idx) => (
                        <Badge key={idx} variant="outline">
                          {idx + 1}. {step}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    View Full Roadmap
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default AIRoadmap;
