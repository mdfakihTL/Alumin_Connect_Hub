import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Shield, GraduationCap, Plus, Crown, Power, RefreshCw, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { userService, ApiUser } from '@/services/userService';
import { UserRole } from '@/types/auth';

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'alumni' | 'student';
  universityId?: number;
  universityName?: string;
  graduationYear?: string;
  major?: string;
  isMentor?: boolean;
  enabled: boolean;
  isVerified?: boolean;
}

// Map API role to display role
function mapApiRoleToDisplay(role: UserRole): GlobalUser['role'] {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'superadmin';
    case 'UNIVERSITY_ADMIN':
      return 'admin';
    case 'STUDENT':
      return 'student';
    case 'ALUMNI':
    default:
      return 'alumni';
  }
}

// Map API user to GlobalUser
function mapApiUserToGlobalUser(apiUser: ApiUser): GlobalUser {
  return {
    id: String(apiUser.id),
    name: apiUser.full_name,
    email: apiUser.email,
    role: mapApiRoleToDisplay(apiUser.role),
    universityId: apiUser.university_id ?? undefined,
    universityName: apiUser.university_id ? `University ${apiUser.university_id}` : undefined,
    enabled: apiUser.is_active,
    isVerified: apiUser.is_verified,
  };
}

const SuperAdminGlobalUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'superadmins' | 'admins' | 'alumni' | 'students'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GlobalUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'alumni' as 'superadmin' | 'admin' | 'alumni' | 'student',
    universityId: '',
    graduationYear: '',
    major: '',
    isMentor: false,
    enabled: true,
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load users from API
  const loadUsers = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const apiUsers = await userService.listUsers({ skip: 0, limit: 100 });
      const mappedUsers = apiUsers.map(mapApiUserToGlobalUser);
      setUsers(mappedUsers);

      if (showRefreshIndicator) {
        toast({
          title: 'Users refreshed',
          description: `Loaded ${mappedUsers.length} users`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      toast({
        title: 'Error loading users',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const loadUniversities = () => {
    const unis = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    setUniversities(unis);
  };

  useEffect(() => {
    loadUsers();
    loadUniversities();
  }, [loadUsers]);

  // Handle manual refresh
  const handleRefresh = () => {
    loadUsers(true);
  };

  // Create user - placeholder for future API implementation
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

    // This would require an API endpoint to create users
    // For now, show a message that this feature is not yet available via API
    toast({
      title: 'Feature not available',
      description: 'User creation via this interface requires additional API support. Please use the registration flow.',
      variant: 'destructive',
    });
    resetForm();
  };

  // Toggle user enabled status - placeholder for future API implementation
  const handleToggleEnabled = (user: GlobalUser) => {
    // This would require an API endpoint to update user status
    // For now, show a message that this feature is not yet available
    toast({
      title: 'Feature not available',
      description: 'User status management requires additional API support.',
      variant: 'destructive',
    });
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
    else if (filter === 'students') matchesFilter = user.role === 'student';
    
    return matchesSearch && matchesFilter;
  });

  const roleCount = {
    superadmins: users.filter(u => u.role === 'superadmin').length,
    admins: users.filter(u => u.role === 'admin').length,
    alumni: users.filter(u => u.role === 'alumni').length,
    students: users.filter(u => u.role === 'student').length,
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
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </>
            ) : (
              <>
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
                  <GraduationCap className="w-4 h-4 text-orange-500" />
                  {roleCount.students} Students
                </Badge>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsModalOpen(true)} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
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
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} disabled={isLoading}>
              All
            </Button>
            <Button variant={filter === 'superadmins' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('superadmins')} disabled={isLoading}>
              Super
            </Button>
            <Button variant={filter === 'admins' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('admins')} disabled={isLoading}>
              Admins
            </Button>
            <Button variant={filter === 'alumni' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('alumni')} disabled={isLoading}>
              Alumni
            </Button>
            <Button variant={filter === 'students' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('students')} disabled={isLoading}>
              Students
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
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b border-border">
                    <td className="py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="py-3"><Skeleton className="h-6 w-28" /></td>
                    <td className="py-3"><Skeleton className="h-6 w-16" /></td>
                    <td className="py-3"><Skeleton className="h-7 w-16" /></td>
                  </tr>
                ))
              ) : error ? (
                // Error state
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                      <div className="text-destructive font-medium">{error}</div>
                      <Button onClick={handleRefresh} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-10 h-10 opacity-50" />
                      <p>No users found</p>
                      {(searchQuery || filter !== 'all') && (
                        <Button 
                          onClick={() => { setSearchQuery(''); setFilter('all'); }} 
                          variant="outline" 
                          size="sm"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className={`border-b border-border hover:bg-muted/50 ${!user.enabled ? 'opacity-60' : ''}`}>
                    <td className="py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {user.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-500" title="Verified" />
                        )}
                      </div>
                    </td>
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
                      {user.role === 'student' && (
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          Student
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
                          Inactive
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
                          title={user.enabled ? 'Disable user' : 'Enable user'}
                          disabled
                        >
                          <Power className="w-3 h-3" />
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

