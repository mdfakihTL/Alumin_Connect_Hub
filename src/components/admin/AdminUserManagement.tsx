import { useState, useEffect, useMemo } from 'react';
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
import { UserPlus, Upload, Mail, AlertCircle, CheckCircle, Download, Search, FileDown, Shield, GraduationCap, Users, Filter, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';

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
  userType: 'admin' | 'mentor' | 'alumni';
  isMentor?: boolean;
}

// Generate a random password
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const AdminUserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // All Users tab state
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    userType: 'all' as 'all' | 'admin' | 'mentor' | 'alumni',
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const itemsPerPage = 10;
  
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate a random password for the new user
      const password = generatePassword();
      
      console.log('[AdminUserManagement] Creating user:', { 
        name: newUser.name, 
        email: newUser.email,
        graduation_year: newUser.graduationYear ? parseInt(newUser.graduationYear) : undefined,
      });
      
      // Call backend API to create user - this will also send welcome email
      const result = await apiClient.createAdminUser({
        name: newUser.name,
        email: newUser.email,
        password: password,
        graduation_year: newUser.graduationYear ? parseInt(newUser.graduationYear) : undefined,
        major: newUser.major || undefined,
      });

      console.log('[AdminUserManagement] User created successfully:', result);

      toast({
        title: 'User added successfully!',
        description: `Welcome email with login credentials sent to ${newUser.email}`,
      });

      // Reset form and close dialog
      setNewUser({
        name: '',
        email: '',
        graduationYear: '',
        major: '',
        isMentor: false,
      });
      setIsAddDialogOpen(false);
      
      // Refresh the user list
      loadAllUsers();
    } catch (error: any) {
      console.error('[AdminUserManagement] Failed to create user:', error);
      
      // Check for specific error messages
      const errorMessage = error.message || 'Please try again';
      let title = 'Failed to add user';
      
      if (errorMessage.toLowerCase().includes('already registered') || 
          errorMessage.toLowerCase().includes('already exists')) {
        title = 'Email already registered';
      } else if (errorMessage.toLowerCase().includes('unauthorized') ||
                 errorMessage.toLowerCase().includes('not authenticated')) {
        title = 'Session expired';
      }
      
      toast({
        title,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      toast({
        title: 'No data provided',
        description: 'Please paste CSV data to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Parse CSV (simple implementation)
      const lines = bulkData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredHeaders = ['name', 'email'];
      const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequiredHeaders) {
        toast({
          title: 'Invalid CSV format',
          description: 'CSV must include: name, email (optional: graduationYear, major)',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const usersToImport: Array<{
        name: string;
        email: string;
        password: string;
        graduation_year?: number;
        major?: string;
      }> = [];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const skippedRows: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === 0 || !values[0]) continue;

        const userData: Record<string, string> = {};
        headers.forEach((header, index) => {
          userData[header] = values[index] || '';
        });

        // Validate email
        if (!userData.email || !emailRegex.test(userData.email)) {
          skippedRows.push(`Row ${i + 1}: Invalid email`);
          continue;
        }

        // Validate name
        if (!userData.name) {
          skippedRows.push(`Row ${i + 1}: Missing name`);
          continue;
        }

        const gradYear = userData.graduationyear || userData.graduation_year || userData.year;

        usersToImport.push({
          name: userData.name,
          email: userData.email,
          password: generatePassword(), // Generate unique password for each user
          graduation_year: gradYear ? parseInt(gradYear) : undefined,
          major: userData.major || undefined,
        });
      }

      if (usersToImport.length === 0) {
        toast({
          title: 'No valid users found',
          description: skippedRows.length > 0 
            ? `Skipped: ${skippedRows.slice(0, 3).join('; ')}${skippedRows.length > 3 ? '...' : ''}`
            : 'Please check your CSV data',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      console.log('[AdminUserManagement] Bulk importing users:', usersToImport.length);

      // Call backend API for bulk import
      const result = await apiClient.bulkImportUsers(usersToImport);

      console.log('[AdminUserManagement] Bulk import result:', result);

      if (result.success_count > 0) {
        toast({
          title: 'Bulk upload successful!',
          description: `Added ${result.success_count} users. Welcome emails sent with credentials.${result.failed_count > 0 ? ` ${result.failed_count} failed.` : ''}`,
        });
        setBulkData('');
        loadAllUsers(); // Refresh the list
      } else {
        toast({
          title: 'Upload failed',
          description: result.errors?.join(', ') || 'All users failed to import',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('[AdminUserManagement] Bulk upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please check your CSV format and try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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

  // Load all users for the university
  useEffect(() => {
    // Load users when user is available or page changes
    if (user) {
      loadAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentPage]);

  const loadAllUsers = async () => {
    // Don't require universityId - superadmins may not have one
    setIsLoading(true);
    
    try {
      console.log('[AdminUserManagement] Loading users for page:', currentPage);
      
      // Call backend API to get users
      const response = await apiClient.getAdminUsers({
        page: currentPage,
        page_size: itemsPerPage,
        search: filters.name || filters.email || undefined,
      });

      console.log('[AdminUserManagement] API response:', response);

      if (!response || !response.users) {
        console.warn('[AdminUserManagement] Invalid response format:', response);
        setAllUsers([]);
        setTotalUsers(0);
        return;
      }

      const users: AllUser[] = response.users.map((u) => ({
        id: u.id,
        name: u.name || 'Unknown',
        email: u.email || '',
        phone: '', // Profile data if available
        location: '', // Profile data if available
        graduationYear: u.graduation_year?.toString() || '',
        major: u.major || '',
        userType: u.role === 'admin' ? 'admin' : (u.is_mentor ? 'mentor' : 'alumni'),
        isMentor: u.is_mentor || false,
      }));

      console.log('[AdminUserManagement] Processed users:', users.length);
      setAllUsers(users);
      setTotalUsers(response.total || 0);
    } catch (error: any) {
      console.error('[AdminUserManagement] Failed to load users:', error);
      toast({
        title: 'Failed to load users',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      setAllUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
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

  // Pagination - use API pagination
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const paginatedUsers = filteredUsers; // Already paginated from API

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
      userType: 'all' as const,
    };
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    setCurrentPage(1);
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
                <Button onClick={handleAddSingleUser} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    'Add Alumni'
                  )}
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
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="mentor">Mentor</SelectItem>
                                <SelectItem value="alumni">Alumni</SelectItem>
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
                    Showing {paginatedUsers.length} of {totalUsers} users
                  </div>
                  <Button onClick={exportToCSV} variant="outline" size="sm">
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
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading users...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Search className="w-5 h-5 text-primary/60" />
                              </div>
                            </div>
                            <h4 className="font-medium mb-1">No Users Found</h4>
                            <p className="text-sm text-muted-foreground max-w-sm text-center">
                              {getActiveFilterCount() > 0 ? 'No users match the current filters. Try adjusting your search criteria.' : 'No users found. Add some alumni to get started.'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.phone || '-'}</TableCell>
                          <TableCell>{u.location || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                u.userType === 'admin'
                                  ? 'default'
                                  : u.userType === 'mentor'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="flex items-center gap-1 w-fit"
                            >
                              {u.userType === 'admin' && <Shield className="w-3 h-3" />}
                              {u.userType === 'mentor' && <GraduationCap className="w-3 h-3" />}
                              {u.userType === 'alumni' && <Users className="w-3 h-3" />}
                              {u.userType.charAt(0).toUpperCase() + u.userType.slice(1)}
                            </Badge>
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
            <Button onClick={handleBulkUpload} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Alumni
                </>
              )}
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


