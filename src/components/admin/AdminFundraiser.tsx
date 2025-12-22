/**
 * AdminFundraiser Component
 * 
 * Admin panel for managing fundraiser campaigns.
 * Features:
 * - Create, edit, activate, deactivate, delete fundraisers
 * - View click analytics per campaign
 * - Track total and unique clicks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, Plus, Edit, Trash2, Calendar, ExternalLink, MousePointerClick,
  Users, TrendingUp, BarChart3, AlertCircle, CheckCircle, Clock, Eye,
  Loader2, RefreshCw, Upload, ImageIcon, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fundraiserApi, Fundraiser, FundraiserAnalyticsSummary, isValidUrl, getDaysRemaining } from '@/api/fundraiser';

// Status badge colors
const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  active: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  expired: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="w-3 h-3" />,
  active: <CheckCircle className="w-3 h-3" />,
  scheduled: <Calendar className="w-3 h-3" />,
  expired: <AlertCircle className="w-3 h-3" />,
};

interface FormData {
  title: string;
  description: string;
  image: string;
  donation_link: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'expired';
}

const initialFormData: FormData = {
  title: '',
  description: '',
  image: '',
  donation_link: '',
  start_date: '',
  end_date: '',
  status: 'draft',
};

const AdminFundraiser = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [analytics, setAnalytics] = useState<FundraiserAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFundraiser, setEditingFundraiser] = useState<Fundraiser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, analyticsRes] = await Promise.all([
        fundraiserApi.listAdmin({ 
          page: 1, 
          page_size: 100,
          status_filter: statusFilter !== 'all' ? statusFilter : undefined 
        }),
        fundraiserApi.getAnalyticsSummary(),
      ]);
      
      setFundraisers(listRes.fundraisers);
      setAnalytics(analyticsRes);
    } catch (error: any) {
      console.error('[AdminFundraiser] Failed to load data:', error);
      toast({
        title: 'Failed to load fundraisers',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.donation_link.trim()) {
      errors.donation_link = 'Donation link is required';
    } else if (!isValidUrl(formData.donation_link)) {
      errors.donation_link = 'Please enter a valid URL (starting with http:// or https://)';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    } else if (formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    if (formData.image && !isValidUrl(formData.image)) {
      errors.image = 'Please enter a valid image URL';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setEditingFundraiser(null);
    setImagePreview(null);
  };

  // Handle image file selection and upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Upload to S3
    setIsUploadingImage(true);
    try {
      const result = await fundraiserApi.uploadImage(file);
      setFormData(prev => ({ ...prev, image: result.url }));
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully',
      });
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      // Clear preview on error
      setImagePreview(null);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (editingFundraiser) {
        await fundraiserApi.update(editingFundraiser.id, {
          title: formData.title,
          description: formData.description,
          image: formData.image || undefined,
          donation_link: formData.donation_link,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
        });
        toast({
          title: 'Fundraiser updated',
          description: 'The campaign has been updated successfully',
        });
      } else {
        await fundraiserApi.create({
          title: formData.title,
          description: formData.description,
          image: formData.image || undefined,
          donation_link: formData.donation_link,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
        });
        toast({
          title: 'Fundraiser created',
          description: 'The campaign has been created successfully',
        });
      }
      
      resetForm();
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('[AdminFundraiser] Submit error:', error);
      toast({
        title: editingFundraiser ? 'Failed to update' : 'Failed to create',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (fundraiser: Fundraiser) => {
    setEditingFundraiser(fundraiser);
    setFormData({
      title: fundraiser.title,
      description: fundraiser.description || '',
      image: fundraiser.image || '',
      donation_link: fundraiser.donation_link,
      start_date: fundraiser.start_date,
      end_date: fundraiser.end_date,
      status: fundraiser.status,
    });
    setFormErrors({});
    // Set image preview if editing with existing image
    setImagePreview(fundraiser.image || null);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await fundraiserApi.delete(id);
      toast({
        title: 'Fundraiser deleted',
        description: 'The campaign has been removed',
      });
      setDeleteConfirmId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (fundraiser: Fundraiser, newStatus: 'draft' | 'active' | 'expired') => {
    try {
      await fundraiserApi.update(fundraiser.id, { status: newStatus });
      toast({
        title: 'Status updated',
        description: `Fundraiser is now ${newStatus}`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Failed to update status',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Card className="p-10 text-center col-span-full border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
      <div className="flex flex-col items-center justify-center">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-emerald-500/60" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
            <Plus className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Fundraisers Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-5">
          Create your first fundraising campaign to engage alumni. We'll track clicks on your donation links to measure engagement.
        </p>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Create First Fundraiser
        </Button>
      </div>
    </Card>
  );

  // Track broken images
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  
  const handleImageError = (fundraiserId: string) => {
    setBrokenImages(prev => new Set(prev).add(fundraiserId));
  };

  // Render fundraiser card
  const renderFundraiserCard = (fundraiser: Fundraiser) => {
    const daysRemaining = getDaysRemaining(fundraiser.end_date);
    const effectiveStatus = fundraiser.effective_status;
    const showImage = fundraiser.image && !brokenImages.has(fundraiser.id);
    
    return (
      <Card key={fundraiser.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        {showImage && (
          <div className="relative h-36 overflow-hidden bg-muted">
            <img 
              src={fundraiser.image!} 
              alt={fundraiser.title}
              className="w-full h-full object-cover"
              onError={() => handleImageError(fundraiser.id)}
            />
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className={`${statusColors[effectiveStatus] || statusColors.draft} flex items-center gap-1`}>
                {statusIcons[effectiveStatus]}
                {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
              </Badge>
            </div>
          </div>
        )}
        
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold text-lg line-clamp-1">{fundraiser.title}</h3>
            {!showImage && (
              <Badge variant="outline" className={`${statusColors[effectiveStatus] || statusColors.draft} flex items-center gap-1 shrink-0`}>
                {statusIcons[effectiveStatus]}
                {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
              </Badge>
            )}
          </div>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{fundraiser.description}</p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MousePointerClick className="w-4 h-4" />
                Total Clicks
              </div>
              <p className="text-xl font-bold">{fundraiser.total_clicks}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Unique Alumni
              </div>
              <p className="text-xl font-bold">{fundraiser.unique_clicks}</p>
            </div>
          </div>
          
          {/* Date info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="w-4 h-4" />
            <span>{new Date(fundraiser.start_date).toLocaleDateString()} - {new Date(fundraiser.end_date).toLocaleDateString()}</span>
            {effectiveStatus === 'active' && daysRemaining > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {daysRemaining} days left
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => handleEdit(fundraiser)} className="flex-1">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            
            <Select
              value={fundraiser.status}
              onValueChange={(value: 'draft' | 'active' | 'expired') => handleStatusChange(fundraiser, value)}
            >
              <SelectTrigger className="w-[110px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDeleteConfirmId(fundraiser.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* External link */}
          <Button 
            size="sm" 
            variant="link" 
            className="w-full mt-2 text-primary"
            onClick={() => window.open(fundraiser.donation_link, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Donation Page
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-2xl font-bold mb-2">Fundraiser Management</h2>
            <p className="text-sm text-muted-foreground">
              Create donation campaigns shown as ads to alumni. Track engagement through click analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Fundraiser
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingFundraiser ? 'Edit Fundraiser' : 'Create New Fundraiser'}</DialogTitle>
                  <DialogDescription>
                    {editingFundraiser 
                      ? 'Update the campaign details below.' 
                      : 'Create a new donation campaign. Alumni will see this as an ad.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Campaign Title *</Label>
                    <Input
                      id="title"
                      placeholder="Annual Alumni Fund 2025"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={formErrors.title ? 'border-destructive' : ''}
                    />
                    {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Help us build a better future for our students..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={formErrors.description ? 'border-destructive' : ''}
                    />
                    {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
                  </div>
                  
                  {/* Image Upload */}
                  <div className="space-y-3">
                    <Label>Campaign Image (optional)</Label>
                    
                    {/* Image Preview */}
                    {(formData.image || imagePreview) && (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={imagePreview || formData.image} 
                          alt="Campaign preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.classList.add('hidden');
                          }}
                        />
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={handleRemoveImage}
                          disabled={isUploadingImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    {!formData.image && !imagePreview && (
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-2">
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Click to upload image</p>
                                <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB)</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Or enter URL manually */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">or enter URL</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    
                    <Input
                      id="image"
                      placeholder="https://images.unsplash.com/photo-xxx.jpg"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setImagePreview(null);
                      }}
                      className={formErrors.image ? 'border-destructive' : ''}
                      disabled={isUploadingImage}
                    />
                    {formErrors.image && <p className="text-xs text-destructive">{formErrors.image}</p>}
                  </div>
                  
                  {/* Donation Link */}
                  <div className="space-y-2">
                    <Label htmlFor="link">Donation Link *</Label>
                    <Input
                      id="link"
                      placeholder="https://donate.university.edu/campaign"
                      value={formData.donation_link}
                      onChange={(e) => setFormData({ ...formData, donation_link: e.target.value })}
                      className={formErrors.donation_link ? 'border-destructive' : ''}
                    />
                    {formErrors.donation_link && <p className="text-xs text-destructive">{formErrors.donation_link}</p>}
                    <p className="text-xs text-muted-foreground">
                      External URL where alumni will be redirected when they click "Donate Now"
                    </p>
                  </div>
                  
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start">Start Date *</Label>
                      <Input
                        id="start"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className={formErrors.start_date ? 'border-destructive' : ''}
                      />
                      {formErrors.start_date && <p className="text-xs text-destructive">{formErrors.start_date}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">End Date *</Label>
                      <Input
                        id="end"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className={formErrors.end_date ? 'border-destructive' : ''}
                      />
                      {formErrors.end_date && <p className="text-xs text-destructive">{formErrors.end_date}</p>}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'draft' | 'active' | 'expired') => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Draft - Not visible to alumni
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Active - Visible to alumni
                          </div>
                        </SelectItem>
                        <SelectItem value="expired">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Expired - Campaign ended
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Info box */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                    <Eye className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Only <strong>Active</strong> fundraisers within their date range will be shown to alumni. 
                      We track clicks on the donation link - not payment amounts.
                    </p>
                  </div>
                </div>
                
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingFundraiser ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingFundraiser ? 'Update Fundraiser' : 'Create Fundraiser'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        {!isLoading && analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{analytics.total_fundraisers}</p>
              <p className="text-sm text-muted-foreground">Total Fundraisers</p>
            </div>
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.active_fundraisers}</p>
              <p className="text-sm text-muted-foreground">Active Now</p>
            </div>
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.total_clicks}</p>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
            </div>
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.unique_alumni}</p>
              <p className="text-sm text-muted-foreground">Unique Alumni</p>
            </div>
          </div>
        )}
      </Card>

      {/* Filter tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        
        <TabsContent value={statusFilter} className="mt-4">
          {isLoading ? (
            renderLoadingSkeleton()
          ) : fundraisers.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {fundraisers.map(renderFundraiserCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fundraiser?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All click analytics for this fundraiser will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFundraiser;
