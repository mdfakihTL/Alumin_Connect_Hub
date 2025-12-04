import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  linkUrl: string;
  placement: 'left-sidebar' | 'right-sidebar' | 'feed';
  targetUniversities: string[]; // 'all' or specific university IDs
  isActive: boolean;
  createdDate: string;
}

const SuperAdminAds = () => {
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    linkUrl: '',
    placement: 'feed' as 'left-sidebar' | 'right-sidebar' | 'feed',
    targetAll: true,
    selectedUniversities: [] as string[],
  });

  useEffect(() => {
    loadAds();
    loadUniversities();
  }, []);

  const loadUniversities = () => {
    const unis = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    setUniversities(unis);
  };

  const loadAds = () => {
    const stored = JSON.parse(localStorage.getItem('super_admin_ads') || '[]');
    setAds(stored);
  };

  const handleCreate = () => {
    if (!formData.title || !formData.mediaUrl) {
      toast({
        title: 'Missing information',
        description: 'Please fill in title and media URL',
        variant: 'destructive',
      });
      return;
    }

    const newAd: Ad = {
      id: `ad_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      mediaUrl: formData.mediaUrl,
      mediaType: formData.mediaType,
      linkUrl: formData.linkUrl,
      placement: formData.placement,
      targetUniversities: formData.targetAll ? ['all'] : formData.selectedUniversities,
      isActive: true,
      createdDate: new Date().toISOString(),
    };

    const updatedAds = [...ads, newAd];
    localStorage.setItem('super_admin_ads', JSON.stringify(updatedAds));
    setAds(updatedAds);

    toast({
      title: 'Ad created',
      description: `Ad will be shown to ${formData.targetAll ? 'all universities' : formData.selectedUniversities.length + ' universities'}`,
    });

    resetForm();
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      mediaUrl: ad.mediaUrl,
      mediaType: ad.mediaType,
      linkUrl: ad.linkUrl,
      placement: ad.placement,
      targetAll: ad.targetUniversities.includes('all'),
      selectedUniversities: ad.targetUniversities.filter(id => id !== 'all'),
    });
    setIsModalOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAd) return;

      const updated = ads.map(ad => 
        ad.id === editingAd.id 
          ? {
              ...ad,
              title: formData.title,
              description: formData.description,
              mediaUrl: formData.mediaUrl,
              mediaType: formData.mediaType,
              linkUrl: formData.linkUrl,
              placement: formData.placement,
              targetUniversities: formData.targetAll ? ['all'] : formData.selectedUniversities,
            }
          : ad
      );

    localStorage.setItem('super_admin_ads', JSON.stringify(updated));
    setAds(updated);

    toast({
      title: 'Ad updated',
      description: 'Ad has been updated successfully',
    });

    resetForm();
  };

  const handleToggleActive = (ad: Ad) => {
    const updated = ads.map(a => 
      a.id === ad.id ? { ...a, isActive: !a.isActive } : a
    );
    localStorage.setItem('super_admin_ads', JSON.stringify(updated));
    setAds(updated);

    toast({
      title: ad.isActive ? 'Ad deactivated' : 'Ad activated',
      description: ad.isActive ? 'Ad is no longer visible' : 'Ad is now visible to users',
    });
  };

  const handleDelete = (ad: Ad) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      const updated = ads.filter(a => a.id !== ad.id);
      localStorage.setItem('super_admin_ads', JSON.stringify(updated));
      setAds(updated);

      toast({
        title: 'Ad deleted',
        description: 'Ad has been removed',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
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
    return targets.map(id => universities.find(u => u.id === id)?.name || id).join(', ');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold">Ad Management</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create and manage ads across universities
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ad
          </Button>
        </div>
      </Card>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No ads created yet</p>
          </Card>
        ) : (
          ads.map(ad => (
            <Card key={ad.id} className="p-4 hover:shadow-lg transition-shadow">
              {ad.imageUrl && (
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-lg flex-1">{ad.title}</h3>
                <Badge variant={ad.isActive ? 'default' : 'secondary'}>
                  {ad.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ad.description}</p>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Target:</p>
                <Badge variant="outline" className="text-xs">
                  {getTargetDisplay(ad.targetUniversities)}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(ad)} className="flex-1">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleToggleActive(ad)}>
                  {ad.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(ad)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</DialogTitle>
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
              <Label htmlFor="mediaType">Media Type *</Label>
              <Select value={formData.mediaType} onValueChange={(value: any) => setFormData({ ...formData, mediaType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaUrl">{formData.mediaType === 'video' ? 'Video' : 'Image'} URL *</Label>
              <Input
                id="mediaUrl"
                placeholder={formData.mediaType === 'video' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
                value={formData.mediaUrl}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL (Learn More Target) *</Label>
              <Input
                id="linkUrl"
                placeholder="https://example.com/offer"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">This URL opens when user clicks "Learn More"</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placement">Ad Placement *</Label>
              <Select value={formData.placement} onValueChange={(value: any) => setFormData({ ...formData, placement: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left-sidebar">Left Sidebar (Next to Feed)</SelectItem>
                  <SelectItem value="right-sidebar">Right Sidebar (Next to Feed)</SelectItem>
                  <SelectItem value="feed">In Feed (Between Posts)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose where this ad appears on alumni dashboard</p>
            </div>

            <div className="space-y-3">
              <Label>Target Universities</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="targetAll"
                  checked={formData.targetAll}
                  onCheckedChange={(checked) => setFormData({ ...formData, targetAll: checked as boolean })}
                />
                <label htmlFor="targetAll" className="text-sm font-medium cursor-pointer">
                  Show to all universities
                </label>
              </div>

              {!formData.targetAll && (
                <div className="space-y-2 pl-6">
                  {universities.map(uni => (
                    <div key={uni.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={uni.id}
                        checked={formData.selectedUniversities.includes(uni.id)}
                        onCheckedChange={() => toggleUniversity(uni.id)}
                      />
                      <label htmlFor={uni.id} className="text-sm cursor-pointer">
                        {uni.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={editingAd ? handleUpdate : handleCreate} className="w-full">
              {editingAd ? 'Update Ad' : 'Create Ad'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminAds;

