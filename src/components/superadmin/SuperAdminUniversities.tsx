import { useState, useEffect } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface University {
  id: string;
  name: string;
  logo: string;
  enabled: boolean;
  alumniCount?: number;
  colors: {
    light: { primary: string; secondary: string; accent: string };
    dark: { primary: string; secondary: string; accent: string };
  };
}

const SuperAdminUniversities = () => {
  const { universities, updateUniversityBranding } = useUniversity();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
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

  const [universityList, setUniversityList] = useState<University[]>([]);

  useEffect(() => {
    // Load universities with enabled status
    const stored = localStorage.getItem('alumni_universities');
    if (stored) {
      const unis = JSON.parse(stored);
      // Add alumni counts
      const unisWithCounts = unis.map((uni: any) => {
        const users = JSON.parse(localStorage.getItem(`alumni_users_${uni.id}`) || '[]');
        return { ...uni, alumniCount: users.length, enabled: uni.enabled !== false };
      });
      setUniversityList(unisWithCounts);
    }
  }, [universities]);

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

  const handleCreate = () => {
    if (!formData.id || !formData.name) {
      toast({
        title: 'Missing information',
        description: 'Please fill in ID and Name',
        variant: 'destructive',
      });
      return;
    }

    const newUniversity: University = {
      id: formData.id,
      name: formData.name,
      logo: formData.logo,
      enabled: formData.enabled,
      colors: {
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
      },
    };

    const stored = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    stored.push(newUniversity);
    localStorage.setItem('alumni_universities', JSON.stringify(stored));

    setUniversityList([...universityList, { ...newUniversity, alumniCount: 0 }]);

    toast({
      title: 'University created',
      description: `${formData.name} has been added successfully`,
    });

    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (uni: University) => {
    setEditingUniversity(uni);
    setFormData({
      id: uni.id,
      name: uni.name,
      logo: uni.logo,
      enabled: uni.enabled,
      lightPrimary: uni.colors.light.primary,
      lightSecondary: uni.colors.light.secondary,
      lightAccent: uni.colors.light.accent,
      darkPrimary: uni.colors.dark.primary,
      darkSecondary: uni.colors.dark.secondary,
      darkAccent: uni.colors.dark.accent,
    });
    setIsModalOpen(true);
  };

  const handleUpdate = () => {
    if (!editingUniversity) return;

    updateUniversityBranding(editingUniversity.id, {
      name: formData.name,
      logo: formData.logo,
      colors: {
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
      },
    });

    // Update enabled status separately
    const stored = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    const updated = stored.map((u: any) => 
      u.id === editingUniversity.id ? { ...u, enabled: formData.enabled } : u
    );
    localStorage.setItem('alumni_universities', JSON.stringify(updated));

    toast({
      title: 'University updated',
      description: `${formData.name} has been updated successfully`,
    });

    resetForm();
    setIsModalOpen(false);
    window.location.reload(); // Reload to show changes
  };

  const handleToggleEnabled = (uni: University) => {
    const stored = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    const updated = stored.map((u: any) => 
      u.id === uni.id ? { ...u, enabled: !uni.enabled } : u
    );
    localStorage.setItem('alumni_universities', JSON.stringify(updated));

    setUniversityList(universityList.map(u => 
      u.id === uni.id ? { ...u, enabled: !u.enabled } : u
    ));

    toast({
      title: uni.enabled ? 'University disabled' : 'University enabled',
      description: `${uni.name} is now ${uni.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const handleDelete = (uni: University) => {
    if (window.confirm(`Are you sure you want to delete ${uni.name}? This will remove all associated data.`)) {
      const stored = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
      const updated = stored.filter((u: any) => u.id !== uni.id);
      localStorage.setItem('alumni_universities', JSON.stringify(updated));

      // Clean up university data
      localStorage.removeItem(`alumni_users_${uni.id}`);
      localStorage.removeItem(`admin_posts_${uni.id}`);
      localStorage.removeItem(`admin_comments_${uni.id}`);
      localStorage.removeItem(`document_requests_${uni.id}`);
      localStorage.removeItem(`password_reset_requests_${uni.id}`);

      setUniversityList(universityList.filter(u => u.id !== uni.id));

      toast({
        title: 'University deleted',
        description: `${uni.name} and all its data have been removed`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold">University Management</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage all university instances
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add University
          </Button>
        </div>
      </Card>

      {/* Universities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {universityList.map(uni => (
          <Card key={uni.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {uni.logo && (
                  <img src={uni.logo} alt={uni.name} className="w-12 h-12 rounded-lg object-contain" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{uni.name}</h3>
                  <p className="text-xs text-muted-foreground">ID: {uni.id}</p>
                </div>
              </div>
              {uni.enabled ? (
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

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{uni.alumniCount || 0} Alumni</span>
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
                {uni.enabled ? 'Disable' : 'Enable'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDelete(uni)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUniversity ? 'Edit University' : 'Add New University'}</DialogTitle>
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

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lightPrimary">Light Primary</Label>
                <Input
                  id="lightPrimary"
                  type="color"
                  value={formData.lightPrimary}
                  onChange={(e) => setFormData({ ...formData, lightPrimary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lightSecondary">Light Secondary</Label>
                <Input
                  id="lightSecondary"
                  type="color"
                  value={formData.lightSecondary}
                  onChange={(e) => setFormData({ ...formData, lightSecondary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lightAccent">Light Accent</Label>
                <Input
                  id="lightAccent"
                  type="color"
                  value={formData.lightAccent}
                  onChange={(e) => setFormData({ ...formData, lightAccent: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="darkPrimary">Dark Primary</Label>
                <Input
                  id="darkPrimary"
                  type="color"
                  value={formData.darkPrimary}
                  onChange={(e) => setFormData({ ...formData, darkPrimary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="darkSecondary">Dark Secondary</Label>
                <Input
                  id="darkSecondary"
                  type="color"
                  value={formData.darkSecondary}
                  onChange={(e) => setFormData({ ...formData, darkSecondary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="darkAccent">Dark Accent</Label>
                <Input
                  id="darkAccent"
                  type="color"
                  value={formData.darkAccent}
                  onChange={(e) => setFormData({ ...formData, darkAccent: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={editingUniversity ? handleUpdate : handleCreate} className="w-full">
              {editingUniversity ? 'Update University' : 'Create University'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminUniversities;

