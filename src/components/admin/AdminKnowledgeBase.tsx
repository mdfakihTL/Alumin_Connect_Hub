import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Trash2, File, FileCode, FileType, Plus, Book, AlertCircle, RefreshCw, Loader2, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  s3_url: string;
  file_type: string;
  file_size: number;
  is_active: boolean;
  created_at: string | null;
}

const AdminKnowledgeBase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileName: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadDocuments();
  }, [user?.universityId]);

  const loadDocuments = async () => {
    if (!user?.universityId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/knowledge-base/s3-documents?university_id=${user.universityId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        console.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!formData.title || !formData.file) {
      toast({
        title: 'Missing information',
        description: 'Please fill in title and select a file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('university_id', user?.universityId || 'mit');

      const response = await fetch(`${API_BASE_URL}/admin/knowledge-base/upload-s3`, {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Document uploaded',
          description: 'Knowledge base document has been uploaded to S3 and added to the chatbot',
        });
        loadDocuments();
        resetForm();
      } else {
        throw new Error(result.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove "${docTitle}" from the knowledge base?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/knowledge-base/s3-documents/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Document removed',
          description: 'Document has been removed from the knowledge base',
        });
        loadDocuments();
      } else {
        const result = await response.json();
        throw new Error(result.detail || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleReload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/knowledge-base/reload`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Knowledge base reloaded',
          description: result.message,
        });
        loadDocuments();
      }
    } catch (error) {
      toast({
        title: 'Reload failed',
        description: 'Failed to reload knowledge base',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      fileName: '',
      file: null,
    });
    setIsModalOpen(false);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <File className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx': return <FileType className="w-5 h-5 text-blue-500" />;
      case 'md': return <FileCode className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, fileName: file.name, file }));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Chatbot Knowledge Base</h2>
            <p className="text-sm text-muted-foreground">
              Upload documents to train your university's AI chatbot (stored in S3)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReload} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
          <Cloud className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">S3 Cloud Storage</p>
            <p className="text-blue-600 dark:text-blue-300 text-xs">
              Documents are stored in AWS S3 and served via CloudFront CDN. 
              The AI chatbot uses these to provide accurate answers to alumni.
            </p>
          </div>
        </div>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && documents.length === 0 ? (
          <Card className="p-10 text-center col-span-full">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading documents...</p>
          </Card>
        ) : documents.length === 0 ? (
          <Card className="p-10 text-center col-span-full border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Book className="w-7 h-7 text-primary/60" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-5">
                Upload documents to enhance your chatbot's knowledge and provide better assistance to alumni.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload First Document
              </Button>
            </div>
          </Card>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{doc.filename}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs uppercase">
                  {doc.file_type}
                </Badge>
              </div>

              {doc.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{doc.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{formatFileSize(doc.file_size)}</span>
                <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-3">
                <Cloud className="w-3 h-3" />
                <span>Stored in S3</span>
              </div>

              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDelete(doc.id, doc.title)}
                className="w-full text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Remove
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Knowledge Base Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                placeholder="e.g., University Policies, Program Requirements"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this document contains..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload File *</Label>
              <Input
                id="file"
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: TXT, MD (PDF/DOC coming soon). Max size: 50MB
              </p>
            </div>

            {formData.file && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-xs text-muted-foreground">{formData.fileName} ({formatFileSize(formData.file.size)})</p>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  The file will be uploaded to S3 and the chatbot will use it to answer alumni questions about {user?.university || 'your university'}.
                </p>
              </div>
            </div>

            <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to Knowledge Base
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKnowledgeBase;
