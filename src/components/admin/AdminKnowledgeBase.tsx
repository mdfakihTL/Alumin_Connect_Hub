import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Trash2, File, FileCode, FileType, Plus, Book, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'txt' | 'doc' | 'docx' | 'md';
  fileName: string;
  content: string; // For demo, we'll store text content
  fileSize: string;
  uploadDate: string;
  universityId: string;
}

const AdminKnowledgeBase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileType: 'txt' as const,
    fileName: '',
    content: '',
  });

  useEffect(() => {
    loadDocuments();
  }, [user?.universityId]);

  const loadDocuments = () => {
    const stored = localStorage.getItem(`knowledge_base_${user?.universityId}`);
    if (stored) {
      setDocuments(JSON.parse(stored));
    }
  };

  const handleUpload = () => {
    if (!formData.title || !formData.fileName || !formData.content) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newDoc: KnowledgeDocument = {
      id: `doc_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      fileType: formData.fileType,
      fileName: formData.fileName,
      content: formData.content,
      fileSize: `${Math.round(formData.content.length / 1024)}KB`,
      uploadDate: new Date().toISOString(),
      universityId: user?.universityId || '',
    };

    const updated = [...documents, newDoc];
    localStorage.setItem(`knowledge_base_${user?.universityId}`, JSON.stringify(updated));
    setDocuments(updated);

    toast({
      title: 'Document uploaded',
      description: 'Knowledge base document has been added to the chatbot',
    });

    resetForm();
  };

  const handleDelete = (docId: string) => {
    if (window.confirm('Are you sure you want to remove this document from the knowledge base?')) {
      const updated = documents.filter(d => d.id !== docId);
      localStorage.setItem(`knowledge_base_${user?.universityId}`, JSON.stringify(updated));
      setDocuments(updated);

      toast({
        title: 'Document removed',
        description: 'Document has been removed from the knowledge base',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      fileType: 'txt',
      fileName: '',
      content: '',
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, fileName: file.name }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFormData(prev => ({ ...prev, content }));
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Chatbot Knowledge Base</h2>
            <p className="text-sm text-muted-foreground">
              Upload documents to train your university's AI chatbot
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
          <Book className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Knowledge Base</p>
            <p className="text-blue-600 dark:text-blue-300 text-xs">
              Upload documents containing information about your university, programs, policies, and FAQs. 
              The AI chatbot will use these to provide accurate answers to alumni.
            </p>
          </div>
        </div>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload documents to enhance your chatbot's knowledge
            </p>
          </Card>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs uppercase">
                  {doc.fileType}
                </Badge>
              </div>

              {doc.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{doc.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{doc.fileSize}</span>
                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
              </div>

              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDelete(doc.id)}
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
              <Label htmlFor="fileType">File Type</Label>
              <select
                id="fileType"
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="txt">Text (.txt)</option>
                <option value="md">Markdown (.md)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="doc">Word (.doc)</option>
                <option value="docx">Word (.docx)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload File</Label>
              <Input
                id="file"
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, TXT, DOC, DOCX, MD
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Document Content *</Label>
              <Textarea
                id="content"
                placeholder="Paste or type document content here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                For demo purposes, paste text content. In production, file parsing would be automatic.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  The chatbot will use this content to answer alumni questions about {user?.university}.
                </p>
              </div>
            </div>

            <Button onClick={handleUpload} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload to Knowledge Base
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKnowledgeBase;

