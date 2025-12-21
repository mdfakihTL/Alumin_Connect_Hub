import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConnections } from '@/contexts/ConnectionsContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { CareerPathCard, CareerPath, RoadmapForm, AlumniPreview } from '@/components/career-roadmap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  TrendingUp,
  Users,
  ArrowRight,
  Menu,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Target,
  Briefcase,
  GraduationCap,
  UserPlus,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  Building2,
  Award
} from 'lucide-react';

// API base URL
const getApiBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('alumni-portal')) {
    return 'https://alumni-portal-yw7q.onrender.com/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseURL();

// Types
interface Milestone {
  id: number;
  title: string;
  description: string;
  duration: string;
  skills: string[];
  resources: string[];
  tips?: string;
}

interface RelatedAlumni {
  id: string;
  name: string;
  avatar?: string;
  job_title?: string;
  company?: string;
  graduation_year?: number;
  major?: string;
  is_mentor: boolean;
  match_reason: string;
}

interface GeneratedRoadmap {
  title: string;
  summary: string;
  estimated_duration: string;
  milestones: Milestone[];
  skills_required: string[];
  market_insights?: string;
  salary_range?: string;
  related_alumni: RelatedAlumni[];
}

interface SavedRoadmap {
  id: string;
  career_goal: string;
  current_role?: string;
  title: string;
  summary?: string;
  estimated_duration?: string;
  milestones: Milestone[];
  skills_required: string[];
  created_at: string;
}

// Fallback Sample Career Paths (used if API fails)
const FALLBACK_CAREER_PATHS: CareerPath[] = [
  {
    id: '1',
    title: 'Software Engineer to Tech Lead',
    alumniCount: 23,
    successRate: 89,
    timeline: '2-3 years',
    keySteps: [
      'Master system design',
      'Lead projects',
      'Mentor juniors',
      'Drive architecture decisions'
    ]
  },
  {
    id: '2',
    title: 'Product Manager Career Path',
    alumniCount: 17,
    successRate: 92,
    timeline: '3-4 years',
    keySteps: [
      'Learn product strategy',
      'Ship features end-to-end',
      'Build cross-functional skills',
      'Lead product vision'
    ]
  }
];

const AIRoadmap = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { sendConnectionRequest, hasPendingRequest, isConnected } = useConnections();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [selectedGoal, setSelectedGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
  const [popularPaths, setPopularPaths] = useState<CareerPath[]>(FALLBACK_CAREER_PATHS);
  
  const [selectedAlumni, setSelectedAlumni] = useState<RelatedAlumni | null>(null);
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Set<number>>(new Set());
  
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');

  // Fetch popular paths and saved roadmaps on mount
  useEffect(() => {
    fetchPopularPaths();
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      fetchSavedRoadmaps();
    }
  }, [user]);

  const fetchPopularPaths = async () => {
    setIsLoadingPaths(true);
    try {
      const headers: Record<string, string> = {};
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/career-roadmap/popular`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match CareerPath interface
        const paths: CareerPath[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          alumniCount: item.alumni_count,
          successRate: item.success_rate,
          timeline: item.estimated_duration,
          keySteps: item.key_steps,
          topCompanies: item.top_companies,
          alumniPreview: item.alumni_preview?.map((a: any) => ({
            id: a.id,
            name: a.name,
            avatar: a.avatar,
            job_title: a.job_title,
            company: a.company,
            is_mentor: a.is_mentor
          })),
          hasMentors: item.has_mentors
        }));
        setPopularPaths(paths);
      }
    } catch (error) {
      console.error('Failed to fetch popular paths:', error);
      // Keep fallback data
    } finally {
      setIsLoadingPaths(false);
    }
  };

  const fetchSavedRoadmaps = async () => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return;
      
      const response = await fetch(`${API_BASE_URL}/career-roadmap/my-roadmaps`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedRoadmaps(data.roadmaps || []);
      }
    } catch (error) {
      console.error('Failed to fetch saved roadmaps:', error);
    }
  };

  const generateRoadmap = async (formData: {
    careerGoal: string;
    currentRole: string;
    yearsExperience: number;
    additionalContext: string;
  }) => {
    // Get fresh token from localStorage
    const authToken = localStorage.getItem('auth_token');
    
    // Check if user is logged in
    if (!authToken) {
      toast({
        title: 'Login Required',
        description: 'Please log in to generate a personalized career roadmap.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setIsGenerating(true);
    setGeneratedRoadmap(null);

    try {
      console.log('Generating roadmap for:', formData.careerGoal);
      
      const response = await fetch(`${API_BASE_URL}/career-roadmap/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          career_goal: formData.careerGoal,
          current_role: formData.currentRole || undefined,
          years_experience: formData.yearsExperience,
          additional_context: formData.additionalContext || undefined,
        }),
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Generate error:', errorText);
        throw new Error('Failed to generate roadmap');
      }

      const data: GeneratedRoadmap = await response.json();
      setGeneratedRoadmap(data);
      setCompletedMilestones(new Set());
      
      toast({
        title: 'Roadmap generated!',
        description: 'Your personalized career roadmap is ready.',
      });

      if (data.related_alumni && data.related_alumni.length > 0) {
        setTimeout(() => {
          toast({
            title: `${data.related_alumni.length} alumni found!`,
            description: 'Click on them to connect and get guidance.',
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      toast({
        title: 'Generation failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRoadmap = async () => {
    if (!generatedRoadmap) return;

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      toast({
        title: 'Login Required',
        description: 'Please log in to save your roadmap.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/career-roadmap/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          career_goal: selectedGoal,
          title: generatedRoadmap.title,
          summary: generatedRoadmap.summary,
          estimated_duration: generatedRoadmap.estimated_duration,
          milestones: generatedRoadmap.milestones,
          skills_required: generatedRoadmap.skills_required,
          is_public: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save roadmap');
      }

      toast({
        title: 'Roadmap saved!',
        description: 'You can find it in "My Roadmaps" tab.',
      });

      fetchSavedRoadmaps();

    } catch (error) {
      console.error('Failed to save roadmap:', error);
      toast({
        title: 'Save failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseTemplate = (careerPath: CareerPath) => {
    setSelectedGoal(careerPath.title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAlumniPreviewClick = (alumni: AlumniPreview) => {
    // Convert AlumniPreview to RelatedAlumni format for the modal
    setSelectedAlumni({
      id: alumni.id,
      name: alumni.name,
      avatar: alumni.avatar,
      job_title: alumni.job_title,
      company: alumni.company,
      is_mentor: alumni.is_mentor,
      match_reason: alumni.is_mentor 
        ? "Mentor available for guidance" 
        : `Works as ${alumni.job_title || 'professional'}`
    });
    setShowAlumniModal(true);
  };

  const handleAlumniClick = (alumni: RelatedAlumni) => {
    setSelectedAlumni(alumni);
    setShowAlumniModal(true);
  };

  const handleConnectAlumni = async (alumniId: string) => {
    try {
      await sendConnectionRequest(alumniId);
      toast({
        title: 'Connection request sent!',
        description: 'They will be notified of your request.',
      });
      setShowAlumniModal(false);
    } catch (error) {
      toast({
        title: 'Failed to send request',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewProfile = (alumniId: string) => {
    setShowAlumniModal(false);
    navigate(`/profile/${alumniId}`);
  };

  const toggleMilestoneComplete = (milestoneId: number) => {
    setCompletedMilestones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId);
      } else {
        newSet.add(milestoneId);
      }
      return newSet;
    });
  };

  const progressPercentage = generatedRoadmap
    ? Math.round((completedMilestones.size / generatedRoadmap.milestones.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
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

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'generate' ? 'default' : 'outline'}
              onClick={() => setActiveTab('generate')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate New
            </Button>
            <Button
              variant={activeTab === 'saved' ? 'default' : 'outline'}
              onClick={() => setActiveTab('saved')}
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              My Roadmaps ({savedRoadmaps.length})
            </Button>
          </div>

          {activeTab === 'generate' && (
            <>
              {/* Roadmap Form */}
              <RoadmapForm
                onSubmit={(data) => {
                  setSelectedGoal(data.careerGoal);
                  generateRoadmap(data);
                }}
                isLoading={isGenerating}
                initialGoal={selectedGoal}
              />

              {/* Generated Roadmap */}
              {generatedRoadmap && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Roadmap Header */}
                  <Card className="p-5 sm:p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">{generatedRoadmap.title}</h2>
                        <p className="text-muted-foreground mb-4">{generatedRoadmap.summary}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{generatedRoadmap.estimated_duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-primary" />
                            <span>{generatedRoadmap.milestones.length} milestones</span>
                          </div>
                          {generatedRoadmap.salary_range && (
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4 text-primary" />
                              <span>{generatedRoadmap.salary_range}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={saveRoadmap}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Roadmap
                      </Button>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Your Progress</span>
                        <span className="text-muted-foreground">{progressPercentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Related Alumni Section */}
                  {generatedRoadmap.related_alumni && generatedRoadmap.related_alumni.length > 0 && (
                    <Card className="p-5 sm:p-6 border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-lg">Alumni Who Can Help</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {generatedRoadmap.related_alumni.length} matches
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect with these alumni who work in similar roles or have achieved your career goals.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {generatedRoadmap.related_alumni.map((alumni) => (
                          <div
                            key={alumni.id}
                            onClick={() => handleAlumniClick(alumni)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={alumni.avatar} />
                              <AvatarFallback>{alumni.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{alumni.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {alumni.job_title}{alumni.company ? ` at ${alumni.company}` : ''}
                              </p>
                              {alumni.is_mentor && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  <Star className="w-3 h-3 mr-1" />
                                  Mentor
                                </Badge>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Milestones */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Career Milestones
                    </h3>
                    {generatedRoadmap.milestones.map((milestone, index) => (
                      <Card
                        key={milestone.id}
                        className={`p-4 sm:p-5 rounded-xl transition-all ${
                          completedMilestones.has(milestone.id)
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'hover:border-primary/30'
                        }`}
                      >
                        <div className="flex gap-3">
                          <button
                            onClick={() => toggleMilestoneComplete(milestone.id)}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {completedMilestones.has(milestone.id) ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Step {index + 1}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {milestone.duration}
                                  </Badge>
                                </div>
                                <h4 className={`font-semibold ${completedMilestones.has(milestone.id) ? 'line-through text-muted-foreground' : ''}`}>
                                  {milestone.title}
                                </h4>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedMilestone(
                                  expandedMilestone === milestone.id ? null : milestone.id
                                )}
                              >
                                {expandedMilestone === milestone.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {milestone.description}
                            </p>

                            {expandedMilestone === milestone.id && (
                              <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2">
                                {milestone.skills.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Skills to develop:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {milestone.skills.map((skill, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {milestone.resources.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Resources:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {milestone.resources.map((resource, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                          <BookOpen className="w-3 h-3" />
                                          {resource}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {milestone.tips && (
                                  <div className="p-3 bg-primary/5 rounded-lg">
                                    <p className="text-sm">
                                      <span className="font-medium">💡 Tip:</span> {milestone.tips}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Skills Required */}
                  {generatedRoadmap.skills_required.length > 0 && (
                    <Card className="p-5 sm:p-6 rounded-xl">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Skills You'll Need
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {generatedRoadmap.skills_required.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Market Insights */}
                  {generatedRoadmap.market_insights && (
                    <Card className="p-5 sm:p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20 rounded-xl">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Market Insights
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {generatedRoadmap.market_insights}
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {/* Popular Career Paths Section */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold">Popular Career Paths</h2>
                  {isLoadingPaths && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading real-time data...
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {popularPaths.map((path) => (
                    <CareerPathCard
                      key={path.id}
                      careerPath={path}
                      onUseTemplate={handleUseTemplate}
                      onAlumniClick={handleAlumniPreviewClick}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Saved Roadmaps Tab */}
          {activeTab === 'saved' && (
            <div>
              {savedRoadmaps.length === 0 ? (
                <Card className="p-8 text-center rounded-xl">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No saved roadmaps yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate a roadmap and save it to track your progress.
                  </p>
                  <Button onClick={() => setActiveTab('generate')} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Your First Roadmap
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {savedRoadmaps.map((roadmap) => (
                    <Card key={roadmap.id} className="p-5 sm:p-6 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{roadmap.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Goal: {roadmap.career_goal}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Target className="w-4 h-4" />
                              {roadmap.milestones.length} milestones
                            </div>
                            {roadmap.estimated_duration && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {roadmap.estimated_duration}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <GraduationCap className="w-4 h-4" />
                              Saved {new Date(roadmap.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" className="gap-2">
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <MobileNav />

      {/* Alumni Profile Modal */}
      <Dialog open={showAlumniModal} onOpenChange={setShowAlumniModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with Alumni</DialogTitle>
            <DialogDescription>
              This alumni can help you on your career journey
            </DialogDescription>
          </DialogHeader>
          {selectedAlumni && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAlumni.avatar} />
                  <AvatarFallback className="text-xl">
                    {selectedAlumni.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedAlumni.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedAlumni.job_title}
                    {selectedAlumni.company && ` at ${selectedAlumni.company}`}
                  </p>
                  {selectedAlumni.is_mentor && (
                    <Badge className="mt-1">
                      <Star className="w-3 h-3 mr-1" />
                      Mentor
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Why they can help:</span>{' '}
                  {selectedAlumni.match_reason}
                </p>
              </div>

              {selectedAlumni.major && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedAlumni.major}</span>
                  {selectedAlumni.graduation_year && (
                    <span className="text-muted-foreground">
                      • Class of {selectedAlumni.graduation_year}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleConnectAlumni(selectedAlumni.id)}
                  disabled={isConnected(selectedAlumni.id) || hasPendingRequest(selectedAlumni.id)}
                >
                  {isConnected(selectedAlumni.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Connected
                    </>
                  ) : hasPendingRequest(selectedAlumni.id) ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Request Pending
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleViewProfile(selectedAlumni.id)}
                >
                  <Users className="w-4 h-4" />
                  View Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIRoadmap;
