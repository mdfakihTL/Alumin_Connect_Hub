import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
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

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileData) => void;
  currentData: ProfileData;
  isSaving?: boolean;
}

const ProfileEditModal = ({ open, onClose, onSubmit, currentData, isSaving = false }: ProfileEditModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileData>(currentData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(currentData);
    setAvatarPreview(null);
    setBannerPreview(null);
  }, [currentData, open]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      handleChange('avatar', url);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
      handleChange('banner', url);
    }
  };

  const handleRemoveAvatar = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'default'}`;
    setAvatarPreview(defaultAvatar);
    handleChange('avatar', defaultAvatar);
  };

  const handleRemoveBanner = () => {
    setBannerPreview('');
    handleChange('banner', '');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || isSaving) return;
    await onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Banner Image */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Banner Image</Label>
            <div className="relative group">
              <div className="h-32 sm:h-40 rounded-lg overflow-hidden bg-gradient-to-r from-primary to-secondary">
                {(bannerPreview || formData.banner) && (
                  <img
                    src={bannerPreview || formData.banner}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => bannerInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
                {(bannerPreview || formData.banner) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveBanner}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={avatarPreview || formData.avatar}
                  alt="Profile"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-background"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-10 w-10 rounded-full"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="w-full text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-base font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="h-11"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={3}
                  className="resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree" className="text-base font-medium">Degree</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => handleChange('degree', e.target.value)}
                  className="h-11"
                  placeholder="e.g., Bachelor of Science, MBA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major" className="text-base font-medium">Major/Field</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => handleChange('major', e.target.value)}
                  className="h-11"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear" className="text-base font-medium">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => handleChange('graduationYear', e.target.value)}
                  className="h-11"
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Professional Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-base font-medium">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => handleChange('jobTitle', e.target.value)}
                  className="h-11"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-base font-medium">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="h-11"
                  placeholder="e.g., Google"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="location" className="text-base font-medium">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="h-11"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="h-11"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-medium">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="h-11"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="text-base font-medium">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  className="h-11"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github" className="text-base font-medium">GitHub URL</Label>
                <Input
                  id="github"
                  type="url"
                  value={formData.github}
                  onChange={(e) => handleChange('github', e.target.value)}
                  className="h-11"
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-base font-medium">Personal Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="h-11"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || isSaving}
              className="flex-1 h-11"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;

