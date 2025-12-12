import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { UserPlus, Upload, Mail, AlertCircle, CheckCircle, Download, Search, FileDown, Shield, GraduationCap, Users, Filter, X, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { userService, ApiUser } from '@/services/userService';
import { UserRole } from '@/types/auth';

interface AlumniUser {
  id: string;
  name: string;
  email: string;
  graduationYear: string;
  major: string;
  isMentor: boolean;
  universityId: string;
  phone?: string;
  location?: string;
}

interface AllUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  graduationYear?: string;
  major?: string;
  userType: 'admin' | 'mentor' | 'alumni' | 'superadmin' | 'student';
  isMentor?: boolean;
  isActive?: boolean;
  isVerified?: boolean;
  role?: UserRole;
}

// Map API role to display user type
function mapRoleToUserType(role: UserRole): AllUser['userType'] {
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

// Map API user to AllUser for display
function mapApiUserToAllUser(apiUser: ApiUser): AllUser {
  return {
    id: String(apiUser.id),
    name: apiUser.full_name,
    email: apiUser.email,
    userType: mapRoleToUserType(apiUser.role),
    isActive: apiUser.is_active,
    isVerified: apiUser.is_verified,
    role: apiUser.role,
  };
}

const AdminUserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');
  
  // All Users tab state
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    userType: 'all' as 'all' | 'admin' | 'mentor' | 'alumni' | 'superadmin' | 'student',
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const itemsPerPage = 10;
  
  // Loading and error states for API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Single user form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    graduationYear: '',
    major: '',
    isMentor: false,
  });

  const handleAddSingleUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Create user object
    const alumniUser: AlumniUser = {
      id: `user_${Date.now()}`,
      ...newUser,
      universityId: user?.universityId || '',
    };

    // Store in localStorage
    const existingUsers = JSON.parse(localStorage.getItem(`alumni_users_${user?.universityId}`) || '[]');
    existingUsers.push(alumniUser);
    localStorage.setItem(`alumni_users_${user?.universityId}`, JSON.stringify(existingUsers));

    // Simulate sending credentials email
    toast({
      title: 'User added successfully!',
      description: `Credentials sent to ${newUser.email}`,
    });

    // Reset form
    setNewUser({
      name: '',
      email: '',
      graduationYear: '',
      major: '',
      isMentor: false,
    });
    setIsAddDialogOpen(false);
  };

  const handleBulkUpload = () => {
    if (!bulkData.trim()) {
      toast({
        title: 'No data provided',
        description: 'Please paste CSV data to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Parse CSV (simple implementation)
      const lines = bulkData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredHeaders = ['name', 'email'];
      const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequiredHeaders) {
        toast({
          title: 'Invalid CSV format',
          description: 'CSV must include: name, email (optional: graduationYear, major, isMentor)',
          variant: 'destructive',
        });
        return;
      }

      const users: AlumniUser[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === 0 || !values[0]) continue;

        const userData: any = {};
        headers.forEach((header, index) => {
          userData[header] = values[index] || '';
        });

        users.push({
          id: `user_${Date.now()}_${i}`,
          name: userData.name,
          email: userData.email,
          graduationYear: userData.graduationyear || userData.year || '',
          major: userData.major || '',
          isMentor: userData.ismentor === 'true' || userData.ismentor === '1',
          universityId: user?.universityId || '',
        });
      }

      // Store users
      const existingUsers = JSON.parse(localStorage.getItem(`alumni_users_${user?.universityId}`) || '[]');
      const updatedUsers = [...existingUsers, ...users];
      localStorage.setItem(`alumni_users_${user?.universityId}`, JSON.stringify(updatedUsers));

      toast({
        title: 'Bulk upload successful!',
        description: `Added ${users.length} users. Credentials sent to their emails.`,
      });

      setBulkData('');
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Please check your CSV format and try again',
        variant: 'destructive',
      });
    }
  };

  const downloadTemplate = () => {
    const template = 'name,email,graduationYear,major,isMentor\nJohn Doe,john@example.com,2020,Computer Science,false\nJane Smith,jane@example.com,2019,Engineering,true';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alumni_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Load all users from API
  const loadAllUsers = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const apiUsers = await userService.listUsers({ skip: 0, limit: 100 });
      
      // Filter users based on current admin's university if not superadmin
      const filteredApiUsers = user?.role === 'superadmin' 
        ? apiUsers 
        : apiUsers.filter(u => u.university_id === (user?.universityId ? Number(user.universityId) : null));
      
      const mappedUsers = filteredApiUsers.map(mapApiUserToAllUser);
      setAllUsers(mappedUsers);
      
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
  }, [user?.universityId, user?.role, toast]);

  // Load users on mount and when universityId changes
  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  // Handle manual refresh
  const handleRefresh = () => {
    loadAllUsers(true);
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const nameMatch = !filters.name || u.name.toLowerCase().includes(filters.name.toLowerCase());
      const emailMatch = !filters.email || u.email.toLowerCase().includes(filters.email.toLowerCase());
      const phoneMatch = !filters.phone || (u.phone && u.phone.toLowerCase().includes(filters.phone.toLowerCase()));
      const locationMatch = !filters.location || (u.location && u.location.toLowerCase().includes(filters.location.toLowerCase()));
      const typeMatch = filters.userType === 'all' || u.userType === filters.userType;
      
      return nameMatch && emailMatch && phoneMatch && locationMatch && typeMatch;
    });
  }, [allUsers, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // CSV Export
  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no users to export',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Location', 'User Type', 'Graduation Year', 'Major'];
    const rows = filteredUsers.map((u) => [
      u.name,
      u.email,
      u.phone || '',
      u.location || '',
      u.userType,
      u.graduationYear || '',
      u.major || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `Exported ${filteredUsers.length} users to CSV`,
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      name: '',
      email: '',
      phone: '',
      location: '',
      userType: 'all' as 'all' | 'admin' | 'mentor' | 'alumni' | 'superadmin' | 'student',
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
  };

  // Get badge variant for user type
  const getUserTypeBadge = (userType: AllUser['userType'], isActive?: boolean) => {
    const activeClass = isActive === false ? 'opacity-50' : '';
    switch (userType) {
      case 'superadmin':
        return (
          <Badge className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 flex items-center gap-1 w-fit ${activeClass}`}>
            <Shield className="w-3 h-3" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="default" className={`flex items-center gap-1 w-fit ${activeClass}`}>
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        );
      case 'mentor':
        return (
          <Badge variant="secondary" className={`flex items-center gap-1 w-fit ${activeClass}`}>
            <GraduationCap className="w-3 h-3" />
            Mentor
          </Badge>
        );
      case 'student':
        return (
          <Badge variant="outline" className={`flex items-center gap-1 w-fit ${activeClass}`}>
            <GraduationCap className="w-3 h-3" />
            Student
          </Badge>
        );
      case 'alumni':
      default:
        return (
          <Badge variant="outline" className={`flex items-center gap-1 w-fit ${activeClass}`}>
            <Users className="w-3 h-3" />
            Alumni
          </Badge>
        );
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.name) count++;
    if (filters.email) count++;
    if (filters.phone) count++;
    if (filters.location) count++;
    if (filters.userType !== 'all') count++;
    return count;
  };

  // Sync tempFilters when modal opens
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempFilters(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilterModalOpen]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">User Management</h2>
            <p className="text-sm text-muted-foreground">
              Add alumni individually or in bulk
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Alumni
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Alumni</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Graduation Year</Label>
                  <Input
                    id="year"
                    placeholder="2020"
                    value={newUser.graduationYear}
                    onChange={(e) => setNewUser({ ...newUser, graduationYear: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    placeholder="Computer Science"
                    value={newUser.major}
                    onChange={(e) => setNewUser({ ...newUser, major: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentor">Is Mentor?</Label>
                  <Switch
                    id="mentor"
                    checked={newUser.isMentor}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, isMentor: checked })}
                  />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Login credentials will be automatically sent to the provided email address.
                  </p>
                </div>
                <Button onClick={handleAddSingleUser} className="w-full">
                  Add Alumni
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="allUsers" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="allUsers">All Users</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="allUsers" className="space-y-4 mt-4">
            {/* Filter and Actions Bar */}
            <Card className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {getActiveFilterCount() > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {getActiveFilterCount()}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Filter Users</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Search name..."
                                value={tempFilters.name}
                                onChange={(e) => handleFilterChange('name', e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Search email..."
                                value={tempFilters.email}
                                onChange={(e) => handleFilterChange('email', e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              placeholder="Search phone..."
                              value={tempFilters.phone}
                              onChange={(e) => handleFilterChange('phone', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                              placeholder="Search location..."
                              value={tempFilters.location}
                              onChange={(e) => handleFilterChange('location', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>User Type</Label>
                            <Select value={tempFilters.userType} onValueChange={(value) => handleFilterChange('userType', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="alumni">Alumni</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button variant="outline" onClick={clearFilters}>
                            <X className="w-4 h-4 mr-2" />
                            Clear All
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsFilterModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={applyFilters}>
                              Apply Filters
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {getActiveFilterCount() > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {isLoading ? 'Loading...' : `Showing ${paginatedUsers.length} of ${filteredUsers.length} users`}
                  </div>
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline" 
                    size="sm"
                    disabled={isRefreshing || isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={exportToCSV} variant="outline" size="sm" disabled={isLoading}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </Card>

            {/* Table */}
            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Graduation Year</TableHead>
                      <TableHead>Major</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      // Loading skeleton rows
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      // Error state
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-3">
                            <AlertCircle className="w-10 h-10 text-destructive" />
                            <div className="text-destructive font-medium">{error}</div>
                            <Button onClick={handleRefresh} variant="outline" size="sm">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-10 h-10 opacity-50" />
                            <p>No users found</p>
                            {Object.values(filters).some(v => v !== '' && v !== 'all') && (
                              <Button onClick={clearFilters} variant="outline" size="sm">
                                Clear Filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((u) => (
                        <TableRow key={u.id} className={u.isActive === false ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {u.name}
                              {u.isVerified && (
                                <CheckCircle className="w-4 h-4 text-green-500" title="Verified" />
                              )}
                              {u.isActive === false && (
                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.phone || '-'}</TableCell>
                          <TableCell>{u.location || '-'}</TableCell>
                          <TableCell>
                            {getUserTypeBadge(u.userType, u.isActive)}
                          </TableCell>
                          <TableCell>{u.graduationYear || '-'}</TableCell>
                          <TableCell>{u.major || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CSV Data</Label>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <Textarea
                placeholder="name,email,graduationYear,major,isMentor&#10;John Doe,john@example.com,2020,Computer Science,false&#10;Jane Smith,jane@example.com,2019,Engineering,true"
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <Button onClick={handleBulkUpload} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload Alumni
            </Button>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    <p className="font-medium mb-2">CSV Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>First line must contain headers</li>
                      <li>Required columns: name, email</li>
                      <li>Optional columns: graduationYear, major, isMentor</li>
                      <li>Use comma to separate values</li>
                      <li>Use 'true' or 'false' for isMentor field</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-600 dark:text-green-400">
                    <p className="font-medium mb-2">Example CSV:</p>
                    <pre className="bg-card p-3 rounded border border-border mt-2 overflow-x-auto">
{`name,email,graduationYear,major,isMentor
John Doe,john@example.com,2020,Computer Science,false
Jane Smith,jane@example.com,2019,Engineering,true
Bob Johnson,bob@example.com,2021,Business,false`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    <p className="font-medium mb-2">Automatic Email Notifications:</p>
                    <p>
                      Each user will receive an email with their login credentials and a welcome message 
                      to join the {user?.university} alumni network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminUserManagement;

