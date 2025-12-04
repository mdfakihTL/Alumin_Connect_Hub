import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Plus, Edit, Trash2, TrendingUp, Calendar, Target, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const AdminFundraiser = () => {
  const { user } = useAuth();
  const { fundraisers, addFundraiser, updateFundraiser, deleteFundraiser, getActiveFundraisers } = useUniversity();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFundraiser, setEditingFundraiser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    goalAmount: '',
    currentAmount: '0',
    donationLink: '',
    startDate: '',
    endDate: '',
  });

  const universityFundraisers = fundraisers.filter(f => f.universityId === user?.universityId);
  const activeFundraisers = getActiveFundraisers(user?.universityId || '');

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      goalAmount: '',
      currentAmount: '0',
      donationLink: '',
      startDate: '',
      endDate: '',
    });
    setEditingFundraiser(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.goalAmount || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (editingFundraiser) {
      updateFundraiser(editingFundraiser.id, {
        ...formData,
        goalAmount: parseFloat(formData.goalAmount),
        currentAmount: parseFloat(formData.currentAmount),
      });
      toast({
        title: 'Fundraiser updated',
        description: 'The fundraiser has been updated successfully',
      });
    } else {
      addFundraiser({
        universityId: user?.universityId || '',
        title: formData.title,
        description: formData.description,
        image: formData.image || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=400&fit=crop',
        goalAmount: parseFloat(formData.goalAmount),
        currentAmount: parseFloat(formData.currentAmount),
        donationLink: formData.donationLink,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: true,
      });
      toast({
        title: 'Fundraiser created',
        description: 'The fundraiser is now visible to alumni',
      });
    }

    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (fundraiser: any) => {
    setEditingFundraiser(fundraiser);
    setFormData({
      title: fundraiser.title,
      description: fundraiser.description,
      image: fundraiser.image,
      goalAmount: fundraiser.goalAmount.toString(),
      currentAmount: fundraiser.currentAmount.toString(),
      donationLink: fundraiser.donationLink,
      startDate: fundraiser.startDate.split('T')[0],
      endDate: fundraiser.endDate.split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this fundraiser?')) {
      deleteFundraiser(id);
      toast({
        title: 'Fundraiser deleted',
        description: 'The fundraiser has been removed',
      });
    }
  };

  const handleToggleActive = (fundraiser: any) => {
    updateFundraiser(fundraiser.id, {
      isActive: !fundraiser.isActive,
    });
    toast({
      title: fundraiser.isActive ? 'Fundraiser deactivated' : 'Fundraiser activated',
      description: fundraiser.isActive 
        ? 'The fundraiser is no longer visible to alumni' 
        : 'The fundraiser is now visible to alumni',
    });
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const isActive = (startDate: string, endDate: string) => {
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Fundraiser Management</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage donation campaigns shown as ads to alumni
            </p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Fundraiser
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFundraiser ? 'Edit Fundraiser' : 'Create New Fundraiser'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    placeholder="Annual Alumni Fund 2025"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Help us build a better future for our students..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal">Goal Amount ($) *</Label>
                    <Input
                      id="goal"
                      type="number"
                      placeholder="100000"
                      value={formData.goalAmount}
                      onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current">Current Amount ($)</Label>
                    <Input
                      id="current"
                      type="number"
                      placeholder="0"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Donation Link *</Label>
                  <Input
                    id="link"
                    placeholder="https://donate.university.edu/campaign"
                    value={formData.donationLink}
                    onChange={(e) => setFormData({ ...formData, donationLink: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Date *</Label>
                    <Input
                      id="start"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Date *</Label>
                    <Input
                      id="end"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingFundraiser ? 'Update Fundraiser' : 'Create Fundraiser'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-2xl font-bold">{universityFundraisers.length}</p>
            <p className="text-sm text-muted-foreground">Total Fundraisers</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeFundraisers.length}</p>
            <p className="text-sm text-muted-foreground">Active Now</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-2xl font-bold">
              ${universityFundraisers.reduce((sum, f) => sum + f.currentAmount, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Raised</p>
          </div>
        </div>
      </Card>

      {/* Fundraisers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {universityFundraisers.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No fundraisers created yet</p>
          </Card>
        ) : (
          universityFundraisers.map(fundraiser => {
            const progress = getProgressPercentage(fundraiser.currentAmount, fundraiser.goalAmount);
            const active = isActive(fundraiser.startDate, fundraiser.endDate);
            
            return (
              <Card key={fundraiser.id} className="p-6 hover:shadow-lg transition-shadow">
                {fundraiser.image && (
                  <img 
                    src={fundraiser.image} 
                    alt={fundraiser.title}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-lg flex-1">{fundraiser.title}</h3>
                  <div className="flex gap-2">
                    {active && fundraiser.isActive && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        Active
                      </Badge>
                    )}
                    {!active && (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20">
                        Ended
                      </Badge>
                    )}
                    {!fundraiser.isActive && (
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{fundraiser.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-semibold">${fundraiser.currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      <span>of ${fundraiser.goalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(fundraiser.startDate).toLocaleDateString()} - {new Date(fundraiser.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(fundraiser)} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleToggleActive(fundraiser)}
                    className="flex-1"
                  >
                    {fundraiser.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(fundraiser.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {fundraiser.donationLink && (
                  <Button 
                    size="sm" 
                    variant="link" 
                    className="w-full mt-2"
                    onClick={() => window.open(fundraiser.donationLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Donation Page
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminFundraiser;

