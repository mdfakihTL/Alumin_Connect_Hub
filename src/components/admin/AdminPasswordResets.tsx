import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key, CheckCircle, XCircle, Clock, Mail, User, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi, PasswordResetRequest } from '@/api/admin';

const AdminPasswordResets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [total, setTotal] = useState(0);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getPasswordResets({ page: 1, page_size: 100 });
      setRequests(response.requests);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load password reset requests:', error);
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

  const handleApprove = (request: PasswordResetRequest) => {
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
      await adminApi.resetUserPassword(selectedRequest.id, newPassword);
      
      toast({
        title: 'Password Reset Successful',
        description: `New password has been set for ${selectedRequest.user_email}`,
      });

      setIsModalOpen(false);
      setSelectedRequest(null);
      setNewPassword('');
      
      // Reload the list
      loadRequests();
    } catch (error) {
      console.error('Failed to reset password:', error);
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
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading requests...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Password Reset Requests</h2>
            <p className="text-sm text-muted-foreground">
              Manage password reset requests from alumni
            </p>
          </div>
          <Button variant="outline" onClick={loadRequests} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-primary/10 border-primary">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-sm text-muted-foreground">Pending Requests</p>
          </div>
          <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-muted-foreground">
                {total === 0 ? 'All caught up!' : `${total} request${total > 1 ? 's' : ''} waiting for approval`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-5">
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
              <p className="text-sm text-muted-foreground max-w-sm">
                Password reset requests from alumni will appear here.
              </p>
            </div>
          </Card>
        ) : (
          requests.map(request => (
            <Card key={request.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{request.user_name}</h3>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.user_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Request Date:</p>
                        <p className="font-medium">
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
            <DialogTitle>Set New Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium">User: {selectedRequest?.user_name}</p>
                  <p className="text-xs">{selectedRequest?.user_email}</p>
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
                  The new password will be sent to the user's email address automatically.
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

export default AdminPasswordResets;
