import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key, CheckCircle, XCircle, Clock, Mail, User, Calendar, Shield, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordResetRequest {
  id: string;
  email: string;
  name: string;
  type: 'admin' | 'alumni';
  universityId?: string;
  universityName?: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedDate?: string;
  newPassword?: string;
}

const SuperAdminPasswordResets = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const stored = localStorage.getItem('super_admin_password_resets');
    if (stored) {
      setRequests(JSON.parse(stored));
    }
  };

  const saveRequests = (updatedRequests: PasswordResetRequest[]) => {
    localStorage.setItem('super_admin_password_resets', JSON.stringify(updatedRequests));
    setRequests(updatedRequests);
  };

  const handleApprove = (request: PasswordResetRequest) => {
    setSelectedRequest(request);
    setNewPassword('');
    setIsModalOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedRequest || !newPassword) {
      toast({
        title: 'Error',
        description: 'Please enter a new password',
        variant: 'destructive',
      });
      return;
    }

    const updatedRequests = requests.map(req =>
      req.id === selectedRequest.id
        ? {
            ...req,
            status: 'approved' as const,
            resolvedDate: new Date().toISOString(),
            newPassword,
          }
        : req
    );

    // Update admin credentials if it's an admin request
    if (selectedRequest.type === 'admin') {
      const credentials = JSON.parse(localStorage.getItem('admin_credentials') || '{}');
      credentials[selectedRequest.email] = {
        password: newPassword,
        universityId: selectedRequest.universityId,
        universityName: selectedRequest.universityName,
      };
      localStorage.setItem('admin_credentials', JSON.stringify(credentials));
    }

    saveRequests(updatedRequests);
    setIsModalOpen(false);
    setSelectedRequest(null);
    setNewPassword('');

    toast({
      title: 'Request approved',
      description: `New password has been set and email sent to ${selectedRequest.email}`,
    });
  };

  const handleReject = (requestId: string) => {
    if (window.confirm('Are you sure you want to reject this password reset request?')) {
      const updatedRequests = requests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'rejected' as const,
              resolvedDate: new Date().toISOString(),
            }
          : req
      );

      saveRequests(updatedRequests);

      toast({
        title: 'Request rejected',
        description: 'The user has been notified',
        variant: 'destructive',
      });
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

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(req => req.status === filter);

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

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

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold">Admin Password Reset Requests</h2>
            <p className="text-sm text-muted-foreground">
              Manage password reset requests from university administrators
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'all'
                ? 'bg-primary/10 border-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <p className="text-xl font-bold">{requests.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500/10 border-yellow-500'
                : 'bg-card border-border hover:border-yellow-500/50'
            }`}
          >
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'approved'
                ? 'bg-green-500/10 border-green-500'
                : 'bg-card border-border hover:border-green-500/50'
            }`}
          >
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`p-3 rounded-lg border transition-all ${
              filter === 'rejected'
                ? 'bg-red-500/10 border-red-500'
                : 'bg-card border-border hover:border-red-500/50'
            }`}
          >
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </button>
        </div>
      </Card>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No password reset requests</p>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {request.type === 'admin' ? (
                        <Shield className="w-5 h-5 text-primary" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{request.name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      {request.universityName && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {request.universityName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Request Date:</p>
                        <p className="text-xs font-medium">{new Date(request.requestDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {request.resolvedDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Resolved:</p>
                          <p className="text-xs font-medium">{new Date(request.resolvedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(request)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Set Password
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === 'approved' && request.newPassword && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                        New Password Set:
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {request.newPassword}
                      </code>
                    </div>
                  )}
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
                {selectedRequest?.type === 'admin' ? (
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                ) : (
                  <User className="w-4 h-4 text-blue-500 mt-0.5" />
                )}
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium">User: {selectedRequest?.name}</p>
                  <p className="text-xs">{selectedRequest?.email}</p>
                  {selectedRequest?.universityName && (
                    <p className="text-xs">University: {selectedRequest.universityName}</p>
                  )}
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
                  The new password will be sent to the {selectedRequest?.type === 'admin' ? 'administrator' : 'user'}'s email address.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmApproval} className="flex-1">
                Approve & Send
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedRequest(null);
                  setNewPassword('');
                }}
                className="flex-1"
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

