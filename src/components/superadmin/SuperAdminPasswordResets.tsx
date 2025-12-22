import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Key, CheckCircle, XCircle, Clock, Mail, Calendar, Shield, 
  RefreshCw, Loader2, AlertTriangle, User, Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { superadminApi } from '@/api/superadmin';
import { apiClient } from '@/lib/api';

interface AdminPasswordResetRequest {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  university_id?: string;
  university_name: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  processed_at?: string;
  processed_by_name?: string;
  rejection_reason?: string;
}

const SuperAdminPasswordResets = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AdminPasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminPasswordResetRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [total, setTotal] = useState(0);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await superadminApi.getAdminPasswordResets();
      setRequests(response.requests || []);
      setTotal(response.requests?.length || 0);
    } catch (error) {
      console.error('Failed to load admin password reset requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load password reset requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  
  // Filters
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  // Modals
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusFilter = filter === 'all' ? undefined : filter;
      const response = await apiClient.getSuperAdminPasswordResets({
        status_filter: statusFilter,
        page: currentPage,
        page_size: pageSize,
      });
      
      setRequests(response.requests);
      setStats({
        total: response.total,
        pending: response.pending_count,
        approved: response.approved_count,
        rejected: response.rejected_count,
      });
    } catch (error: any) {
      console.error('Failed to load password resets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load password reset requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentPage, toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = (request: AdminPasswordResetRequest) => {
    setSelectedRequest(request);
    setIsApproveModalOpen(true);
  };

  const handleReject = (request: PasswordResetRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedRequest || !newPassword) {
  const confirmApproval = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.approveSuperAdminPasswordReset(selectedRequest.id);
      
      toast({
        title: 'Request approved',
        description: `New password has been generated and sent to ${selectedRequest.admin_email}`,
      });
      
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Failed to approve',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await superadminApi.resetAdminPassword(selectedRequest.id, newPassword);
      
      toast({
        title: 'Password Reset Successful',
        description: `New password has been set for ${selectedRequest.admin_email}`,
      });

      setIsModalOpen(false);
      setSelectedRequest(null);
      setNewPassword('');
      
      // Reload the list
      loadRequests();
    } catch (error) {
      console.error('Failed to reset admin password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmRejection = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.rejectSuperAdminPasswordReset(selectedRequest.id, rejectionReason || undefined);
      
      toast({
        title: 'Error',
        description: 'Failed to reset password',
        title: 'Request rejected',
        description: 'The admin has been notified via email',
        variant: 'destructive',
      });
      
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Failed to reject',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PasswordResetRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Admin Password Reset Requests
            </h2>
            <p className="text-sm text-muted-foreground">
              Review and manage password reset requests from university administrators
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadRequests} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadRequests()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-primary/10 border-primary">
            <p className="text-xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Pending Requests</p>
          </div>
          <div className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-muted-foreground">
                {total === 0 ? 'All caught up!' : `${total} admin${total > 1 ? 's' : ''} waiting`}
              </p>
            </div>
          </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'all'
                ? 'bg-primary/10 border-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <p className="text-xl font-bold">{stats.pending + stats.approved + stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </button>
          <button
            onClick={() => { setFilter('pending'); setCurrentPage(1); }}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500/10 border-yellow-500'
                : 'bg-card border-border hover:border-yellow-500/50'
            }`}
          >
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </button>
          <button
            onClick={() => { setFilter('approved'); setCurrentPage(1); }}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'approved'
                ? 'bg-green-500/10 border-green-500'
                : 'bg-card border-border hover:border-green-500/50'
            }`}
          >
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </button>
          <button
            onClick={() => { setFilter('rejected'); setCurrentPage(1); }}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'rejected'
                ? 'bg-red-500/10 border-red-500'
                : 'bg-card border-border hover:border-red-500/50'
            }`}
          >
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && requests.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
        {!isLoading && requests.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                    <Key className="w-7 h-7 text-green-500/60" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground max-w-md text-sm">
                Password reset requests from university administrators will appear here for your review.
              </p>
                {filter === 'all' 
                  ? 'All password reset requests from admins will appear here for your review.'
                  : filter === 'pending'
                  ? 'Great! There are no pending requests that need your attention right now.'
                  : filter === 'approved'
                  ? 'No requests have been approved yet.'
                  : 'No requests have been rejected.'}
              </p>
              {filter !== 'pending' && stats.pending > 0 && (
                <Button variant="outline" className="mt-4" onClick={() => setFilter('pending')}>
                  View {stats.pending} Pending Request{stats.pending > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </Card>
        ) : (
          requests.map(request => (
            <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{request.admin_name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{request.admin_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{request.university_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Requested: </span>
                        <span className="text-xs">{formatDate(request.requested_at)}</span>
                      </div>
                    </div>
                    {request.processed_at && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.processed_by_name} on {formatDate(request.processed_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(request)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Set Password
                    </Button>
                  </div>
                  {/* Rejection reason */}
                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        <strong>Reason:</strong> {request.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Actions for pending requests */}
                  {request.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => handleApprove(request)} className="gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Approve & Send New Password
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request)}
                        className="text-destructive hover:text-destructive gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Approve Password Reset
            </DialogTitle>
            <DialogDescription>
              A new secure password will be automatically generated and sent to the admin.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-700 dark:text-blue-300">{selectedRequest.admin_name}</p>
                    <p className="text-blue-600 dark:text-blue-400">{selectedRequest.admin_email}</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">{selectedRequest.university_name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    <p>The new temporary password will be:</p>
                    <ul className="list-disc ml-4 mt-1 text-xs">
                      <li>Auto-generated securely</li>
                      <li>Valid for 24 hours</li>
                      <li>Sent via email to the admin</li>
                      <li>Required to be changed on next login</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsApproveModalOpen(false);
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmApproval} disabled={isSubmitting} className="gap-1">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve & Send Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Reject Password Reset
            </DialogTitle>
            <DialogDescription>
              The admin will be notified that their request has been declined.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-700 dark:text-red-300">{selectedRequest.admin_name}</p>
                    <p className="text-red-600 dark:text-red-400">{selectedRequest.admin_email}</p>
                  </div>
                </div>
              </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="flex gap-2">
                <Input
                  id="newPassword"
                  type="text"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  The new password will be sent to the administrator's email address.
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be sent to the admin in the notification email.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedRequest(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRejection} 
              disabled={isSubmitting}
              className="gap-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminPasswordResets;
