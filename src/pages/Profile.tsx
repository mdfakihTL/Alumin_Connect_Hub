import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConnections } from '@/contexts/ConnectionsContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import ProfileEditModal from '@/components/ProfileEditModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Briefcase, Calendar, Mail, Linkedin, Edit, MessageCircle, ArrowLeft, Plus, Phone, Globe, Camera, UserCheck, UserPlus, Clock, Menu, Award, TrendingUp, Github, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { alumniService, FrontendAlumniProfile } from '@/services/alumniService';

interface UserData {
  name: string;
  avatar: string;
  university: string;
  year: string;
  major?: string;
  email?: string;
}

export interface ProfileData {
  name: string;
  bio: string;
  major: string;
  degree: string;
  graduationYear: string;
  jobTitle: string;
  company: string;
  location: string;
  linkedin: string;
  github: string;
  email: string;
  phone: string;
  website: string;
  avatar: string;
  banner: string;
}

// API loading states
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

const Profile = () => {
  const { user, isAuthenticated, updateAlumniProfile, refreshAlumniProfile } = useAuth();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, hasPendingRequest, sendConnectionRequest } = useConnections();
  
  // Get user data from navigation state (when viewing other user's profile)
  const viewingUserData = location.state?.userData as UserData | undefined;
  const isOwnProfile = !viewingUserData;
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [additionalProfileData, setAdditionalProfileData] = useState<any>(null);
  
  // API states
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [alumniProfile, setAlumniProfile] = useState<FrontendAlumniProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize profileData state first (before using it in useEffect)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    bio: '',
    major: '',
    degree: '',
    graduationYear: '',
    jobTitle: '',
    company: '',
    location: '',
    linkedin: '',
    github: '',
    email: user?.email || '',
    phone: '',
    website: '',
    avatar: user?.avatar || '',
    banner: '',
  });

  // Fetch alumni profile from API
  const fetchAlumniProfile = useCallback(async () => {
    if (!isOwnProfile || !isAuthenticated) return;
    
    setLoadingState('loading');
    setApiError(null);
    
    try {
      const profile = await alumniService.getMyProfile();
      setAlumniProfile(profile);
      
      // Merge API data with profile data
      setProfileData(prev => ({
        ...prev,
        bio: profile.bio || prev.bio,
        major: profile.major || prev.major,
        degree: profile.degree || prev.degree,
        graduationYear: profile.graduationYear?.toString() || prev.graduationYear,
        jobTitle: profile.currentPosition || prev.jobTitle,
        company: profile.company || prev.company,
        location: profile.location || prev.location,
        linkedin: profile.linkedinUrl || prev.linkedin,
        github: profile.githubUrl || prev.github,
        website: profile.website || prev.website,
      }));
      
      setLoadingState('success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setApiError(errorMessage);
      setLoadingState('error');
      
      // Only show toast for unexpected errors, not 404 (new profile)
      if (!errorMessage.includes('not found')) {
        toast({
          title: 'Error loading profile',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  }, [isOwnProfile, isAuthenticated, toast]);

  // Fetch profile on mount
  useEffect(() => {
    fetchAlumniProfile();
  }, [fetchAlumniProfile]);

  // Calculate profile completion percentage
  useEffect(() => {
    if (isOwnProfile && user) {
      const stored = localStorage.getItem(`profile_data_${user.id}`);
      if (stored) {
        setAdditionalProfileData(JSON.parse(stored));
      }

      // Calculate completion based on both user data and profile data
      let completed = 0;
      const total = 12;

      if (user.name) completed++;
      if (user.email) completed++;
      if (user.university) completed++;
      if (profileData.graduationYear) completed++;
      if (profileData.major) completed++;
      if (profileData.bio) completed++;
      if (profileData.jobTitle) completed++;
      if (profileData.company) completed++;
      if (profileData.location) completed++;
      if (profileData.linkedin) completed++;
      if (profileData.website || profileData.github) completed++;
      if (stored) {
        const data = JSON.parse(stored);
        if (data.skills && data.skills.length > 0) completed++;
      }

      setProfileCompletion(Math.round((completed / total) * 100));
    }
  }, [user, isOwnProfile, profileData]);
  
  // Check connection status
  const connected = !isOwnProfile && isConnected(viewingUserData?.name || '');
  const requestPending = !isOwnProfile && hasPendingRequest(viewingUserData?.name || '');

  // Update profile data when user changes
  useEffect(() => {
    if (user && isOwnProfile) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        avatar: user.avatar || prev.avatar,
      }));
    }
  }, [user, isOwnProfile]);
  
  // Use either logged-in user data or the data passed from feed
  const displayUser = isOwnProfile ? profileData : {
    ...profileData,
    name: viewingUserData.name,
    avatar: viewingUserData.avatar,
    university: viewingUserData.university,
    graduationYear: viewingUserData.year,
    major: viewingUserData.major || 'Not specified',
    email: viewingUserData.email || 'Not available',
  };

  const handleSaveProfile = async (data: ProfileData) => {
    setIsSaving(true);
    
    try {
      // Prepare data for API
      const updateData: Partial<FrontendAlumniProfile> = {
        graduationYear: data.graduationYear ? parseInt(data.graduationYear, 10) : null,
        degree: data.degree || null,
        major: data.major || null,
        currentPosition: data.jobTitle || null,
        company: data.company || null,
        location: data.location || null,
        bio: data.bio || null,
        linkedinUrl: data.linkedin || null,
        githubUrl: data.github || null,
        website: data.website || null,
      };

      // Call API to update profile
      const updatedProfile = await alumniService.updateMyProfile(updateData);
      
      // Update local state with API response
      setAlumniProfile(updatedProfile);
      setProfileData(prev => ({
        ...prev,
        ...data,
        // Ensure API values are reflected
        bio: updatedProfile.bio || data.bio,
        major: updatedProfile.major || data.major,
        degree: updatedProfile.degree || data.degree,
        graduationYear: updatedProfile.graduationYear?.toString() || data.graduationYear,
        jobTitle: updatedProfile.currentPosition || data.jobTitle,
        company: updatedProfile.company || data.company,
        location: updatedProfile.location || data.location,
        linkedin: updatedProfile.linkedinUrl || data.linkedin,
        github: updatedProfile.githubUrl || data.github,
        website: updatedProfile.website || data.website,
      }));
      
      // Also refresh the context's alumni profile
      refreshAlumniProfile();
      
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been saved successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      toast({
        title: 'Error saving profile',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Still update local state for optimistic UX
      setProfileData(data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = () => {
    if (viewingUserData) {
      sendConnectionRequest(viewingUserData);
      toast({
        title: 'Connection request sent!',
        description: `Your request has been sent to ${viewingUserData.name}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <MobileNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="max-w-5xl mx-auto">
          {/* Back Button for Other Profiles and Mobile Menu Button */}
          {!isOwnProfile ? (
            <div className="p-3 sm:p-4 lg:p-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2 -ml-2 h-9 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Feed</span>
                <span className="sm:hidden">Back</span>
              </Button>
              {/* Mobile Menu Button for viewing other profiles */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            /* Mobile Menu Button for own profile */
            <div className="p-3 sm:p-4 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isOwnProfile && loadingState === 'loading' && (
            <div className="p-6 space-y-6">
              <div className="relative">
                <Skeleton className="h-32 sm:h-40 md:h-48 lg:h-56 w-full rounded-none" />
                <Skeleton className="absolute -bottom-10 left-4 md:left-8 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full" />
              </div>
              <div className="pt-12 sm:pt-16 md:pt-20 px-4 md:px-8 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <Skeleton className="h-48 w-full" />
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {isOwnProfile && loadingState === 'error' && (
            <div className="p-6">
              <Card className="p-8 text-center border-destructive/50">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">
                  {apiError?.includes('not found') ? 'Profile Not Set Up' : 'Error Loading Profile'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {apiError?.includes('not found') 
                    ? 'Your alumni profile hasn\'t been created yet. Click below to set it up.'
                    : apiError || 'An error occurred while loading your profile.'}
                </p>
                <div className="flex justify-center gap-3">
                  {apiError?.includes('not found') ? (
                    <Button onClick={() => setIsEditModalOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Set Up Profile
                    </Button>
                  ) : (
                    <Button onClick={fetchAlumniProfile} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Cover & Avatar - Show when loaded or for other profiles */}
          {(loadingState !== 'loading' && (loadingState !== 'error' || !isOwnProfile)) && (
          <div className="relative">
            <div className="h-32 sm:h-40 md:h-48 lg:h-56 bg-gradient-to-r from-primary to-secondary overflow-hidden">
              {displayUser.banner && (
                <img
                  src={displayUser.banner}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="absolute -bottom-10 sm:-bottom-12 md:-bottom-16 left-3 sm:left-4 md:left-8">
              <img
                src={displayUser.avatar}
                alt={displayUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover shadow-lg"
              />
            </div>
          </div>
          )}

          {/* Main Profile Content - Show when loaded or for other profiles */}
          {(loadingState !== 'loading' && (loadingState !== 'error' || !isOwnProfile)) && (
          <div className="px-3 sm:px-4 md:px-8 pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1 min-w-0 w-full">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 truncate">{displayUser.name}</h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-1">
                  {displayUser.degree ? `${displayUser.degree} in ` : ''}{displayUser.major || 'Not specified'} • {user?.university}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  {displayUser.jobTitle ? `${displayUser.jobTitle}${displayUser.company ? ` at ${displayUser.company}` : ''}` : 'Position not specified'}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {displayUser.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{displayUser.location}</span>
                    </div>
                  )}
                  {displayUser.graduationYear && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Class of {displayUser.graduationYear}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                {isOwnProfile ? (
                  <Button className="gap-2 flex-1 sm:flex-none" onClick={() => setIsEditModalOpen(true)}>
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      className="gap-2 flex-1 sm:flex-none"
                      onClick={() => navigate('/chat')}
                      disabled={!connected}
                      title={connected ? 'Send a message' : 'Connect first to message'}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                    {connected ? (
                      <Button variant="outline" className="gap-2 flex-1 sm:flex-none" disabled>
                        <UserCheck className="w-4 h-4" />
                        Connected
                      </Button>
                    ) : requestPending ? (
                      <Button variant="outline" className="gap-2 flex-1 sm:flex-none" disabled>
                        <Clock className="w-4 h-4" />
                        Pending
                      </Button>
                    ) : (
                      <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={handleConnect}>
                        <UserPlus className="w-4 h-4" />
                        Connect
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Profile Completion Progress - Only for own profile */}
            {isOwnProfile && profileCompletion < 100 && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Profile Completion</span>
                    <span className="text-sm font-semibold text-primary">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {/* About */}
              <Card className="p-5 sm:p-6 md:col-span-2 space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3">About</h2>
                  {displayUser.bio ? (
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {displayUser.bio}
                    </p>
                  ) : (
                    <p className="text-sm sm:text-base text-muted-foreground/60 italic">
                      No bio added yet. {isOwnProfile && 'Click "Edit Profile" to add one.'}
                    </p>
                  )}
                </div>

                {(displayUser.jobTitle || displayUser.company) && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">Experience</h2>
                  <div className="space-y-4">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base">{displayUser.jobTitle || 'Position not specified'}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {displayUser.company || 'Company not specified'}
                          {' • Present'}
                        </p>
                        {displayUser.location && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{displayUser.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )}

                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">Education</h2>
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">{user?.university || 'University not specified'}</h3>
                      {displayUser.degree && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{displayUser.degree}</p>
                      )}
                      {displayUser.major && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{displayUser.major}</p>
                      )}
                      {displayUser.graduationYear && (
                        <p className="text-xs sm:text-sm text-muted-foreground">Class of {displayUser.graduationYear}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact & Links */}
              <Card className="p-5 sm:p-6 space-y-5 h-fit">
                <h2 className="text-lg sm:text-xl font-semibold">Contact</h2>
                <div className="space-y-3">
                  {displayUser.email && displayUser.email !== 'Not available' && (
                    <a 
                      href={`mailto:${displayUser.email}`} 
                      className="flex items-center gap-3 text-xs sm:text-sm hover:text-primary transition-colors group"
                    >
                      <Mail className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">{displayUser.email}</span>
                    </a>
                  )}
                  {displayUser.phone && (
                    <a 
                      href={`tel:${displayUser.phone}`} 
                      className="flex items-center gap-3 text-xs sm:text-sm hover:text-primary transition-colors group"
                    >
                      <Phone className="w-5 h-5 flex-shrink-0" />
                      <span className="group-hover:underline">{displayUser.phone}</span>
                    </a>
                  )}
                  {displayUser.linkedin && (
                    <a 
                      href={displayUser.linkedin} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-xs sm:text-sm hover:text-primary transition-colors group"
                    >
                      <Linkedin className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">LinkedIn</span>
                    </a>
                  )}
                  {displayUser.github && (
                    <a 
                      href={displayUser.github} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-xs sm:text-sm hover:text-primary transition-colors group"
                    >
                      <Github className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">GitHub</span>
                    </a>
                  )}
                  {displayUser.website && (
                    <a 
                      href={displayUser.website} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-xs sm:text-sm hover:text-primary transition-colors group"
                    >
                      <Globe className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">Website</span>
                    </a>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold mb-3 text-base">Stats</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-primary/5">
                      <p className="text-xl sm:text-2xl font-bold text-primary">156</p>
                      <p className="text-xs text-muted-foreground mt-1">Connections</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/5">
                      <p className="text-xl sm:text-2xl font-bold text-secondary">23</p>
                      <p className="text-xs text-muted-foreground mt-1">Posts</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Profile Edit Modal */}
      {isOwnProfile && (
        <ProfileEditModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleSaveProfile}
          currentData={profileData}
          isSaving={isSaving}
        />
      )}

      <MobileNav />
    </div>
  );
};

export default Profile;
