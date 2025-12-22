import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Shield, GraduationCap, Plus, Trash2, Crown, Power, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { superadminApi, GlobalUserResponse } from '@/api/superadmin';

const SuperAdminGlobalUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<GlobalUserResponse[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'superadmins' | 'admins' | 'alumni' | 'mentors'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(20);
  
  // Role counts
  const [roleCounts, setRoleCounts] = useState({
    superadmin: 0,
    admin: 0,
    alumni: 0,
    mentor: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ALUMNI' as 'SUPERADMIN' | 'ADMIN' | 'ALUMNI',
    universityId: '',
    graduationYear: '',
    major: '',
    isMentor: false,
  });

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUniversities = useCallback(async () => {
    try {
      const response = await superadminApi.getUniversities();
      // Handle both array response and object response with universities property
      const unis = Array.isArray(response) ? response : (response.universities || []);
      setUniversities(unis);
    } catch (error) {
      console.error('Failed to load universities:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build params object - only include defined values
      const params: {
        page: number;
        page_size: number;
        search?: string;
        role?: string;
        is_mentor?: boolean;
      } = {
        page: currentPage,
        page_size: pageSize,
      };

      // Add search if provided
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      // Add role filter based on selected tab
      if (filter === 'superadmins') {
        params.role = 'SUPERADMIN';
      } else if (filter === 'admins') {
        params.role = 'ADMIN';
      } else if (filter === 'alumni') {
        params.role = 'ALUMNI';
      } else if (filter === 'mentors') {
        params.is_mentor = true;
      }
      // 'all' filter doesn't add any role/mentor params

      console.log('Loading users with params:', params, 'filter:', filter);

      const response = await superadminApi.getAllUsers(params);

      console.log('Received users:', response.users?.length, 'total:', response.total);

      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
      setRoleCounts(response.role_counts || { superadmin: 0, admin: 0, alumni: 0, mentor: 0 });
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Failed to load users',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filter, debouncedSearch, pageSize, toast]);

  // Load users when filters change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load universities on mount
  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Missing information',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.role !== 'SUPERADMIN' && !formData.universityId) {
      toast({
        title: 'Missing university',
        description: 'Please select a university for this user',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await superadminApi.createGlobalUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        university_id: formData.universityId || undefined,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
        major: formData.major || undefined,
        is_mentor: formData.isMentor,
      });

      toast({
        title: 'User created',
        description: `${formData.name} has been added as ${formData.role.toLowerCase()}`,
      });
      
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Failed to create user',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = async (user: GlobalUserResponse) => {
    try {
      const result = await superadminApi.toggleUserStatus(user.id);
      toast({
        title: result.is_active ? 'User enabled' : 'User disabled',
        description: `${user.name} is now ${result.is_active ? 'enabled' : 'disabled'}`,
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Failed to update user',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (user: GlobalUserResponse) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await superadminApi.deleteGlobalUser(user.id);
        toast({
          title: 'User deleted',
          description: `${user.name} has been removed`,
          variant: 'destructive',
        });
        loadUsers();
      } catch (error: any) {
        toast({
          title: 'Failed to delete user',
          description: error.message || 'Please try again',
          variant: 'destructive',
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ALUMNI',
      universityId: '',
      graduationYear: '',
      major: '',
      isMentor: false,
    });
    setIsModalOpen(false);
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'SUPERADMIN':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'ADMIN':
        return (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <GraduationCap className="w-3 h-3 mr-1" />
            Alumni
          </Badge>
        );
    }
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
              {totalUsers} Total
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-500" />
              {roleCounts.superadmin} Super
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              {roleCounts.admin} Admins
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-green-500" />
              {roleCounts.alumni} Alumni
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              {roleCounts.mentor} Mentors
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
            >
              All ({roleCounts.superadmin + roleCounts.admin + roleCounts.alumni})
            </Button>
            <Button 
              variant={filter === 'superadmins' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => { setFilter('superadmins'); setCurrentPage(1); }}
              className={filter === 'superadmins' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Crown className="w-3 h-3 mr-1" />
              Super ({roleCounts.superadmin})
            </Button>
            <Button 
              variant={filter === 'admins' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => { setFilter('admins'); setCurrentPage(1); }}
              className={filter === 'admins' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <Shield className="w-3 h-3 mr-1" />
              Admins ({roleCounts.admin})
            </Button>
            <Button 
              variant={filter === 'alumni' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => { setFilter('alumni'); setCurrentPage(1); }}
              className={filter === 'alumni' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <GraduationCap className="w-3 h-3 mr-1" />
              Alumni ({roleCounts.alumni})
            </Button>
            <Button 
              variant={filter === 'mentors' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => { setFilter('mentors'); setCurrentPage(1); }}
              className={filter === 'mentors' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              <Users className="w-3 h-3 mr-1" />
              Mentors ({roleCounts.mentor})
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
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-muted-foreground">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <Search className="w-5 h-5 text-primary/60" />
                          </div>
                        </div>
                      </div>
                      <h4 className="font-medium mb-1">No Users Found</h4>
                      <p className="text-sm text-muted-foreground text-center max-w-sm">
                        {searchQuery 
                          ? `No users matching "${searchQuery}" in the ${filter === 'all' ? 'system' : filter} category.`
                          : filter === 'all' 
                          ? 'No users in the system yet. Add users to get started.'
                          : `No ${filter} found in the system.`}
                      </p>
                      {(searchQuery || filter !== 'all') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => { setSearchQuery(''); setFilter('all'); setCurrentPage(1); }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 text-sm">{user.name}</td>
                    <td className="py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 text-sm">{getRoleBadge(user.role)}</td>
                    <td className="py-3 text-sm">
                      {user.university_name ? (
                        <Badge variant="secondary" className="text-xs">
                          {user.university_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 text-sm">
                      {user.is_active ? (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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
                  <SelectItem value="SUPERADMIN">Super Administrator</SelectItem>
                  <SelectItem value="ADMIN">University Administrator</SelectItem>
                  <SelectItem value="ALUMNI">Alumni</SelectItem>
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

            {formData.role !== 'SUPERADMIN' && (
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

            {formData.role === 'ALUMNI' && (
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

            <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminGlobalUsers;
