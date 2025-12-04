import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { GraduationCap, Briefcase, MapPin, Award, ArrowRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProfileCompletion = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    currentPosition: '',
    company: '',
    location: '',
    skills: '',
    isAvailableForMentorship: false,
    bio: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleSubmit = () => {
    // Convert skills string to array
    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

    // Update profile with completion data
    updateProfile({
      bio: formData.bio,
      isMentor: formData.isAvailableForMentorship,
    });

    // Store additional profile data in localStorage
    const profileData = {
      currentPosition: formData.currentPosition,
      company: formData.company,
      location: formData.location,
      skills: skillsArray,
      isAvailableForMentorship: formData.isAvailableForMentorship,
      profileCompleted: true,
      completedDate: new Date().toISOString(),
    };

    localStorage.setItem(`profile_data_${user?.id}`, JSON.stringify(profileData));
    localStorage.setItem(`profile_completion_${user?.id}`, 'true');

    toast({
      title: 'Profile completed!',
      description: 'Welcome to AlumniHub! Your profile is now set up.',
    });

    navigate('/dashboard');
  };

  const handleSkip = () => {
    localStorage.setItem(`profile_completion_${user?.id}`, 'skipped');
    navigate('/dashboard');
  };

  const canProceed = () => {
    if (currentStep === 1) return formData.currentPosition && formData.company;
    if (currentStep === 2) return formData.location;
    if (currentStep === 3) return formData.skills;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Help us personalize your experience and connect you with the right opportunities
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          {/* Step 1: Employment */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Employment Information</h2>
                  <p className="text-sm text-muted-foreground">Tell us about your current role</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Current Position *</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Software Engineer, Product Manager"
                    value={formData.currentPosition}
                    onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google, Microsoft, Startup Inc"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Brief Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself, your journey, and what you're passionate about..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Location</h2>
                  <p className="text-sm text-muted-foreground">Where are you based?</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Current Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA or London, UK"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This helps connect you with nearby alumni and relevant local events
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Skills & Mentorship */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Skills & Mentorship</h2>
                  <p className="text-sm text-muted-foreground">Share your expertise</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills & Expertise *</Label>
                  <Textarea
                    id="skills"
                    placeholder="e.g., JavaScript, React, Product Management, Marketing (comma separated)"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate skills with commas
                  </p>
                </div>

                {/* Only show mentorship option if not a recent graduate */}
                {user?.graduationYear && new Date().getFullYear() - user.graduationYear >= 2 && (
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Label htmlFor="mentorship" className="text-base font-semibold">
                          Available for Mentorship
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Help other alumni and students by becoming a mentor
                        </p>
                      </div>
                      <Switch
                        id="mentorship"
                        checked={formData.isAvailableForMentorship}
                        onCheckedChange={(checked) => setFormData({ ...formData, isAvailableForMentorship: checked })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Skip for Now
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex-1"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="flex-1"
              >
                Complete Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {currentStep > 1 && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="w-full mt-3"
              size="sm"
            >
              ← Back
            </Button>
          )}
        </Card>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step === currentStep
                  ? 'w-8 bg-primary'
                  : step < currentStep
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;

