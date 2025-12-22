import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  document_type: string;
  reason?: string;
  requested_at: string;
  estimated_completion?: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
}

const AdminDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'>('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      console.log('Fetching document requests with filter:', statusFilter);
      const response = await apiClient.getAdminDocumentRequests(statusFilter, 1, 100);
      console.log('Fetched document requests:', response);
      console.log('Total requests:', response.total);
      console.log('Requests array:', response.requests);
      // Cast status to proper type
      setRequests(response.requests.map(req => ({
        ...req,
        status: req.status as DocumentRequest['status']
      })));
      if (response.total === 0) {
        console.warn('No document requests found. Check if:');
        console.warn('1. Alumni and admin are from the same university');
        console.warn('2. Document requests were actually created');
        console.warn('3. University ID matches between admin and requests');
      }
    } catch (error: any) {
      console.error('Error fetching document requests:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch document requests. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, filter]);

  const handleApprove = async (requestId: string) => {
    try {
      await apiClient.updateDocumentRequestStatus(requestId, 'approved');
      await fetchRequests();
      toast({
        title: 'Request approved',
        description: 'The document request has been approved and the user has been notified',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await apiClient.updateDocumentRequestStatus(requestId, 'rejected');
      await fetchRequests();
      toast({
        title: 'Request rejected',
        description: 'The user has been notified',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  const filteredRequests = requests;

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  const getStatusBadge = (status: DocumentRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
          <Clock className="w-3 h-3 mr-1" />
          In Progress
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Document Requests</h2>
            <p className="text-sm text-muted-foreground">
              Review and approve document requests from alumni
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'all' 
                ? 'bg-primary/10 border-primary' 
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <p className="text-2xl font-bold">{requests.length}</p>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'pending' 
                ? 'bg-yellow-500/10 border-yellow-500' 
                : 'bg-card border-border hover:border-yellow-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'approved' 
                ? 'bg-green-500/10 border-green-500' 
                : 'bg-card border-border hover:border-green-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'rejected' 
                ? 'bg-red-500/10 border-red-500' 
                : 'bg-card border-border hover:border-red-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </button>
        </div>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 animate-pulse" />
                <div className="w-14 h-14 rounded-full border-4 border-t-primary border-transparent animate-spin absolute inset-0" />
                <FileText className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Loading document requests...</p>
              <div className="flex gap-1 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-green-500/60" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Document Requests</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {filter === 'all' 
                  ? 'Document requests from alumni will appear here for processing.'
                  : `No ${filter} requests at the moment.`}
              </p>
            </div>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{request.document_type}</h3>
                      <p className="text-sm text-muted-foreground">{request.user_name} • {request.user_email}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Reason:</p>
                      <p className="font-medium">{request.reason || 'No reason provided'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Request Date:</p>
                      <p className="font-medium">{new Date(request.requested_at).toLocaleDateString()}</p>
                    </div>
                    {request.estimated_completion && (
                      <div>
                        <p className="text-muted-foreground mb-1">Estimated Completion:</p>
                        <p className="font-medium">{new Date(request.estimated_completion).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {(request.status === 'pending' || request.status === 'in_progress') && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => handleApprove(request.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
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

                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDocuments;

