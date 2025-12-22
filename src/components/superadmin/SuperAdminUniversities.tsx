import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, CheckCircle, XCircle, Users, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { superadminApi } from '@/api/superadmin';
import { apiClient } from '@/lib/api';

interface University {
  id: string;
  name: string;
  logo?: string;
  is_enabled: boolean;
  alumni_count: number;
  admin_count: number;
  colors?: {
    light: { primary: string; secondary: string; accent: string };
    dark: { primary: string; secondary: string; accent: string };
  };
}

const SuperAdminUniversities = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [deletingUniversity, setDeletingUniversity] = useState<University | null>(null);
  const [universityList, setUniversityList] = useState<University[]>([]);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    logo: '',
    enabled: true,
    lightPrimary: '#3B82F6',
    lightSecondary: '#6B7280',
    lightAccent: '#10B981',
    darkPrimary: '#60A5FA',
    darkSecondary: '#9CA3AF',
    darkAccent: '#34D399',
  });

  const loadUniversities = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the apiClient to get universities with full details
      const response = await apiClient.getSuperAdminUniversities();
      setUniversityList(response.map((uni: any) => ({
        id: uni.id,
        name: uni.name,
        logo: uni.logo,
        is_enabled: uni.is_enabled,
        alumni_count: uni.alumni_count || 0,
        admin_count: uni.admin_count || 0,
        colors: uni.colors,
      })));
    } catch (error: any) {
      console.error('Failed to load universities:', error);
      toast({
        title: 'Error loading universities',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      logo: '',
      enabled: true,
      lightPrimary: '#3B82F6',
      lightSecondary: '#6B7280',
      lightAccent: '#10B981',
      darkPrimary: '#60A5FA',
      darkSecondary: '#9CA3AF',
      darkAccent: '#34D399',
    });
    setEditingUniversity(null);
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.name) {
      toast({
        title: 'Missing information',
        description: 'Please fill in ID and Name',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await superadminApi.createUniversity({
        id: formData.id.toLowerCase().replace(/\s+/g, ''),
        name: formData.name,
        logo: formData.logo || undefined,
        colors: JSON.stringify({
          light: {
            primary: formData.lightPrimary,
            secondary: formData.lightSecondary,
            accent: formData.lightAccent,
          },
          dark: {
            primary: formData.darkPrimary,
            secondary: formData.darkSecondary,
            accent: formData.darkAccent,
          },
        }),
      });

      toast({
        title: 'University created',
        description: `${formData.name} has been added successfully`,
      });

      resetForm();
      setIsModalOpen(false);
      loadUniversities();
    } catch (error: any) {
      toast({
        title: 'Failed to create university',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (uni: University) => {
    setEditingUniversity(uni);
    setFormData({
      id: uni.id,
      name: uni.name,
      logo: uni.logo || '',
      enabled: uni.is_enabled,
      lightPrimary: uni.colors?.light?.primary || '#3B82F6',
      lightSecondary: uni.colors?.light?.secondary || '#6B7280',
      lightAccent: uni.colors?.light?.accent || '#10B981',
      darkPrimary: uni.colors?.dark?.primary || '#60A5FA',
      darkSecondary: uni.colors?.dark?.secondary || '#9CA3AF',
      darkAccent: uni.colors?.dark?.accent || '#34D399',
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUniversity) return;

    setIsSubmitting(true);
    try {
      await superadminApi.updateUniversity(editingUniversity.id, {
        name: formData.name,
        logo: formData.logo || undefined,
        is_enabled: formData.enabled,
        colors: JSON.stringify({
          light: {
            primary: formData.lightPrimary,
            secondary: formData.lightSecondary,
            accent: formData.lightAccent,
          },
          dark: {
            primary: formData.darkPrimary,
            secondary: formData.darkSecondary,
            accent: formData.darkAccent,
          },
        }),
      });

      toast({
        title: 'University updated',
        description: `${formData.name} has been updated successfully`,
      });

      resetForm();
      setIsModalOpen(false);
      loadUniversities();
    } catch (error: any) {
      toast({
        title: 'Failed to update university',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = async (uni: University) => {
    try {
      await superadminApi.updateUniversity(uni.id, {
        is_enabled: !uni.is_enabled,
      });

      toast({
        title: uni.is_enabled ? 'University disabled' : 'University enabled',
        description: `${uni.name} is now ${uni.is_enabled ? 'disabled' : 'enabled'}`,
      });

      loadUniversities();
    } catch (error: any) {
      toast({
        title: 'Action failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = (uni: University) => {
    setDeletingUniversity(uni);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUniversity) return;

    setIsSubmitting(true);
    try {
      await superadminApi.deleteUniversity(deletingUniversity.id);

      toast({
        title: 'University deleted',
        description: `${deletingUniversity.name} has been removed`,
        variant: 'destructive',
      });

      setIsDeleteModalOpen(false);
      setDeletingUniversity(null);
      loadUniversities();
    } catch (error: any) {
      toast({
        title: 'Failed to delete university',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              University Management
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage all university instances • {universityList.length} universities
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadUniversities} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add University
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && universityList.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Universities Grid */}
      {!isLoading && universityList.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-primary/60" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Plus className="w-4 h-4 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Universities Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-sm">
              Add your first university to start managing alumni networks. Each university gets its own branding and user base.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add First University
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universityList.map(uni => (
            <Card key={uni.id} className={`p-4 hover:shadow-lg transition-shadow ${!uni.is_enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {uni.logo ? (
                    <img src={uni.logo} alt={uni.name} className="w-12 h-12 rounded-lg object-contain bg-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{uni.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {uni.id}</p>
                  </div>
                </div>
                {uni.is_enabled ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                    <XCircle className="w-3 h-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>

              <div className="mb-4 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{uni.alumni_count} Alumni</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {uni.admin_count} Admin{uni.admin_count !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(uni)} className="flex-1">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleToggleEnabled(uni)}
                  className="flex-1"
                >
                  {uni.is_enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDeleteConfirm(uni)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {editingUniversity ? 'Edit University' : 'Add New University'}
            </DialogTitle>
            <DialogDescription>
              {editingUniversity 
                ? 'Update the university details and branding colors.'
                : 'Create a new university with custom branding.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">University ID *</Label>
                <Input
                  id="id"
                  placeholder="e.g., mit, stanford, harvard"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  disabled={!!editingUniversity}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">University Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Harvard University"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                placeholder="https://example.com/logo.png"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="enabled">University Status</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this university</p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Light Theme Colors</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lightPrimary" className="text-xs">Primary</Label>
                  <Input
                    id="lightPrimary"
                    type="color"
                    value={formData.lightPrimary}
                    onChange={(e) => setFormData({ ...formData, lightPrimary: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lightSecondary" className="text-xs">Secondary</Label>
                  <Input
                    id="lightSecondary"
                    type="color"
                    value={formData.lightSecondary}
                    onChange={(e) => setFormData({ ...formData, lightSecondary: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lightAccent" className="text-xs">Accent</Label>
                  <Input
                    id="lightAccent"
                    type="color"
                    value={formData.lightAccent}
                    onChange={(e) => setFormData({ ...formData, lightAccent: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dark Theme Colors</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="darkPrimary" className="text-xs">Primary</Label>
                  <Input
                    id="darkPrimary"
                    type="color"
                    value={formData.darkPrimary}
                    onChange={(e) => setFormData({ ...formData, darkPrimary: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="darkSecondary" className="text-xs">Secondary</Label>
                  <Input
                    id="darkSecondary"
                    type="color"
                    value={formData.darkSecondary}
                    onChange={(e) => setFormData({ ...formData, darkSecondary: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="darkAccent" className="text-xs">Accent</Label>
                  <Input
                    id="darkAccent"
                    type="color"
                    value={formData.darkAccent}
                    onChange={(e) => setFormData({ ...formData, darkAccent: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={editingUniversity ? handleUpdate : handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingUniversity ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingUniversity ? 'Update University' : 'Create University'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete University
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingUniversity?.name}</strong>? 
              This will remove all associated data including users, posts, and settings. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setDeletingUniversity(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete University
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminUniversities;
