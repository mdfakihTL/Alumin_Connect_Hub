import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Shield, Plus, Mail, Building2, Search, RefreshCw, 
  CheckCircle, XCircle, AlertTriangle, Loader2, Clock,
  Power, PowerOff, UserCog, Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Admin {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  university_id?: string;
  university_name: string;
  is_active: boolean;
  force_password_reset: boolean;
  temp_password_expires_at?: string;
  created_at: string;
}

interface University {
  id: string;
  name: string;
  logo?: string;
  is_enabled: boolean;
}

const SuperAdminAdmins = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'toggle' | 'delete';
    admin: Admin;
  } | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUniversity, setFilterUniversity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  
  // Create form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    universityId: '',
  });

  // Load universities
  const loadUniversities = useCallback(async () => {
    try {
      const response = await apiClient.getSuperAdminUniversities();
      setUniversities(response);
    } catch (error) {
      console.error('Failed to load universities:', error);
    }
  }, []);

  // Load admins
  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (filterUniversity && filterUniversity !== 'all') params.university_id = filterUniversity;
      if (filterStatus && filterStatus !== 'all') params.is_active = filterStatus === 'active';
      
      const response = await apiClient.getSuperAdminAdmins(params);
      setAdmins(response.admins);
      setTotalAdmins(response.total);
    } catch (error: any) {
      console.error('Failed to load admins:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load admins',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filterUniversity, filterStatus, toast]);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadAdmins();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.universityId) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Call API - password will be auto-generated on backend
      await apiClient.createSuperAdminAdmin({
        email: formData.email,
        name: formData.name,
        university_id: formData.universityId,
      });

      toast({
        title: 'Admin created successfully!',
        description: `Credentials have been sent to ${formData.email}. The admin must change their password on first login.`,
      });

      resetForm();
      loadAdmins();
    } catch (error: any) {
      toast({
        title: 'Failed to create admin',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    setConfirmAction({ type: 'toggle', admin });
    setIsConfirmModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!confirmAction || confirmAction.type !== 'toggle') return;
    
    const admin = confirmAction.admin;
    setIsSubmitting(true);
    
    try {
      await apiClient.toggleSuperAdminAdminStatus(admin.id);
      
      toast({
        title: admin.is_active ? 'Admin deactivated' : 'Admin activated',
        description: `${admin.name} has been ${admin.is_active ? 'deactivated' : 'activated'}`,
      });
      
      loadAdmins();
    } catch (error: any) {
      toast({
        title: 'Action failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', universityId: '' });
    setIsCreateModalOpen(false);
  };

  const getTempPasswordStatus = (admin: Admin) => {
    if (!admin.force_password_reset) return null;
    
    if (admin.temp_password_expires_at) {
      const expiresAt = new Date(admin.temp_password_expires_at);
      const now = new Date();
      const hoursLeft = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (hoursLeft <= 0) {
        return { status: 'expired', text: 'Password expired' };
      }
      return { status: 'pending', text: `Expires in ${hoursLeft}h` };
    }
    return { status: 'pending', text: 'Must change password' };
  };

  const totalPages = Math.ceil(totalAdmins / pageSize);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Card */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Admin Management
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create and manage university administrators • {totalAdmins} total admins
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => loadAdmins()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterUniversity} onValueChange={setFilterUniversity}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by university" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map(uni => (
                <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && admins.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map(admin => {
          const tempPasswordStatus = getTempPasswordStatus(admin);
          
          return (
            <Card key={admin.id} className={`p-4 hover:shadow-lg transition-shadow ${!admin.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    admin.is_active 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {admin.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{admin.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                  {admin.is_active ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">
                      <XCircle className="w-3 h-3 mr-1" />
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{admin.university_name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(admin.created_at).toLocaleDateString()}
                </div>
                
                {/* Temp Password Status */}
                {tempPasswordStatus && (
                  <div className={`flex items-center gap-2 text-xs p-2 rounded ${
                    tempPasswordStatus.status === 'expired' 
                      ? 'bg-red-500/10 text-red-600' 
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    {tempPasswordStatus.status === 'expired' ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <Key className="w-3 h-3" />
                    <span>{tempPasswordStatus.text}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a href={`mailto:${admin.email}`}>
                    <Mail className="w-3 h-3 mr-1" />
                    Contact
                  </a>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleToggleStatus(admin)}
                  className={admin.is_active ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
                >
                  {admin.is_active ? (
                    <PowerOff className="w-3 h-3" />
                  ) : (
                    <Power className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </Card>
          );
        })}

        {/* Empty State */}
        {!isLoading && admins.length === 0 && (
          <Card className="p-10 text-center col-span-full border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-primary/60" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Admins Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                {searchQuery || filterUniversity !== 'all' || filterStatus !== 'all'
                  ? 'No admins match your current filters. Try adjusting your search criteria.'
                  : 'Add university administrators to help manage alumni platforms. Each admin can manage their assigned university.'}
              </p>
              {!searchQuery && filterUniversity === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Admin
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Admin Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Add New Administrator
            </DialogTitle>
            <DialogDescription>
              Create a new university admin. A secure password will be auto-generated and sent via email.
            </DialogDescription>
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
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="university">Assigned University *</Label>
              <Select 
                value={formData.universityId} 
                onValueChange={(value) => setFormData({ ...formData, universityId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.filter(u => u.is_enabled).map(uni => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>A secure temporary password will be auto-generated</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Login credentials will be sent to the admin's email</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Password expires in 24 hours - must be changed on first login</p>
              </div>
            </div>

            <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Admin Account
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'toggle' && confirmAction.admin.is_active
                ? `Are you sure you want to deactivate ${confirmAction.admin.name}? They will no longer be able to access the admin panel.`
                : `Are you sure you want to activate ${confirmAction?.admin.name}? They will regain access to the admin panel.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsConfirmModalOpen(false);
                setConfirmAction(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant={confirmAction?.admin.is_active ? "destructive" : "default"}
              onClick={confirmToggleStatus}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {confirmAction?.admin.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminAdmins;
