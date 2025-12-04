import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Plus, Trash2, Mail, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Admin {
  id: string;
  name: string;
  email: string;
  universityId: string;
  universityName: string;
  createdDate: string;
}

const SuperAdminAdmins = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    universityId: '',
  });

  useEffect(() => {
    loadAdmins();
    loadUniversities();
  }, []);

  const loadUniversities = () => {
    const unis = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    setUniversities(unis);
  };

  const loadAdmins = () => {
    const stored = JSON.parse(localStorage.getItem('super_admin_admins') || '[]');
    setAdmins(stored);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.universityId || !formData.password) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const university = universities.find(u => u.id === formData.universityId);
    const newAdmin: Admin = {
      id: `admin_${Date.now()}`,
      name: formData.name,
      email: formData.email,
      universityId: formData.universityId,
      universityName: university?.name || '',
      createdDate: new Date().toISOString(),
    };

    const updatedAdmins = [...admins, newAdmin];
    localStorage.setItem('super_admin_admins', JSON.stringify(updatedAdmins));
    setAdmins(updatedAdmins);

    // Store credentials (in real app, this would be hashed)
    const credentials = JSON.parse(localStorage.getItem('admin_credentials') || '{}');
    credentials[formData.email] = {
      password: formData.password,
      universityId: formData.universityId,
      universityName: university?.name,
    };
    localStorage.setItem('admin_credentials', JSON.stringify(credentials));

    toast({
      title: 'Admin created',
      description: `Admin account created for ${formData.name}. Credentials sent to ${formData.email}`,
    });

    resetForm();
  };

  const handleDelete = (admin: Admin) => {
    if (window.confirm(`Remove ${admin.name} as admin?`)) {
      const updated = admins.filter(a => a.id !== admin.id);
      localStorage.setItem('super_admin_admins', JSON.stringify(updated));
      setAdmins(updated);

      toast({
        title: 'Admin removed',
        description: `${admin.name} has been removed`,
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', universityId: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold">Admin Management</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Assign and manage university administrators
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </Card>

      {/* Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map(admin => (
          <Card key={admin.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {admin.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{admin.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </Badge>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{admin.universityName}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {new Date(admin.createdDate).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Mail className="w-3 h-3 mr-1" />
                Contact
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDelete(admin)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}

        {admins.length === 0 && (
          <Card className="p-8 text-center col-span-full">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No admins assigned yet</p>
          </Card>
        )}
      </div>

      {/* Create Admin Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="university">University *</Label>
              <Select value={formData.universityId} onValueChange={(value) => setFormData({ ...formData, universityId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map(uni => (
                    <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full">
              Create Admin Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminAdmins;

