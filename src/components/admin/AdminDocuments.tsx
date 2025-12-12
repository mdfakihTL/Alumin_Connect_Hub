import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, CheckCircle, XCircle, Clock, Download, RefreshCw, 
  Search, Loader2, AlertCircle, Trash2, Edit2, Eye, FileCheck,
  Send, User, Building, CheckCircle2, Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/documentService';
import { 
  Document, 
  DocumentFileType, 
  DocumentStatus,
  formatFileSize,
  DocumentRequest,
  DocumentRequestStatus,
  getRequestStatusLabel,
  getDocumentTypeLabel,
} from '@/types/documents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AdminDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('requests');
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
  const [filterFileType, setFilterFileType] = useState<DocumentFileType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit state
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View state
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  // Document Requests state
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestStatusFilter, setRequestStatusFilter] = useState<DocumentRequestStatus | 'all'>('all');
  const [requestSearchTerm, setRequestSearchTerm] = useState('');

  // Process request state
  const [processingRequest, setProcessingRequest] = useState<DocumentRequest | null>(null);
  const [processStatus, setProcessStatus] = useState<DocumentRequestStatus>('approved');
  const [processNotes, setProcessNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // View request details state
  const [viewingRequest, setViewingRequest] = useState<DocumentRequest | null>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = filterFileType !== 'all' ? { file_type: filterFileType } : undefined;
      const docs = await documentService.listDocuments(params);
      setDocuments(docs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterFileType, toast]);

  // Fetch document requests
  const fetchDocumentRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    setRequestsError(null);
    try {
      const params = {
        page: requestsPage,
        page_size: 20,
        ...(requestStatusFilter !== 'all' && { status_filter: requestStatusFilter }),
      };
      const response = await documentService.listDocumentRequests(params);
      setDocumentRequests(response.requests);
      setRequestsTotalPages(response.total_pages);
      setRequestsTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load document requests';
      setRequestsError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [requestsPage, requestStatusFilter, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchDocumentRequests();
  }, [fetchDocumentRequests]);

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Statistics
  const totalCount = documents.length;
  const processedCount = documents.filter(d => d.status === 'processed').length;
  const processingCount = documents.filter(d => d.status === 'processing').length;
  const failedCount = documents.filter(d => d.status === 'failed').length;

  // Edit handlers
  const openEditDialog = (doc: Document) => {
    setEditingDocument(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDocument) return;

    setIsSaving(true);
    try {
      const updatedDoc = await documentService.updateDocument(editingDocument.id, {
        title: editTitle,
        description: editDescription || undefined,
      });

      setDocuments(prev => 
        prev.map(d => d.id === updatedDoc.id ? updatedDoc : d)
      );

      setIsEditDialogOpen(false);
      setEditingDocument(null);

      toast({
        title: 'Document Updated',
        description: 'Document has been updated successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update document';
      toast({
        title: 'Update Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    if (deletingDocumentId === null) return;

    setIsDeleting(true);
    try {
      await documentService.deleteDocument(deletingDocumentId);

      setDocuments(prev => prev.filter(d => d.id !== deletingDocumentId));

      toast({
        title: 'Document Deleted',
        description: 'Document has been deleted successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      toast({
        title: 'Delete Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeletingDocumentId(null);
    }
  };

  // Download handler
  const handleDownload = (doc: Document) => {
    const url = documentService.getDocumentDownloadUrl(doc.file_path);
    window.open(url, '_blank');
  };

  // Open process request dialog
  const openProcessDialog = (request: DocumentRequest) => {
    setProcessingRequest(request);
    setProcessStatus('approved');
    setProcessNotes('');
  };

  // Handle process request
  const handleProcessRequest = async () => {
    if (!processingRequest) return;

    setIsProcessing(true);
    try {
      const updatedRequest = await documentService.updateDocumentRequestStatus(
        processingRequest.id,
        {
          status: processStatus,
          admin_notes: processNotes || undefined,
        }
      );

      // Update in list
      setDocumentRequests(prev =>
        prev.map(r => r.id === updatedRequest.id ? updatedRequest : r)
      );

      setProcessingRequest(null);
      setProcessNotes('');

      toast({
        title: 'Request Updated',
        description: `Request has been ${getRequestStatusLabel(processStatus).toLowerCase()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process request';
      toast({
        title: 'Process Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick action handlers for document requests
  const handleQuickApprove = async (request: DocumentRequest) => {
    try {
      const updatedRequest = await documentService.updateDocumentRequestStatus(
        request.id,
        { status: 'approved' }
      );
      setDocumentRequests(prev =>
        prev.map(r => r.id === updatedRequest.id ? updatedRequest : r)
      );
      toast({
        title: 'Request Approved',
        description: `${getDocumentTypeLabel(request.document_type)} request has been approved`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      toast({
        title: 'Approval Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleQuickReject = async (request: DocumentRequest) => {
    try {
      const updatedRequest = await documentService.updateDocumentRequestStatus(
        request.id,
        { status: 'rejected' }
      );
      setDocumentRequests(prev =>
        prev.map(r => r.id === updatedRequest.id ? updatedRequest : r)
      );
      toast({
        title: 'Request Rejected',
        description: `${getDocumentTypeLabel(request.document_type)} request has been rejected`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      toast({
        title: 'Rejection Failed',
        description: message,
        variant: 'destructive',
      });
    }
  };

  // Status badge
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'processing':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case 'processed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  // File type badge
  const getFileTypeBadge = (fileType: DocumentFileType) => {
    const colors: Record<DocumentFileType, string> = {
      pdf: 'bg-red-500/10 text-red-600 border-red-500/20',
      docx: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      txt: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    return (
      <Badge variant="outline" className={colors[fileType] || colors.txt}>
        {fileType.toUpperCase()}
      </Badge>
    );
  };

  // Request status badge
  const getRequestStatusBadge = (status: DocumentRequestStatus) => {
    const config: Record<DocumentRequestStatus, { className: string; icon: React.ReactNode }> = {
      pending: { 
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      approved: { 
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      },
      rejected: { 
        className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        icon: <XCircle className="w-3 h-3 mr-1" />
      },
      processing: { 
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
        icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      },
      completed: { 
        className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        icon: <FileCheck className="w-3 h-3 mr-1" />
      },
      cancelled: { 
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
        icon: <Ban className="w-3 h-3 mr-1" />
      },
    };
    
    const { className, icon } = config[status] || config.pending;
    return (
      <Badge variant="outline" className={className}>
        {icon}
        {getRequestStatusLabel(status)}
      </Badge>
    );
  };

  // Request statistics
  const pendingRequestsCount = documentRequests.filter(r => r.status === 'pending').length;
  const approvedRequestsCount = documentRequests.filter(r => r.status === 'approved').length;
  const rejectedRequestsCount = documentRequests.filter(r => r.status === 'rejected').length;
  const processingRequestsCount = documentRequests.filter(r => r.status === 'processing').length;

  // Filter requests by search term
  const filteredRequests = documentRequests.filter(request => {
    if (!requestSearchTerm) return true;
    const searchLower = requestSearchTerm.toLowerCase();
    return (
      request.requestor_name.toLowerCase().includes(searchLower) ||
      request.document_type.toLowerCase().includes(searchLower) ||
      request.reason.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            <span>Document Requests</span>
            {pendingRequestsCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Uploaded Documents</span>
          </TabsTrigger>
        </TabsList>

        {/* Document Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Document Requests</h2>
                <p className="text-sm text-muted-foreground">
                  Review and process alumni document requests
                </p>
              </div>
              <Button variant="outline" onClick={fetchDocumentRequests} disabled={isLoadingRequests}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Request Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => { setRequestStatusFilter('all'); setRequestsPage(1); }}
                className={`p-4 rounded-lg border transition-all text-left ${
                  requestStatusFilter === 'all' 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <p className="text-2xl font-bold">{requestsTotal}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </button>
              <button
                onClick={() => { setRequestStatusFilter('pending'); setRequestsPage(1); }}
                className={`p-4 rounded-lg border transition-all text-left ${
                  requestStatusFilter === 'pending' 
                    ? 'bg-yellow-500/10 border-yellow-500' 
                    : 'bg-card border-border hover:border-yellow-500/50'
                }`}
              >
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingRequestsCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </button>
              <button
                onClick={() => { setRequestStatusFilter('approved'); setRequestsPage(1); }}
                className={`p-4 rounded-lg border transition-all text-left ${
                  requestStatusFilter === 'approved' 
                    ? 'bg-green-500/10 border-green-500' 
                    : 'bg-card border-border hover:border-green-500/50'
                }`}
              >
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedRequestsCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </button>
              <button
                onClick={() => { setRequestStatusFilter('rejected'); setRequestsPage(1); }}
                className={`p-4 rounded-lg border transition-all text-left ${
                  requestStatusFilter === 'rejected' 
                    ? 'bg-red-500/10 border-red-500' 
                    : 'bg-card border-border hover:border-red-500/50'
                }`}
              >
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedRequestsCount}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, type, or reason..."
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                  className="w-72"
                />
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoadingRequests && (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading document requests...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {!isLoadingRequests && requestsError && (
            <Card className="p-8 border-destructive/50">
              <div className="flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-destructive font-medium">{requestsError}</p>
                <Button variant="outline" onClick={fetchDocumentRequests}>
                  Try Again
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!isLoadingRequests && !requestsError && filteredRequests.length === 0 && (
            <Card className="p-8 text-center">
              <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {documentRequests.length === 0 
                  ? 'No document requests yet'
                  : 'No requests match your filters'
                }
              </p>
            </Card>
          )}

          {/* Requests List */}
          {!isLoadingRequests && !requestsError && filteredRequests.length > 0 && (
            <div className="space-y-4">
              {filteredRequests.map(request => (
                <Card key={request.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{getDocumentTypeLabel(request.document_type)}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{request.requestor_name}</span>
                            <span>•</span>
                            <Building className="w-3 h-3" />
                            <span>{request.university_name}</span>
                          </div>
                        </div>
                        {getRequestStatusBadge(request.status)}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium mb-1">Reason:</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>

                      {request.admin_notes && (
                        <div className="bg-blue-500/10 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-400">Admin Notes:</p>
                          <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground mb-1">Submitted:</p>
                          <p className="font-medium">{new Date(request.created_at).toLocaleString()}</p>
                        </div>
                        {request.processed_at && (
                          <div>
                            <p className="text-muted-foreground mb-1">Processed:</p>
                            <p className="font-medium">{new Date(request.processed_at).toLocaleString()}</p>
                          </div>
                        )}
                        {request.processed_by_name && (
                          <div>
                            <p className="text-muted-foreground mb-1">Processed By:</p>
                            <p className="font-medium">{request.processed_by_name}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setViewingRequest(request)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={() => handleQuickApprove(request)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => handleQuickReject(request)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openProcessDialog(request)}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Process with Notes
                            </Button>
                          </>
                        )}
                        {(request.status === 'approved' || request.status === 'processing') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openProcessDialog(request)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Update Status
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {requestsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                    disabled={requestsPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {requestsPage} of {requestsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestsPage(p => Math.min(requestsTotalPages, p + 1))}
                    disabled={requestsPage === requestsTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Uploaded Documents Tab */}
        <TabsContent value="uploads" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Document Management</h2>
                <p className="text-sm text-muted-foreground">
                  View and manage all uploaded documents
                </p>
              </div>
              <Button variant="outline" onClick={fetchDocuments} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => setFilterStatus('all')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  filterStatus === 'all' 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </button>
              <button
                onClick={() => setFilterStatus('processed')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  filterStatus === 'processed' 
                    ? 'bg-green-500/10 border-green-500' 
                    : 'bg-card border-border hover:border-green-500/50'
                }`}
              >
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{processedCount}</p>
                <p className="text-sm text-muted-foreground">Processed</p>
              </button>
              <button
                onClick={() => setFilterStatus('processing')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  filterStatus === 'processing' 
                    ? 'bg-yellow-500/10 border-yellow-500' 
                    : 'bg-card border-border hover:border-yellow-500/50'
                }`}
              >
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{processingCount}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </button>
              <button
                onClick={() => setFilterStatus('failed')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  filterStatus === 'failed' 
                    ? 'bg-red-500/10 border-red-500' 
                    : 'bg-card border-border hover:border-red-500/50'
                }`}
              >
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">File Type:</Label>
                <Select 
                  value={filterFileType} 
                  onValueChange={(v) => setFilterFileType(v as DocumentFileType | 'all')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <Card className="p-8 border-destructive/50">
              <div className="flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
                <Button variant="outline" onClick={fetchDocuments}>
                  Try Again
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredDocuments.length === 0 && (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {documents.length === 0 
                  ? 'No documents have been uploaded yet'
                  : 'No documents match your filters'
                }
              </p>
            </Card>
          )}

          {/* Documents List */}
          {!isLoading && !error && filteredDocuments.length > 0 && (
            <div className="space-y-4">
              {filteredDocuments.map(doc => (
                <Card key={doc.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Uploaded by User #{doc.uploader_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status)}
                          {getFileTypeBadge(doc.file_type)}
                        </div>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground mb-1">File Size:</p>
                          <p className="font-medium">{formatFileSize(doc.file_size)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Uploaded:</p>
                          <p className="font-medium">{new Date(doc.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Last Updated:</p>
                          <p className="font-medium">{new Date(doc.updated_at).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setViewingDocument(doc)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                          disabled={doc.status !== 'processed'}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(doc)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingDocumentId(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={viewingDocument !== null} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {viewingDocument && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{viewingDocument.title}</p>
              </div>
              {viewingDocument.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{viewingDocument.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">File Type</Label>
                  <p className="font-medium uppercase">{viewingDocument.file_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">File Size</Label>
                  <p className="font-medium">{formatFileSize(viewingDocument.file_size)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingDocument.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uploader ID</Label>
                  <p className="font-medium">{viewingDocument.uploader_id}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">File Path</Label>
                <p className="font-medium text-sm break-all">{viewingDocument.file_path}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium text-sm">{new Date(viewingDocument.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="font-medium text-sm">{new Date(viewingDocument.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingDocument(null)}>
              Close
            </Button>
            {viewingDocument && viewingDocument.status === 'processed' && (
              <Button onClick={() => handleDownload(viewingDocument)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the document's title and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingDocumentId !== null} onOpenChange={(open) => !open && setDeletingDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Process Request Dialog */}
      <Dialog open={processingRequest !== null} onOpenChange={(open) => !open && setProcessingRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Process Document Request</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this document request.
            </DialogDescription>
          </DialogHeader>
          {processingRequest && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">{getDocumentTypeLabel(processingRequest.document_type)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Requested by: {processingRequest.requestor_name}
                </p>
              </div>
              
              <div>
                <Label htmlFor="process-status">Status</Label>
                <Select 
                  value={processStatus} 
                  onValueChange={(v) => setProcessStatus(v as DocumentRequestStatus)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="process-notes">Admin Notes (optional)</Label>
                <Textarea
                  id="process-notes"
                  placeholder="Add any notes or instructions for the requester..."
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessingRequest(null)}>
              Cancel
            </Button>
            <Button onClick={handleProcessRequest} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Update Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Details Dialog */}
      <Dialog open={viewingRequest !== null} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Request Details</DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">Status</Label>
                {getRequestStatusBadge(viewingRequest.status)}
              </div>
              <div>
                <Label className="text-muted-foreground">Document Type</Label>
                <p className="font-medium mt-1">{getDocumentTypeLabel(viewingRequest.document_type)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Requestor</Label>
                <p className="font-medium mt-1">{viewingRequest.requestor_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">University</Label>
                <p className="font-medium mt-1">{viewingRequest.university_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="font-medium mt-1">{viewingRequest.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium mt-1 text-sm">
                    {new Date(viewingRequest.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <p className="font-medium mt-1 text-sm">
                    {new Date(viewingRequest.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {viewingRequest.processed_at && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Processed At</Label>
                    <p className="font-medium mt-1 text-sm">
                      {new Date(viewingRequest.processed_at).toLocaleString()}
                    </p>
                  </div>
                  {viewingRequest.processed_by_name && (
                    <div>
                      <Label className="text-muted-foreground">Processed By</Label>
                      <p className="font-medium mt-1">{viewingRequest.processed_by_name}</p>
                    </div>
                  )}
                </div>
              )}
              {viewingRequest.admin_notes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{viewingRequest.admin_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRequest(null)}>
              Close
            </Button>
            {viewingRequest && viewingRequest.status === 'pending' && (
              <Button onClick={() => {
                setViewingRequest(null);
                openProcessDialog(viewingRequest);
              }}>
                <Edit2 className="w-4 h-4 mr-2" />
                Process Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDocuments;
