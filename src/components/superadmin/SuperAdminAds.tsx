import { useState, useEffect } from 'react';
import { apiClient, AdResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2, 
  RefreshCw,
  Upload,
  ExternalLink,
  BarChart3,
  LayoutGrid,
  TableIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface University {
  id: string;
  name: string;
  logo?: string;
  is_enabled: boolean;
  alumni_count?: number;
}

const SuperAdminAds = () => {
  const { toast } = useToast();
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
    placement: 'feed' as 'left-sidebar' | 'right-sidebar' | 'feed',
    targetAll: true,
    selectedUniversities: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [adsResponse, universitiesResponse] = await Promise.all([
        apiClient.getAds(true),
        apiClient.getSuperAdminUniversities()
      ]);
      setAds(adsResponse.ads);
      setUniversities(universitiesResponse);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      const errorMessage = err.message || 'Failed to load advertisements';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.image) {
      toast({
        title: 'Missing information',
        description: 'Please fill in title and image URL',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const newAd = await apiClient.createAd({
        title: formData.title,
        description: formData.description || undefined,
        image: formData.image,
        link: formData.link || undefined,
        placement: formData.placement,
        target_universities: formData.targetAll ? ['all'] : formData.selectedUniversities,
      });

      setAds([newAd, ...ads]);
      toast({
        title: 'Ad created',
        description: `Ad will be shown to ${formData.targetAll ? 'all universities' : formData.selectedUniversities.length + ' universities'}`,
      });
      resetForm();
    } catch (error: any) {
      console.error('Failed to create ad:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ad',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (ad: AdResponse) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image: ad.image || ad.media_url || '',
      link: ad.link || ad.link_url || '',
      placement: ad.placement,
      targetAll: (ad.target_universities || []).includes('all'),
      selectedUniversities: (ad.target_universities || []).filter(id => id !== 'all'),
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingAd) return;

    setIsSaving(true);
    try {
      const updatedAd = await apiClient.updateAd(editingAd.id, {
        title: formData.title,
        description: formData.description || undefined,
        image: formData.image,
        link: formData.link || undefined,
        placement: formData.placement,
        target_universities: formData.targetAll ? ['all'] : formData.selectedUniversities,
      });

      setAds(ads.map(ad => ad.id === editingAd.id ? updatedAd : ad));
      toast({
        title: 'Ad updated',
        description: 'Ad has been updated successfully',
      });
      resetForm();
    } catch (error: any) {
      console.error('Failed to update ad:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update ad',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (ad: AdResponse) => {
    try {
      const updatedAd = await apiClient.toggleAdStatus(ad.id);
      setAds(ads.map(a => a.id === ad.id ? updatedAd : a));
      toast({
        title: updatedAd.is_active ? 'Ad activated' : 'Ad deactivated',
        description: updatedAd.is_active ? 'Ad is now visible to users' : 'Ad is no longer visible',
      });
    } catch (error: any) {
      console.error('Failed to toggle ad:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle ad status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ad: AdResponse) => {
    if (!window.confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteAd(ad.id);
      setAds(ads.filter(a => a.id !== ad.id));
      toast({
        title: 'Ad deleted',
        description: 'Ad has been removed',
      });
    } catch (error: any) {
      console.error('Failed to delete ad:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete ad',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      link: '',
      placement: 'feed',
      targetAll: true,
      selectedUniversities: [],
    });
    setEditingAd(null);
    setIsModalOpen(false);
  };

  const toggleUniversity = (uniId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedUniversities: prev.selectedUniversities.includes(uniId)
        ? prev.selectedUniversities.filter(id => id !== uniId)
        : [...prev.selectedUniversities, uniId]
    }));
  };

  const getTargetDisplay = (targets: string[]) => {
    if (targets.includes('all')) return 'All Universities';
    const names = targets.map(id => universities.find(u => u.id === id)?.name || id);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  };

  const getPlacementLabel = (placement: string) => {
    switch (placement) {
      case 'left-sidebar': return 'Left Sidebar';
      case 'right-sidebar': return 'Right Sidebar';
      case 'feed': return 'In Feed';
      default: return placement;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" 
               style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-64 bg-gradient-to-r from-muted to-muted/50" />
              <Skeleton className="h-4 w-48 bg-gradient-to-r from-muted/80 to-muted/30" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-10 w-28 rounded-md" />
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted/30 rounded-lg p-3 border border-border/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </Card>

        {/* Ads Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden relative group">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                   style={{ padding: '1px', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite linear' }} />
              
              {/* Media Skeleton */}
              <div className="relative aspect-video overflow-hidden">
                <Skeleton className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute top-2 right-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                {/* Animated loading indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 animate-ping absolute inset-0" />
                    <div className="w-12 h-12 rounded-full border-2 border-t-primary border-primary/20 animate-spin" />
                    <Image className="w-5 h-5 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                
                {/* Analytics Skeleton */}
                <div className="flex items-center gap-4 p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
                
                {/* Actions Skeleton */}
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Loading message */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 animate-pulse" />
            <div className="w-16 h-16 rounded-full border-4 border-t-primary border-transparent animate-spin absolute inset-0" />
            <BarChart3 className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading advertisements...</p>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        
        {/* Add shimmer animation keyframes via style tag */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5">
          <div className="flex flex-col items-center justify-center">
            {/* Error Icon */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                <span className="text-destructive-foreground text-xs font-bold">!</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-destructive mb-2">Failed to Load Advertisements</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {error}
            </p>
            
            <div className="flex gap-3">
              <Button onClick={loadData} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
            
            {/* Helpful tips */}
            <div className="mt-8 text-left bg-muted/50 rounded-lg p-4 max-w-md">
              <p className="text-sm font-medium mb-2">Troubleshooting tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Check your internet connection
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Verify you have the required permissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Try refreshing the page
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold">Advertisement Management</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create and manage ads across all universities
            </p>
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('grid')} 
                title="Grid View"
                className="rounded-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setViewMode('table')} 
                title="Table View"
                className="rounded-none"
              >
                <TableIcon className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={loadData} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-2xl font-bold">{ads.length}</p>
            <p className="text-xs text-muted-foreground">Total Ads</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">{ads.filter(a => a.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-2xl font-bold">{ads.reduce((sum, a) => sum + a.impressions, 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-2xl font-bold">{ads.reduce((sum, a) => sum + a.clicks, 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Clicks</p>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {ads.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
          <div className="flex flex-col items-center justify-center">
            {/* Decorative Icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Image className="w-8 h-8 text-primary/60" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Plus className="w-4 h-4 text-primary" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">No Advertisements Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first advertisement to start reaching alumni across all universities. 
              Ads can appear in feeds or sidebars.
            </p>
            
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Ad
            </Button>
            
            {/* Quick tips */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl">
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Rich Media</span>
                </div>
                <p className="text-xs text-muted-foreground">Support for images and videos</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Analytics</span>
                </div>
                <p className="text-xs text-muted-foreground">Track views, clicks & CTR</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Targeting</span>
                </div>
                <p className="text-xs text-muted-foreground">Target specific universities</p>
              </div>
            </div>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Ads Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ads.map(ad => (
            <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image Preview */}
              <div className="relative aspect-video bg-muted">
                <img 
                  src={ad.image || ad.media_url} 
                  alt={ad.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x225?text=Image+Not+Found';
                  }}
                />
                <Badge 
                  variant={ad.is_active ? 'default' : 'secondary'} 
                  className="absolute top-2 right-2"
                >
                  {ad.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{ad.title}</h3>
                
                {ad.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ad.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Placement:</span>
                    <Badge variant="outline">{getPlacementLabel(ad.placement)}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="text-right max-w-[150px] truncate" title={getTargetDisplay(ad.target_universities)}>
                      {getTargetDisplay(ad.target_universities)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(ad.created_at)}</span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{ad.impressions.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>{ad.clicks.toLocaleString()} clicks</span>
                  </div>
                  {ad.impressions > 0 && (
                    <div className="ml-auto">
                      <span className="font-medium">
                        {((ad.clicks / ad.impressions) * 100).toFixed(1)}% CTR
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(ad)} className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleToggleActive(ad)}
                    title={ad.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {ad.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  {ad.link_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(ad.link_url, '_blank')}
                      title="Open link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(ad)}
                    className="text-destructive hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Ads Table View */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[80px]">Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map(ad => (
                  <TableRow key={ad.id} className="group hover:bg-muted/30">
                    {/* Preview */}
                    <TableCell className="p-2">
                      <div className="w-16 h-10 rounded overflow-hidden bg-muted relative">
                        <img 
                          src={ad.image || ad.media_url} 
                          alt={ad.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/64x40?text=N/A';
                          }}
                        />
                      </div>
                    </TableCell>
                    
                    {/* Title */}
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium truncate" title={ad.title}>{ad.title}</p>
                        {ad.description && (
                          <p className="text-xs text-muted-foreground truncate" title={ad.description}>
                            {ad.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      <Badge variant={ad.is_active ? 'default' : 'secondary'} className="whitespace-nowrap">
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    
                    {/* Type */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Image className="w-3 h-3" /> Image
                      </div>
                    </TableCell>
                    
                    {/* Placement */}
                    <TableCell>
                      <Badge variant="outline" className="whitespace-nowrap text-xs">
                        {getPlacementLabel(ad.placement)}
                      </Badge>
                    </TableCell>
                    
                    {/* Target */}
                    <TableCell>
                      <span className="text-xs max-w-[120px] truncate block" title={getTargetDisplay(ad.target_universities)}>
                        {getTargetDisplay(ad.target_universities)}
                      </span>
                    </TableCell>
                    
                    {/* Views */}
                    <TableCell className="text-right font-mono text-sm">
                      {ad.impressions.toLocaleString()}
                    </TableCell>
                    
                    {/* Clicks */}
                    <TableCell className="text-right font-mono text-sm">
                      {ad.clicks.toLocaleString()}
                    </TableCell>
                    
                    {/* CTR */}
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm ${ad.impressions > 0 && (ad.clicks / ad.impressions) * 100 >= 2 ? 'text-green-600' : ''}`}>
                        {ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%` : '—'}
                      </span>
                    </TableCell>
                    
                    {/* Created */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(ad.created_at)}
                    </TableCell>
                    
                    {/* Actions */}
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(ad)} title="Edit" className="h-8 w-8 p-0">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleToggleActive(ad)}
                          title={ad.is_active ? 'Deactivate' : 'Activate'}
                          className="h-8 w-8 p-0"
                        >
                          {ad.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        {ad.link_url && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(ad.link_url, '_blank')}
                            title="Open link"
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDelete(ad)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Table Footer Summary */}
          <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing all {ads.length} advertisement{ads.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-4 text-muted-foreground">
              <span>Total Views: <strong className="text-foreground">{ads.reduce((sum, a) => sum + a.impressions, 0).toLocaleString()}</strong></span>
              <span>Total Clicks: <strong className="text-foreground">{ads.reduce((sum, a) => sum + a.clicks, 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsModalOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}</DialogTitle>
            <DialogDescription>
              {editingAd 
                ? 'Update the advertisement details below.' 
                : 'Fill in the details to create a new advertisement.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Ad Title *</Label>
              <Input
                id="title"
                placeholder="Master Your Career"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Professional development courses from top universities"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placement">Placement *</Label>
              <Select 
                value={formData.placement} 
                onValueChange={(value: 'left-sidebar' | 'right-sidebar' | 'feed') => setFormData({ ...formData, placement: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left-sidebar">Left Sidebar</SelectItem>
                  <SelectItem value="right-sidebar">Right Sidebar</SelectItem>
                  <SelectItem value="feed">In Feed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ad Image *</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="flex-1"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Validate file size (10MB max)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: 'File too large',
                          description: 'Maximum file size is 10MB',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      setIsUploading(true);
                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);
                        
                        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/admin/ads/upload-image`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('access_token')}`,
                          },
                          body: formDataUpload,
                        });
                        
                        if (!response.ok) {
                          throw new Error('Upload failed');
                        }
                        
                        const data = await response.json();
                        setFormData(prev => ({ ...prev, image: data.url }));
                        toast({
                          title: 'Image uploaded',
                          description: 'Your image has been uploaded successfully',
                        });
                      } catch (error) {
                        console.error('Upload error:', error);
                        toast({
                          title: 'Upload failed',
                          description: 'Failed to upload image. Please try again.',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  <Button type="button" variant="outline" disabled={isUploading} asChild>
                    <span>
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter image URL or click upload button to select an image (max 10MB)
              </p>
              {formData.image && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link URL (Learn More Target)</Label>
              <Input
                id="link"
                placeholder="https://example.com/offer"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This URL opens when user clicks "Learn More"
              </p>
            </div>

            <div className="space-y-3">
              <Label>Target Universities</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="targetAll"
                  checked={formData.targetAll}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    targetAll: checked as boolean,
                    selectedUniversities: checked ? [] : formData.selectedUniversities
                  })}
                />
                <label htmlFor="targetAll" className="text-sm font-medium cursor-pointer">
                  Show to all universities
                </label>
              </div>

              {!formData.targetAll && (
                <div className="space-y-2 pl-6 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading universities...
                    </div>
                  ) : universities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No universities found</p>
                  ) : (
                    universities.map(uni => (
                      <div key={uni.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={uni.id}
                          checked={formData.selectedUniversities.includes(uni.id)}
                          onCheckedChange={() => toggleUniversity(uni.id)}
                        />
                        <label htmlFor={uni.id} className="text-sm cursor-pointer flex items-center gap-2 flex-1">
                          {uni.logo && (
                            <img src={uni.logo} alt="" className="w-5 h-5 rounded object-cover" />
                          )}
                          <span className="flex-1">{uni.name}</span>
                          {uni.alumni_count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {uni.alumni_count} alumni
                            </span>
                          )}
                          {!uni.is_enabled && (
                            <Badge variant="secondary" className="text-xs">Disabled</Badge>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              )}
              {!formData.targetAll && formData.selectedUniversities.length === 0 && (
                <p className="text-xs text-destructive">
                  Please select at least one university
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={resetForm} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={editingAd ? handleUpdate : handleCreate} 
              disabled={isSaving || !formData.title || !formData.image || (!formData.targetAll && formData.selectedUniversities.length === 0)}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingAd ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingAd ? 'Update Ad' : 'Create Ad'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminAds;
