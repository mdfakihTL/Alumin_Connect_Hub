import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Sparkles, MessageCircle, Briefcase, GraduationCap, MapPin, Menu, Trophy, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface MentorProfile {
  id: number;
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

const mentorProfiles: MentorProfile[] = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahMentor',
    title: 'VP of Engineering',
    company: 'Google',
    university: 'MIT',
    graduationYear: '2015',
    location: 'San Francisco, CA',
    expertise: ['Software Architecture', 'Team Leadership', 'AI/ML', 'Career Growth'],
    bio: 'Passionate about helping early-career engineers navigate tech. 10+ years at FAANG companies. I focus on technical leadership, system design, and career progression strategies.',
    availability: 'Medium',
    matchScore: 95,
    mentees: 12,
    yearsExperience: 10,
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusMentor',
    title: 'Product Director',
    company: 'Meta',
    university: 'Stanford',
    graduationYear: '2012',
    location: 'Menlo Park, CA',
    expertise: ['Product Strategy', 'User Research', 'Go-to-Market', 'B2B SaaS'],
    bio: 'Led products from 0 to 100M users. Love mentoring aspiring product managers. Specialized in product-market fit, roadmapping, and stakeholder management.',
    availability: 'High',
    matchScore: 92,
    mentees: 18,
    yearsExperience: 13,
  },
  {
    id: 3,
    name: 'Dr. Emily Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyMentor',
    title: 'Research Scientist',
    company: 'OpenAI',
    university: 'Harvard',
    graduationYear: '2016',
    location: 'Remote',
    expertise: ['Machine Learning', 'Research', 'Academic Publishing', 'PhD Guidance'],
    bio: 'PhD from Harvard. Published 20+ papers in top AI conferences. Happy to guide students in AI research, paper writing, and academic career paths.',
    availability: 'Low',
    matchScore: 88,
    mentees: 8,
    yearsExperience: 9,
  },
  {
    id: 4,
    name: 'David Kumar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidMentor',
    title: 'Startup Founder & CEO',
    company: 'TechVentures Inc',
    university: 'Berkeley',
    graduationYear: '2013',
    location: 'Austin, TX',
    expertise: ['Entrepreneurship', 'Fundraising', 'Business Strategy', 'Scaling Teams'],
    bio: 'Built 3 startups, 1 successful exit. Raised $50M+ in funding. Here to help founders navigate the startup journey from idea to scale.',
    availability: 'Medium',
    matchScore: 90,
    mentees: 15,
    yearsExperience: 12,
  },
  {
    id: 5,
    name: 'Jennifer Park',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JenniferMentor',
    title: 'Chief Marketing Officer',
    company: 'Stripe',
    university: 'Columbia',
    graduationYear: '2014',
    location: 'New York, NY',
    expertise: ['Digital Marketing', 'Brand Strategy', 'Growth Hacking', 'Content Marketing'],
    bio: '12 years in marketing. Grew brands from seed to IPO. Mentored 50+ marketers. Expert in growth strategies, content creation, and building brands.',
    availability: 'High',
    matchScore: 87,
    mentees: 22,
    yearsExperience: 12,
  },
  {
    id: 6,
    name: 'Robert Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RobertMentor',
    title: 'Principal Designer',
    company: 'Apple',
    university: 'RISD',
    graduationYear: '2011',
    location: 'Cupertino, CA',
    expertise: ['UI/UX Design', 'Design Systems', 'User Research', 'Product Design'],
    bio: 'Led design for multiple Apple products. Passionate about mentoring designers on craft, portfolio building, and career advancement.',
    availability: 'Medium',
    matchScore: 91,
    mentees: 14,
    yearsExperience: 14,
  },
  {
    id: 7,
    name: 'Aisha Mohammed',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AishaMentor',
    title: 'Senior Data Scientist',
    company: 'Netflix',
    university: 'Carnegie Mellon',
    graduationYear: '2017',
    location: 'Los Angeles, CA',
    expertise: ['Data Science', 'Analytics', 'Machine Learning', 'A/B Testing'],
    bio: 'PhD in Statistics. Building recommendation systems at scale. Love helping aspiring data scientists break into the field.',
    availability: 'High',
    matchScore: 89,
    mentees: 10,
    yearsExperience: 8,
  },
  {
    id: 8,
    name: 'Tom Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TomMentor',
    title: 'Director of Sales',
    company: 'Salesforce',
    university: 'Penn',
    graduationYear: '2010',
    location: 'Chicago, IL',
    expertise: ['Enterprise Sales', 'Business Development', 'Negotiation', 'Client Relations'],
    bio: 'Closed $100M+ in deals. Built sales teams from 0 to 50. Mentoring on sales strategy, career growth, and deal execution.',
    availability: 'Medium',
    matchScore: 86,
    mentees: 16,
    yearsExperience: 15,
  },
];

const MentorshipMatch = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [matches, setMatches] = useState<MentorProfile[]>([]);
  const [passed, setPassed] = useState<MentorProfile[]>([]);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'matches'>('discover');

  const currentMentor = mentorProfiles[currentIndex];
  const hasMore = currentIndex < mentorProfiles.length;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!hasMore) return;

    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'right') {
        // Match!
        setMatches(prev => [...prev, currentMentor]);
        setShowMatchAnimation(true);
        
        toast({
          title: "It's a Match! 🎉",
          description: `You matched with ${currentMentor.name}! You can now message them.`,
        });

        setTimeout(() => setShowMatchAnimation(false), 2000);
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
      
      <main className={`h-screen pb-20 md:pb-0 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex-1 flex flex-col overflow-hidden">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
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
                Discover ({mentorProfiles.length - currentIndex})
              </Button>
              <Button
                variant={activeTab === 'matches' ? 'default' : 'outline'}
                onClick={() => setActiveTab('matches')}
                className="flex-1 sm:flex-none h-9 text-sm"
              >
                <GraduationCap className="w-4 h-4 mr-1.5" />
                Matches ({matches.length})
              </Button>
            </div>

            {/* Content */}
            {activeTab === 'discover' ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center">
                {hasMore ? (
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
                      className={`transition-all duration-300 ${
                        swipeDirection === 'left' ? 'translate-x-[-150%] rotate-[-25deg] opacity-0' :
                        swipeDirection === 'right' ? 'translate-x-[150%] rotate-[25deg] opacity-0' :
                        'translate-x-0 rotate-0 opacity-100'
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        {/* Left Column - Profile & Stats */}
                        <Card className="overflow-hidden border-2 border-purple-500/30 shadow-xl flex flex-col">
                          {/* Match Score Badge */}
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                              <Star className="w-3 h-3 mr-1 fill-white" />
                              {currentMentor.matchScore}%
                            </Badge>
                          </div>

                          {/* Avatar Section */}
                          <div className="p-4 sm:p-6 text-center bg-gradient-to-b from-purple-500/10 via-pink-500/10 to-transparent">
                            <img
                              src={currentMentor.avatar}
                              alt={currentMentor.name}
                              className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full mx-auto ring-4 ring-purple-500/30 shadow-lg mb-3"
                            />
                            <h2 className="font-bold text-xl sm:text-2xl mb-1.5">{currentMentor.name}</h2>
                            <p className="text-sm sm:text-base text-muted-foreground mb-2">{currentMentor.title}</p>
                            <Badge className={`${getAvailabilityColor(currentMentor.availability)} border text-xs px-2.5 py-0.5`}>
                              {currentMentor.availability} Availability
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                            <div className="grid grid-cols-3 gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                              <div className="text-center">
                                <p className="text-xl sm:text-2xl font-bold text-primary">{currentMentor.yearsExperience}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Years Exp.</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl sm:text-2xl font-bold text-purple-600">{currentMentor.mentees}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Mentees</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl sm:text-2xl font-bold text-blue-600">{currentMentor.matchScore}%</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">Match</p>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Right Column - Details */}
                        <Card className="overflow-hidden border-2 border-border shadow-xl flex flex-col">
                          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto subtle-scrollbar">
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-primary">{currentMentor.yearsExperience}</p>
                              <p className="text-xs text-muted-foreground">Years Exp.</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">{currentMentor.mentees}</p>
                              <p className="text-xs text-muted-foreground">Mentees</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{currentMentor.matchScore}%</p>
                              <p className="text-xs text-muted-foreground">Match</p>
                            </div>
                          </div>

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
                    <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 flex-shrink-0">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleSwipe('left')}
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-red-500/50 hover:bg-red-500/10 hover:border-red-500 hover:scale-110 transition-all"
                      >
                        <X className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleSwipe('right')}
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl hover:scale-110 transition-all"
                      >
                        <GraduationCap className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                      </Button>
                    </div>

                    <div className="text-center mt-3 sm:mt-4 space-y-1 flex-shrink-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Swipe right to match • Left to pass
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentIndex + 1} of {mentorProfiles.length}
                      </p>
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
                          onClick={() => {
                            setCurrentIndex(0);
                            setPassed([]);
                          }}
                          className="gap-2 text-sm"
                          size="sm"
                        >
                          <Sparkles className="w-4 h-4" />
                          Start Over
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
                      <Card className="p-8 text-center max-w-md">
                        <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start swiping to find your perfect mentor!
                        </p>
                        <Button onClick={() => setActiveTab('discover')} size="sm">
                          Start Matching
                        </Button>
                      </Card>
                    </div>
                  ) : (
                    matches.map((mentor) => (
                      <Card key={mentor.id} className="overflow-hidden hover:shadow-lg transition-all">
                        <div className="relative">
                          <div className="p-4 text-center bg-gradient-to-b from-purple-500/10 to-transparent">
                            <img
                              src={mentor.avatar}
                              alt={mentor.name}
                              className="w-16 h-16 rounded-full mx-auto ring-4 ring-purple-500/20 mb-2"
                            />
                            <h4 className="font-bold text-sm mb-1 truncate">{mentor.name}</h4>
                            <p className="text-xs text-muted-foreground mb-1 truncate">{mentor.title}</p>
                            <Badge className="text-xs">{mentor.company}</Badge>
                          </div>

                          <div className="p-3 space-y-2.5">
                            <div className="flex flex-wrap gap-1">
                              {mentor.expertise.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0.5">
                                  {skill}
                                </Badge>
                              ))}
                              {mentor.expertise.length > 3 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                  +{mentor.expertise.length - 3}
                                </Badge>
                              )}
                            </div>

                            <Button 
                              className="w-full gap-2 h-8 text-xs"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'Chat opened!',
                                  description: `You can now chat with ${mentor.name}`,
                                });
                                navigate('/chat');
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

