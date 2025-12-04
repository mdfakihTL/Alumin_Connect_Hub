import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  purpose: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const stored = localStorage.getItem(`document_requests_${user?.universityId}`);
    if (stored) {
      setRequests(JSON.parse(stored));
    } else {
      // Add dummy data
      const dummyRequests: DocumentRequest[] = [
        {
          id: 'dr1',
          userId: 'u1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          documentType: 'Transcript',
          purpose: 'Job Application',
          requestDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending',
        },
        {
          id: 'dr2',
          userId: 'u2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          documentType: 'Degree Certificate',
          purpose: 'Higher Education',
          requestDate: new Date(Date.now() - 172800000).toISOString(),
          status: 'pending',
        },
        {
          id: 'dr3',
          userId: 'u3',
          userName: 'Mike Johnson',
          userEmail: 'mike@example.com',
          documentType: 'Recommendation Letter',
          purpose: 'Visa Application',
          requestDate: new Date(Date.now() - 259200000).toISOString(),
          status: 'approved',
        },
        {
          id: 'dr4',
          userId: 'u4',
          userName: 'Sarah Williams',
          userEmail: 'sarah@example.com',
          documentType: 'Alumni Certificate',
          purpose: 'Professional Verification',
          requestDate: new Date(Date.now() - 345600000).toISOString(),
          status: 'pending',
        },
      ];
      setRequests(dummyRequests);
      localStorage.setItem(`document_requests_${user?.universityId}`, JSON.stringify(dummyRequests));
    }
  }, [user?.universityId]);

  const handleApprove = (requestId: string) => {
    const updatedRequests = requests.map(req =>
      req.id === requestId ? { ...req, status: 'approved' as const } : req
    );
    setRequests(updatedRequests);
    localStorage.setItem(`document_requests_${user?.universityId}`, JSON.stringify(updatedRequests));
    toast({
      title: 'Request approved',
      description: 'The document will be generated and sent to the user',
    });
  };

  const handleReject = (requestId: string) => {
    const updatedRequests = requests.map(req =>
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
    );
    setRequests(updatedRequests);
    localStorage.setItem(`document_requests_${user?.universityId}`, JSON.stringify(updatedRequests));
    toast({
      title: 'Request rejected',
      description: 'The user has been notified',
      variant: 'destructive',
    });
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

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
        {filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No document requests found</p>
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
                      <h3 className="font-semibold text-lg">{request.documentType}</h3>
                      <p className="text-sm text-muted-foreground">{request.userName} • {request.userEmail}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Purpose:</p>
                      <p className="font-medium">{request.purpose}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Request Date:</p>
                      <p className="font-medium">{new Date(request.requestDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
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
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <Button size="sm" variant="outline" className="mt-4">
                      <Download className="w-4 h-4 mr-2" />
                      Download Document
                    </Button>
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

