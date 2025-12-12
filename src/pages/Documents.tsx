import { useState, useEffect, useCallback, useRef } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Download, Search, Clock, CheckCircle2, XCircle, Menu, 
  Upload, Trash2, Edit2, RefreshCw, AlertCircle, Loader2, FileUp,
  FileCheck, Send, History, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentService } from "@/services/documentService";
import { 
  Document, 
  DocumentSearchResult, 
  DocumentFileType,
  formatFileSize, 
  isDocumentOwner,
  DocumentRequest,
  DocumentRequestStatus,
  RequestableDocumentType,
  getRequestStatusLabel,
  getDocumentTypeLabel,
} from "@/types/documents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Documents = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document list state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [filterFileType, setFilterFileType] = useState<DocumentFileType | 'all'>('all');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Edit/Delete state
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Document Request state
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [requestStatusFilter, setRequestStatusFilter] = useState<DocumentRequestStatus | 'all'>('all');
  
  // Create request form state
  const [requestDocType, setRequestDocType] = useState<RequestableDocumentType>('transcript');
  const [requestReason, setRequestReason] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  // View request details state
  const [viewingRequest, setViewingRequest] = useState<DocumentRequest | null>(null);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fetch document requests when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDocumentRequests();
    }
  }, [isAuthenticated, requestsPage, requestStatusFilter]);

  // Fetch document requests
  const fetchDocumentRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingRequests(true);
    setRequestsError(null);
    try {
      const params = {
        page: requestsPage,
        page_size: 10,
        ...(requestStatusFilter !== 'all' && { status_filter: requestStatusFilter }),
      };
      const response = await documentService.listDocumentRequests(params);
      setDocumentRequests(response.requests);
      setRequestsTotalPages(response.total_pages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load document requests';
      setRequestsError(message);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [isAuthenticated, requestsPage, requestStatusFilter]);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    setDocumentsError(null);
    try {
      const params = filterFileType !== 'all' ? { file_type: filterFileType } : undefined;
      const docs = await documentService.listDocuments(params);
      setDocuments(docs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load documents';
      setDocumentsError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [filterFileType, toast]);

  // Refetch when filter changes
  useEffect(() => {
    fetchDocuments();
  }, [filterFileType, fetchDocuments]);

  // File selection handlers
  const handleFileSelect = (file: File) => {
    const error = documentService.validateFile(file);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    // Auto-populate title from filename if empty
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Upload document
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload documents",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newDoc = await documentService.uploadDocument(selectedFile, {
        title: uploadTitle || undefined,
        description: uploadDescription || undefined,
        onProgress: setUploadProgress,
      });

      // Add new document to the list
      setDocuments(prev => [newDoc, ...prev]);
      
      // Reset form
      setSelectedFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Upload Successful",
        description: `"${newDoc.title}" has been uploaded and is being processed`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload document';
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Search documents
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await documentService.searchDocuments({
        query: searchQuery,
        limit: 20,
      });
      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No documents found matching your query",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      toast({
        title: "Search Failed",
        description: message,
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Edit document
  const openEditDialog = (doc: Document) => {
    setEditingDocument(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description || "");
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

      // Update in list
      setDocuments(prev => 
        prev.map(d => d.id === updatedDoc.id ? updatedDoc : d)
      );

      // Update in search results if present
      setSearchResults(prev =>
        prev.map(d => d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d)
      );

      setIsEditDialogOpen(false);
      setEditingDocument(null);

      toast({
        title: "Document Updated",
        description: "Document metadata has been updated successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update document';
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete document
  const handleDelete = async () => {
    if (deletingDocumentId === null) return;

    setIsDeleting(true);
    try {
      await documentService.deleteDocument(deletingDocumentId);

      // Remove from list
      setDocuments(prev => prev.filter(d => d.id !== deletingDocumentId));
      
      // Remove from search results if present
      setSearchResults(prev => prev.filter(d => d.id !== deletingDocumentId));

      toast({
        title: "Document Deleted",
        description: "The document has been deleted successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document';
      toast({
        title: "Delete Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingDocumentId(null);
    }
  };

  // Download document
  const handleDownload = (doc: Document) => {
    const url = documentService.getDocumentDownloadUrl(doc.file_path);
    window.open(url, '_blank');
  };

  // Submit document request
  const handleSubmitRequest = async () => {
    if (!requestReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for your document request",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const newRequest = await documentService.createDocumentRequest({
        document_type: requestDocType,
        reason: requestReason,
      });

      // Add to list
      setDocumentRequests(prev => [newRequest, ...prev]);
      
      // Reset form
      setRequestDocType('transcript');
      setRequestReason("");

      toast({
        title: "Request Submitted",
        description: `Your ${getDocumentTypeLabel(newRequest.document_type)} request has been submitted successfully`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit request';
      toast({
        title: "Request Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Get status badge for document
  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get file type badge
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

  // Get request status badge
  const getRequestStatusBadge = (status: DocumentRequestStatus) => {
    const config: Record<DocumentRequestStatus, { className: string; icon: React.ReactNode }> = {
      pending: { 
        className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      approved: { 
        className: 'bg-green-500/10 text-green-600 border-green-500/20',
        icon: <CheckCircle2 className="w-3 h-3 mr-1" />
      },
      rejected: { 
        className: 'bg-red-500/10 text-red-600 border-red-500/20',
        icon: <XCircle className="w-3 h-3 mr-1" />
      },
      processing: { 
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      },
      completed: { 
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        icon: <FileCheck className="w-3 h-3 mr-1" />
      },
      cancelled: { 
        className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        icon: <XCircle className="w-3 h-3 mr-1" />
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

  // Render document card
  const renderDocumentCard = (doc: Document | DocumentSearchResult, showScore = false) => {
    const canEdit = isAuthenticated && user && isDocumentOwner(doc, user.id);
    const score = 'score' in doc ? doc.score : undefined;

    return (
      <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-base text-foreground truncate">{doc.title}</h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(doc.status)}
                {getFileTypeBadge(doc.file_type)}
              </div>
            </div>

            {doc.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{doc.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span>{formatFileSize(doc.file_size)}</span>
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
              {showScore && score !== undefined && (
                <span className="text-primary font-medium">
                  Relevance: {(score * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(doc)}
                disabled={doc.status !== 'processed'}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              
              {canEdit && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(doc)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingDocumentId(doc.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <MobileNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 flex-shrink-0"
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">Documents</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Upload, search, and manage your documents</p>
              </div>
            </div>

            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 h-11">
                <TabsTrigger value="browse" className="text-sm">Browse</TabsTrigger>
                <TabsTrigger value="upload" className="text-sm">
                  <span className="hidden sm:inline">Upload</span>
                  <span className="inline sm:hidden">
                    <Upload className="w-4 h-4" />
                  </span>
                </TabsTrigger>
                <TabsTrigger value="search" className="text-sm">
                  <span className="hidden sm:inline">AI Search</span>
                  <span className="inline sm:hidden">
                    <Search className="w-4 h-4" />
                  </span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="text-sm">
                  <span className="hidden sm:inline">Request Docs</span>
                  <span className="inline sm:hidden">
                    <FileCheck className="w-4 h-4" />
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Browse Documents */}
              <TabsContent value="browse" className="space-y-4">
                {/* Filters */}
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium whitespace-nowrap">Filter by type:</Label>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={fetchDocuments}
                      disabled={isLoadingDocuments}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </Card>

                {/* Loading State */}
                {isLoadingDocuments && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading documents...</p>
                    </div>
                  </Card>
                )}

                {/* Error State */}
                {!isLoadingDocuments && documentsError && (
                  <Card className="p-8 border-destructive/50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                      <p className="text-destructive font-medium">{documentsError}</p>
                      <Button variant="outline" onClick={fetchDocuments}>
                        Try Again
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Empty State */}
                {!isLoadingDocuments && !documentsError && documents.length === 0 && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No documents found</p>
                      <p className="text-sm text-muted-foreground">Upload your first document to get started</p>
                    </div>
                  </Card>
                )}

                {/* Document List */}
                {!isLoadingDocuments && !documentsError && documents.length > 0 && (
                  <div className="space-y-3">
                    {documents.map(doc => renderDocumentCard(doc))}
                  </div>
                )}
              </TabsContent>

              {/* Upload Documents */}
              <TabsContent value="upload" className="space-y-4">
                <Card className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">Upload Document</h3>
                      <p className="text-sm text-muted-foreground mt-1">Upload PDF, DOCX, or TXT files (max 10MB)</p>
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-2">Please log in to upload documents</p>
                      <Button variant="outline" onClick={() => window.location.href = '/login'}>
                        Log In
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Drag and Drop Zone */}
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                          dragActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileInputChange}
                        />
                        
                        {selectedFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <FileUp className="w-10 h-10 text-primary" />
                            <p className="font-medium text-foreground">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <p className="font-medium text-foreground">Drop a file here or click to browse</p>
                            <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT up to 10MB</p>
                          </div>
                        )}
                      </div>

                      {/* Title Input */}
                      <div>
                        <Label htmlFor="upload-title" className="text-base font-medium">Title (optional)</Label>
                        <Input
                          id="upload-title"
                          placeholder="Enter a title for your document"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="h-11 mt-2 text-base"
                        />
                      </div>

                      {/* Description Input */}
                      <div>
                        <Label htmlFor="upload-description" className="text-base font-medium">Description (optional)</Label>
                        <Textarea
                          id="upload-description"
                          placeholder="Add a description for your document..."
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          rows={3}
                          className="mt-2 text-base resize-none"
                        />
                      </div>

                      {/* Upload Progress */}
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      {/* Upload Button */}
                      <Button 
                        onClick={handleUpload} 
                        className="w-full h-11 text-base font-medium"
                        disabled={!selectedFile || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-2" />
                            <span>Upload Document</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* AI Search */}
              <TabsContent value="search" className="space-y-4">
                <Card className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">AI Document Search</h3>
                      <p className="text-sm text-muted-foreground mt-1">Search documents using natural language powered by AI</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="search-query" className="text-base font-medium">Search Query</Label>
                      <Textarea
                        id="search-query"
                        placeholder="E.g., software engineering experience, project management skills, Python programming..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        rows={3}
                        className="mt-2 text-base resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleSearch();
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Press Ctrl+Enter to search</p>
                    </div>

                    <Button 
                      onClick={handleSearch} 
                      className="w-full h-11 text-base font-medium"
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          <span>Search Documents</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Search Results */}
                {hasSearched && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        Search Results ({searchResults.length})
                      </h3>
                    </div>

                    {searchResults.length === 0 ? (
                      <Card className="p-8 text-center">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No documents found matching your query</p>
                        <p className="text-sm text-muted-foreground mt-1">Try different keywords or phrases</p>
                      </Card>
                    ) : (
                      searchResults.map(doc => renderDocumentCard(doc, true))
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Request Official Documents */}
              <TabsContent value="requests" className="space-y-4">
                {!isAuthenticated ? (
                  <Card className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">Please log in to request official documents</p>
                    <Button variant="outline" onClick={() => window.location.href = '/login'}>
                      Log In
                    </Button>
                  </Card>
                ) : (
                  <>
                    {/* Request Form */}
                    <Card className="p-5 sm:p-6">
                      <div className="flex items-start gap-3 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                          <Send className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">Request Official Document</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Request transcripts, certificates, verification letters, and more from your university
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="doc-type" className="text-base font-medium">Document Type</Label>
                          <Select 
                            value={requestDocType} 
                            onValueChange={(v) => setRequestDocType(v as RequestableDocumentType)}
                          >
                            <SelectTrigger className="mt-2 h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transcript">Official Transcript</SelectItem>
                              <SelectItem value="certificate">Certificate</SelectItem>
                              <SelectItem value="degree">Degree Certificate</SelectItem>
                              <SelectItem value="enrollment_verification">Enrollment Verification</SelectItem>
                              <SelectItem value="letter">Letter</SelectItem>
                              <SelectItem value="recommendation">Recommendation Letter</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="request-reason" className="text-base font-medium">Reason for Request</Label>
                          <Textarea
                            id="request-reason"
                            placeholder="E.g., I need my official transcript for a job application at Company X..."
                            value={requestReason}
                            onChange={(e) => setRequestReason(e.target.value)}
                            rows={4}
                            className="mt-2 text-base resize-none"
                          />
                        </div>

                        <Button 
                          onClick={handleSubmitRequest} 
                          className="w-full h-11 text-base font-medium"
                          disabled={isSubmittingRequest || !requestReason.trim()}
                        >
                          {isSubmittingRequest ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              <span>Submit Request</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>

                    {/* My Requests */}
                    <Card className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <History className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground">My Requests</h3>
                            <p className="text-sm text-muted-foreground">Track the status of your document requests</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={requestStatusFilter} 
                            onValueChange={(v) => {
                              setRequestStatusFilter(v as DocumentRequestStatus | 'all');
                              setRequestsPage(1);
                            }}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={fetchDocumentRequests}
                            disabled={isLoadingRequests}
                          >
                            <RefreshCw className={`w-4 h-4 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      {/* Loading State */}
                      {isLoadingRequests && (
                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-muted-foreground">Loading your requests...</p>
                        </div>
                      )}

                      {/* Error State */}
                      {!isLoadingRequests && requestsError && (
                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                          <AlertCircle className="w-8 h-8 text-destructive" />
                          <p className="text-destructive font-medium">{requestsError}</p>
                          <Button variant="outline" onClick={fetchDocumentRequests}>
                            Try Again
                          </Button>
                        </div>
                      )}

                      {/* Empty State */}
                      {!isLoadingRequests && !requestsError && documentRequests.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-3 py-8">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No document requests yet</p>
                          <p className="text-sm text-muted-foreground">Use the form above to request official documents</p>
                        </div>
                      )}

                      {/* Requests List */}
                      {!isLoadingRequests && !requestsError && documentRequests.length > 0 && (
                        <div className="space-y-3">
                          {documentRequests.map(request => (
                            <div 
                              key={request.id} 
                              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-foreground">
                                      {getDocumentTypeLabel(request.document_type)}
                                    </h4>
                                    {getRequestStatusBadge(request.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {request.reason}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                                    {request.processed_at && (
                                      <span>Processed: {new Date(request.processed_at).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                  {request.admin_notes && (
                                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                                      <span className="font-medium">Admin Notes: </span>
                                      {request.admin_notes}
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setViewingRequest(request)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
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
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update the title and description of your document.
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

      {/* View Request Details Dialog */}
      <Dialog open={viewingRequest !== null} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Request Details</DialogTitle>
            <DialogDescription>
              View the details of your document request
            </DialogDescription>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">Status</Label>
                {getRequestStatusBadge(viewingRequest.status)}
              </div>
              <div>
                <Label className="text-muted-foreground">Document Type</Label>
                <p className="font-medium mt-1">{getDocumentTypeLabel(viewingRequest.document_type)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="font-medium mt-1">{viewingRequest.reason}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">University</Label>
                <p className="font-medium mt-1">{viewingRequest.university_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium mt-1 text-sm">
                    {new Date(viewingRequest.created_at).toLocaleString()}
                  </p>
                </div>
                {viewingRequest.processed_at && (
                  <div>
                    <Label className="text-muted-foreground">Processed</Label>
                    <p className="font-medium mt-1 text-sm">
                      {new Date(viewingRequest.processed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {viewingRequest.processed_by_name && (
                <div>
                  <Label className="text-muted-foreground">Processed By</Label>
                  <p className="font-medium mt-1">{viewingRequest.processed_by_name}</p>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
