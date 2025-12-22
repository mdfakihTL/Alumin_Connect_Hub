import { useState, useEffect, useCallback } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Sparkles, MessageCircle, Briefcase, GraduationCap, MapPin, Menu, Trophy, Star, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { mentorsApi, MentorProfile as APIMentorProfile, MentorMatchResponse } from '@/api/mentors';

interface MentorProfile {
  id: string;
  userId: string;  // User ID for messaging
  name: string;
  avatar: string;
  title: string;
  company: string;
  university: string;
  graduationYear: string;
  location: string;
  expertise: string[];
  bio: string;
  availability: 'High' | 'Medium' | 'Low';
  matchScore: number;
  mentees: number;
  yearsExperience: number;
}

// Transform API response to frontend format
const transformMentor = (apiMentor: APIMentorProfile): MentorProfile => ({
  id: apiMentor.id,
  userId: apiMentor.user_id,  // Store user ID for messaging
  name: apiMentor.name,
  avatar: apiMentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiMentor.name}`,
  title: apiMentor.title || 'Professional',
  company: apiMentor.company || 'Company',
  university: apiMentor.university || 'University',
  graduationYear: apiMentor.graduation_year || '',
  location: apiMentor.location || 'Location',
  expertise: apiMentor.expertise || [],
  bio: apiMentor.bio || 'Experienced professional ready to mentor.',
  availability: apiMentor.availability || 'Medium',
  matchScore: apiMentor.match_score || 75,
  mentees: apiMentor.mentees_count || 0,
  yearsExperience: apiMentor.years_experience || 0,
});

const MentorshipMatch = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [mentorProfiles, setMentorProfiles] = useState<MentorProfile[]>([]);
  const [matches, setMatches] = useState<MentorMatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [passed, setPassed] = useState<MentorProfile[]>([]);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'matches'>('discover');

  // Load mentors from API
  const loadMentors = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mentorsRes, matchesRes] = await Promise.all([
        mentorsApi.getAvailableMentors({ page_size: 50 }),
        mentorsApi.getMyMatches(),
      ]);
      
      setMentorProfiles(mentorsRes.mentors.map(transformMentor));
      setMatches(matchesRes.matches);
      setCurrentIndex(0);
      setPassed([]);
    } catch (error) {
      console.error('Failed to load mentors:', error);
      toast({
        title: 'Failed to load mentors',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load data on mount
  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const currentMentor = mentorProfiles[currentIndex];
  const hasMore = currentIndex < mentorProfiles.length;

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!hasMore || !currentMentor || isMatching) return;

    setSwipeDirection(direction);

    setTimeout(async () => {
      if (direction === 'right') {
        // Match - save to database
        setIsMatching(true);
        try {
          const result = await mentorsApi.createMatch(currentMentor.id);
          
          // Add to local matches
          const newMatch: MentorMatchResponse = {
            id: result.match_id,
            mentor_id: currentMentor.id,
            mentor_user_id: currentMentor.userId,  // Include user ID for messaging
            mentor_name: currentMentor.name,
            mentor_avatar: currentMentor.avatar,
            mentor_title: currentMentor.title,
            mentor_company: currentMentor.company,
            status: 'matched',
            matched_at: new Date().toISOString(),
          };
          setMatches(prev => [newMatch, ...prev]);
          
          setShowMatchAnimation(true);
          
          toast({
            title: "It's a Match! 🎉",
            description: `You matched with ${currentMentor.name}! You can now message them.`,
          });

          setTimeout(() => setShowMatchAnimation(false), 2000);
        } catch (error: any) {
          toast({
            title: 'Match failed',
            description: error.detail || 'Please try again',
            variant: 'destructive',
          });
        } finally {
          setIsMatching(false);
        }
      } else {
        // Passed
        setPassed(prev => [...prev, currentMentor]);
      }

      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'High': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <MobileNav />
      
      <main className={`min-h-screen pb-24 md:pb-0 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex-1 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 flex-shrink-0"
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                  Find Your Mentor
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Connect with experienced alumni
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-3 sm:mb-4 flex-shrink-0">
              <Button
                variant={activeTab === 'discover' ? 'default' : 'outline'}
                onClick={() => setActiveTab('discover')}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Discover ({Math.max(0, mentorProfiles.length - currentIndex)})
              </Button>
              <Button
                variant={activeTab === 'matches' ? 'default' : 'outline'}
                onClick={() => setActiveTab('matches')}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                <GraduationCap className="w-4 h-4 mr-1.5" />
                Matches ({matches.length})
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={loadMentors}
                disabled={isLoading}
                className="h-9 w-9"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Content */}
            {activeTab === 'discover' ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto subtle-scrollbar">
                <div className="max-w-4xl w-full mx-auto flex flex-col py-2">
                {isLoading ? (
                  <div className="flex items-center justify-center flex-1 min-h-[400px]">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-500" />
                      <p className="text-muted-foreground">Finding mentors for you...</p>
                    </div>
                  </div>
                ) : hasMore && currentMentor ? (
                  <>
                    {/* Match Animation Overlay */}
                    {showMatchAnimation && (
                      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/95 via-cyan-500/95 to-blue-600/95 z-50 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <div className="text-center text-white">
                          <div className="relative inline-block mb-6">
                            <Star className="w-24 h-24 sm:w-32 sm:h-32 mx-auto animate-bounce fill-yellow-400 text-yellow-400" />
                            <Sparkles className="w-8 h-8 absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
                          </div>
                          <h3 className="text-3xl sm:text-4xl font-bold mb-4">Perfect Match!</h3>
                          <p className="text-base sm:text-lg">You can now connect with {currentMentor.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Mentor Card */}
                    <div 
                      className={`transition-all duration-300 mb-4 ${
                        swipeDirection === 'left' ? 'translate-x-[-150%] rotate-[-25deg] opacity-0' :
                        swipeDirection === 'right' ? 'translate-x-[150%] rotate-[25deg] opacity-0' :
                        'translate-x-0 rotate-0 opacity-100'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                        {/* Left Column - Profile & Stats */}
                        <Card className="overflow-hidden border-2 border-purple-500/30 shadow-xl flex flex-col relative">
                          {/* Match Score Badge */}
                          <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs px-2 py-0.5">
                              <Star className="w-3 h-3 mr-1 fill-white" />
                              {currentMentor.matchScore}%
                            </Badge>
                          </div>

                          {/* Avatar Section */}
                          <div className="p-3 sm:p-4 text-center bg-gradient-to-b from-purple-500/10 via-pink-500/10 to-transparent">
                            <img
                              src={currentMentor.avatar}
                              alt={currentMentor.name}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto ring-4 ring-purple-500/30 shadow-lg mb-2"
                            />
                            <h2 className="font-bold text-lg sm:text-xl mb-1">{currentMentor.name}</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1.5">{currentMentor.title}</p>
                            <Badge className={`${getAvailabilityColor(currentMentor.availability)} border text-[10px] px-2 py-0.5`}>
                              {currentMentor.availability} Availability
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                            <div className="grid grid-cols-3 gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                              <div className="text-center">
                                <p className="text-lg sm:text-xl font-bold text-primary">{currentMentor.yearsExperience}</p>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Years Exp.</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg sm:text-xl font-bold text-purple-600">{currentMentor.mentees}</p>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Mentees</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg sm:text-xl font-bold text-blue-600">{currentMentor.matchScore}%</p>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Match</p>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Right Column - Details */}
                        <Card className="overflow-hidden border-2 border-border shadow-xl flex flex-col">
                          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex-1 overflow-y-auto subtle-scrollbar max-h-[400px] lg:max-h-none">
                            {/* Details */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-2.5">
                                <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm">{currentMentor.company}</p>
                                  <p className="text-xs text-muted-foreground">{currentMentor.title}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm">{currentMentor.university}</p>
                                  <p className="text-xs text-muted-foreground">Class of {currentMentor.graduationYear}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <p className="font-semibold text-sm">{currentMentor.location}</p>
                              </div>
                            </div>

                            {/* Expertise Tags */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                <Trophy className="w-3.5 h-3.5" />
                                Expertise
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {currentMentor.expertise.map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Bio */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">About</p>
                              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">{currentMentor.bio}</p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Swipe Buttons */}
                    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-3 mt-4 border-t border-border/50">
                      <div className="flex items-center justify-center gap-4 sm:gap-6">
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => handleSwipe('left')}
                          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-red-500/50 hover:bg-red-500/10 hover:border-red-500 hover:scale-110 transition-all shadow-lg"
                        >
                          <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                        </Button>
                        <Button
                          size="lg"
                          onClick={() => handleSwipe('right')}
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl hover:scale-110 transition-all"
                        >
                          <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </Button>
                      </div>
                      <div className="text-center mt-2 space-y-0.5">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Swipe right to match • Left to pass
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {currentIndex + 1} of {mentorProfiles.length}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <Card className="p-6 sm:p-8 text-center space-y-4 max-w-md">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto">
                        <Sparkles className="w-10 h-10 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-2">You've seen everyone!</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {matches.length > 0 
                            ? `Great! You matched with ${matches.length} mentor${matches.length > 1 ? 's' : ''}!`
                            : "No matches yet. Try again!"}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={loadMentors}
                          disabled={isLoading}
                          className="gap-2 text-sm"
                          size="sm"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Refresh Mentors
                        </Button>
                        {matches.length > 0 && (
                          <Button 
                            onClick={() => setActiveTab('matches')}
                            className="gap-2 text-sm"
                            size="sm"
                          >
                            <GraduationCap className="w-4 h-4" />
                            View Matches ({matches.length})
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
                </div>
              </div>
            ) : (
              /* Matches Tab */
              <div className="flex-1 overflow-y-auto subtle-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {matches.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center min-h-[400px]">
                      <Card className="p-10 text-center max-w-md border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative mb-5">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center">
                                <GraduationCap className="w-7 h-7 text-purple-500/60" />
                              </div>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
                          <p className="text-sm text-muted-foreground max-w-sm mb-5">
                            Start swiping to find your perfect mentor! Each match brings you closer to valuable career guidance.
                          </p>
                          <Button onClick={() => setActiveTab('discover')} className="gap-2">
                            Start Matching
                          </Button>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    matches.map((match) => (
                      <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all">
                        <div className="relative">
                          <div className="p-4 text-center bg-gradient-to-b from-purple-500/10 to-transparent">
                            <img
                              src={match.mentor_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.mentor_name}`}
                              alt={match.mentor_name}
                              className="w-16 h-16 rounded-full mx-auto ring-4 ring-purple-500/20 mb-2"
                            />
                            <h4 className="font-bold text-sm mb-1 truncate">{match.mentor_name}</h4>
                            <p className="text-xs text-muted-foreground mb-1 truncate">{match.mentor_title || 'Mentor'}</p>
                            {match.mentor_company && (
                              <Badge className="text-xs">{match.mentor_company}</Badge>
                            )}
                          </div>

                          <div className="p-3 space-y-2.5">
                            <div className="text-xs text-muted-foreground text-center">
                              Matched {new Date(match.matched_at).toLocaleDateString()}
                            </div>

                            <Button 
                              className="w-full gap-2 h-8 text-xs"
                              size="sm"
                              onClick={() => {
                                navigate('/chat', {
                                  state: {
                                    selectedUser: {
                                      userId: match.mentor_user_id,
                                      id: match.mentor_user_id,
                                      name: match.mentor_name,
                                      avatar: match.mentor_avatar,
                                    }
                                  }
                                });
                              }}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MentorshipMatch;

