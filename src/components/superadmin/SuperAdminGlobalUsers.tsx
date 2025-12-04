import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Shield, GraduationCap, Mail, Plus, Edit, Trash2, Crown, Power } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'alumni';
  universityId?: string;
  universityName?: string;
  graduationYear?: string;
  major?: string;
  isMentor?: boolean;
  enabled: boolean;
}

const SuperAdminGlobalUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'superadmins' | 'admins' | 'alumni' | 'mentors'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GlobalUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'alumni' as 'superadmin' | 'admin' | 'alumni',
    universityId: '',
    graduationYear: '',
    major: '',
    isMentor: false,
    enabled: true,
  });

  useEffect(() => {
    loadUsers();
    loadUniversities();
  }, []);

  const loadUniversities = () => {
    const unis = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    setUniversities(unis);
  };

  const loadUsers = () => {
    const unis = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    const allUsers: GlobalUser[] = [];

    // Load super admins
    const superAdmins = JSON.parse(localStorage.getItem('super_admins_list') || '[]');
    superAdmins.forEach((sa: any) => {
      allUsers.push({ ...sa, role: 'superadmin', enabled: sa.enabled !== false });
    });

    // Load admins
    const admins = JSON.parse(localStorage.getItem('super_admin_admins') || '[]');
    admins.forEach((admin: any) => {
      const uni = unis.find((u: any) => u.id === admin.universityId);
      allUsers.push({
        ...admin,
        role: 'admin',
        universityName: uni?.name,
        enabled: admin.enabled !== false,
      });
    });

    // Load alumni from all universities
    unis.forEach((uni: any) => {
      const uniUsers = JSON.parse(localStorage.getItem(`alumni_users_${uni.id}`) || '[]');
      uniUsers.forEach((user: any) => {
        allUsers.push({
          ...user,
          role: 'alumni',
          universityName: uni.name,
          enabled: user.enabled !== false,
        });
      });
    });

    setUsers(allUsers);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Missing information',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.role !== 'superadmin' && !formData.universityId) {
      toast({
        title: 'Missing university',
        description: 'Please select a university for this user',
        variant: 'destructive',
      });
      return;
    }

    const newUser: GlobalUser = {
      id: `user_${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      universityId: formData.universityId,
      universityName: universities.find(u => u.id === formData.universityId)?.name,
      graduationYear: formData.graduationYear,
      major: formData.major,
      isMentor: formData.isMentor,
      enabled: formData.enabled,
    };

    // Save based on role
    if (formData.role === 'superadmin') {
      const superAdmins = JSON.parse(localStorage.getItem('super_admins_list') || '[]');
      superAdmins.push(newUser);
      localStorage.setItem('super_admins_list', JSON.stringify(superAdmins));
    } else if (formData.role === 'admin') {
      const admins = JSON.parse(localStorage.getItem('super_admin_admins') || '[]');
      admins.push(newUser);
      localStorage.setItem('super_admin_admins', JSON.stringify(admins));
    } else {
      const uniUsers = JSON.parse(localStorage.getItem(`alumni_users_${formData.universityId}`) || '[]');
      uniUsers.push(newUser);
      localStorage.setItem(`alumni_users_${formData.universityId}`, JSON.stringify(uniUsers));
    }

    loadUsers();
    toast({
      title: 'User created',
      description: `${formData.name} has been added as ${formData.role}`,
    });
    resetForm();
  };

  const handleToggleEnabled = (user: GlobalUser) => {
    const newStatus = !user.enabled;
    
    if (user.role === 'superadmin') {
      const superAdmins = JSON.parse(localStorage.getItem('super_admins_list') || '[]');
      const updated = superAdmins.map((u: any) => u.id === user.id ? { ...u, enabled: newStatus } : u);
      localStorage.setItem('super_admins_list', JSON.stringify(updated));
    } else if (user.role === 'admin') {
      const admins = JSON.parse(localStorage.getItem('super_admin_admins') || '[]');
      const updated = admins.map((u: any) => u.id === user.id ? { ...u, enabled: newStatus } : u);
      localStorage.setItem('super_admin_admins', JSON.stringify(updated));
    } else if (user.universityId) {
      const uniUsers = JSON.parse(localStorage.getItem(`alumni_users_${user.universityId}`) || '[]');
      const updated = uniUsers.map((u: any) => u.id === user.id ? { ...u, enabled: newStatus } : u);
      localStorage.setItem(`alumni_users_${user.universityId}`, JSON.stringify(updated));
    }

    loadUsers();
    toast({
      title: newStatus ? 'User enabled' : 'User disabled',
      description: `${user.name} is now ${newStatus ? 'enabled' : 'disabled'}`,
    });
  };

  const handleDelete = (user: GlobalUser) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      if (user.role === 'superadmin') {
        const superAdmins = JSON.parse(localStorage.getItem('super_admins_list') || '[]');
        const updated = superAdmins.filter((u: any) => u.id !== user.id);
        localStorage.setItem('super_admins_list', JSON.stringify(updated));
      } else if (user.role === 'admin') {
        const admins = JSON.parse(localStorage.getItem('super_admin_admins') || '[]');
        const updated = admins.filter((u: any) => u.id !== user.id);
        localStorage.setItem('super_admin_admins', JSON.stringify(updated));
      } else if (user.universityId) {
        const uniUsers = JSON.parse(localStorage.getItem(`alumni_users_${user.universityId}`) || '[]');
        const updated = uniUsers.filter((u: any) => u.id !== user.id);
        localStorage.setItem(`alumni_users_${user.universityId}`, JSON.stringify(updated));
      }

      loadUsers();
      toast({
        title: 'User deleted',
        description: `${user.name} has been removed`,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'alumni',
      universityId: '',
      graduationYear: '',
      major: '',
      isMentor: false,
      enabled: true,
    });
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.universityName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'superadmins') matchesFilter = user.role === 'superadmin';
    else if (filter === 'admins') matchesFilter = user.role === 'admin';
    else if (filter === 'alumni') matchesFilter = user.role === 'alumni';
    else if (filter === 'mentors') matchesFilter = user.isMentor === true;
    
    return matchesSearch && matchesFilter;
  });

  const roleCount = {
    superadmins: users.filter(u => u.role === 'superadmin').length,
    admins: users.filter(u => u.role === 'admin').length,
    alumni: users.filter(u => u.role === 'alumni').length,
    mentors: users.filter(u => u.isMentor).length,
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold">Global User Directory</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View all users across all universities
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {users.length} Total
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-500" />
              {roleCount.superadmins} Super
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              {roleCount.admins} Admins
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-green-500" />
              {roleCount.alumni} Alumni
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              {roleCount.mentors} Mentors
            </Badge>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, or university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
              All
            </Button>
            <Button variant={filter === 'superadmins' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('superadmins')}>
              Super
            </Button>
            <Button variant={filter === 'admins' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('admins')}>
              Admins
            </Button>
            <Button variant={filter === 'alumni' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('alumni')}>
              Alumni
            </Button>
            <Button variant={filter === 'mentors' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('mentors')}>
              Mentors
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-sm font-semibold">Name</th>
                <th className="pb-3 text-sm font-semibold">Email</th>
                <th className="pb-3 text-sm font-semibold">Role</th>
                <th className="pb-3 text-sm font-semibold">University</th>
                <th className="pb-3 text-sm font-semibold">Status</th>
                <th className="pb-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 text-sm">{user.name}</td>
                    <td className="py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 text-sm">
                      {user.role === 'superadmin' && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                      {user.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user.role === 'alumni' && (
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          Alumni
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-sm">
                      {user.universityName ? (
                        <Badge variant="secondary" className="text-xs">
                          {user.universityName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 text-sm">
                      {user.enabled ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 text-xs">
                          Disabled
                        </Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleToggleEnabled(user)}
                          className="h-7 px-2"
                        >
                          <Power className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDelete(user)}
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="role">User Role *</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Administrator</SelectItem>
                  <SelectItem value="admin">University Administrator</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
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

            {formData.role !== 'superadmin' && (
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
            )}

            {formData.role === 'alumni' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Graduation Year</Label>
                    <Input
                      id="year"
                      placeholder="2020"
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      placeholder="Computer Science"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mentor">Is Mentor?</Label>
                  <Switch
                    id="mentor"
                    checked={formData.isMentor}
                    onCheckedChange={(checked) => setFormData({ ...formData, isMentor: checked })}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>

            <Button onClick={handleCreate} className="w-full">
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminGlobalUsers;

