import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key, CheckCircle, Clock, Mail, Calendar, Shield, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { superadminApi } from '@/api/superadmin';

interface AdminPasswordResetRequest {
  id: string;
  admin_name: string;
  admin_email: string;
  university_name: string;
  requested_at: string;
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

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = (request: AdminPasswordResetRequest) => {
    setSelectedRequest(request);
    setNewPassword('');
    setIsModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedRequest || !newPassword) {
      toast({
        title: 'Error',
        description: 'Please enter a new password',
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
      toast({
        title: 'Error',
        description: 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading requests...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold">Admin Password Reset Requests</h2>
            <p className="text-sm text-muted-foreground">
              Manage password reset requests from university administrators
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadRequests} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
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
        </div>
      </Card>

      {/* Requests List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
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
            </div>
          </Card>
        ) : (
          requests.map(request => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{request.admin_name}</h3>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.admin_email}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {request.university_name}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Request Date:</p>
                        <p className="text-xs font-medium">
                          {request.requested_at 
                            ? new Date(request.requested_at).toLocaleDateString() 
                            : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(request)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Set Password
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Approval Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set New Password for Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium">Admin: {selectedRequest?.admin_name}</p>
                  <p className="text-xs">{selectedRequest?.admin_email}</p>
                  <p className="text-xs">University: {selectedRequest?.university_name}</p>
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
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmApproval} className="flex-1" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Approve & Send'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedRequest(null);
                  setNewPassword('');
                }}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminPasswordResets;
