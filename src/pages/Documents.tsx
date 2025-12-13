import { useState, useEffect } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { apiClient } from "@/lib/api";
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Sparkles, Clock, CheckCircle2, XCircle, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentRequest {
  id: string;
  document_type: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "in_progress" | "completed";
  requested_at: string;
  estimated_completion?: string;
}

interface GeneratedDocument {
  id: string;
  type: string;
  title: string;
  date: string;
}

const Documents = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState("");
  const [reason, setReason] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AI Document Generation States
  const [resumePrompt, setResumePrompt] = useState("");
  const [coverLetterJob, setCoverLetterJob] = useState("");
  const [coverLetterCompany, setCoverLetterCompany] = useState("");
  
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDocumentRequests();
      // Cast status to proper type
      setRequests(response.requests.map(req => ({
        ...req,
        status: req.status as DocumentRequest['status']
      })));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch document requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([
    {
      id: "1",
      type: "Resume",
      title: "Software Engineer Resume",
      date: "2024-03-12",
    },
  ]);

  const handleDocumentRequest = async () => {
    if (!documentType || !reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Map frontend document types to backend format
    const documentTypeMap: Record<string, string> = {
      'transcript': 'Official Transcript',
      'recommendation': 'Recommendation Letter',
      'certificate': 'Degree Verification',
      'enrollment': 'Enrollment Verification',
      'other': 'Certificate of Completion'
    };

    try {
      const backendType = documentTypeMap[documentType] || documentType;
      console.log('Creating document request:', { document_type: backendType, reason });
      const newRequest = await apiClient.createDocumentRequest({
        document_type: backendType,
        reason: reason,
      });
      console.log('Document request created:', newRequest);

      // Refresh the list to show the new request
      await fetchRequests();
      setDocumentType("");
      setReason("");

      toast({
        title: "Request Submitted",
        description: "Your document request has been submitted successfully",
      });
    } catch (error: any) {
      console.error('Error creating document request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit document request",
        variant: "destructive",
      });
    }
  };

  const handleGenerateResume = async () => {
    if (!resumePrompt) {
      toast({
        title: "Missing Information",
        description: "Please provide details for your resume",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const newDoc: GeneratedDocument = {
        id: Date.now().toString(),
        type: "Resume",
        title: `AI Generated Resume - ${resumePrompt.slice(0, 30)}...`,
        date: new Date().toISOString().split("T")[0],
      };

      setGeneratedDocs([newDoc, ...generatedDocs]);
      setResumePrompt("");
      setIsGenerating(false);

      toast({
        title: "Resume Generated",
        description: "Your AI-powered resume is ready for download",
      });
    }, 2000);
  };

  const handleGenerateCoverLetter = async () => {
    if (!coverLetterJob || !coverLetterCompany) {
      toast({
        title: "Missing Information",
        description: "Please provide job title and company name",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const newDoc: GeneratedDocument = {
        id: Date.now().toString(),
        type: "Cover Letter",
        title: `Cover Letter - ${coverLetterJob} at ${coverLetterCompany}`,
        date: new Date().toISOString().split("T")[0],
      };

      setGeneratedDocs([newDoc, ...generatedDocs]);
      setCoverLetterJob("");
      setCoverLetterCompany("");
      setIsGenerating(false);

      toast({
        title: "Cover Letter Generated",
        description: "Your AI-powered cover letter is ready for download",
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
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
                <p className="text-xs sm:text-sm text-muted-foreground">Request university documents or create AI-powered career documents</p>
              </div>
            </div>

            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 h-11">
                <TabsTrigger value="request" className="text-sm">
                  <span className="hidden xs:inline">Request</span>
                  <span className="inline xs:hidden">Req</span>
                </TabsTrigger>
                <TabsTrigger value="generate" className="text-sm">
                  <span className="hidden sm:inline">AI Generate</span>
                  <span className="hidden xs:inline sm:hidden">AI Gen</span>
                  <span className="inline xs:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
              </TabsList>

              {/* Request University Documents */}
              <TabsContent value="request" className="space-y-4">
                <Card className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">Request University Documents</h3>
                      <p className="text-sm text-muted-foreground mt-1">Official transcripts, letters, and certificates</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="document-type" className="text-base font-medium">Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger id="document-type" className="h-11 mt-2">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transcript">Official Transcript</SelectItem>
                          <SelectItem value="recommendation">Recommendation Letter</SelectItem>
                          <SelectItem value="certificate">Degree Verification</SelectItem>
                          <SelectItem value="enrollment">Enrollment Verification</SelectItem>
                          <SelectItem value="other">Certificate of Completion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="reason" className="text-base font-medium">Reason for Request</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please explain why you need this document..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        className="mt-2 text-base resize-none"
                      />
                    </div>

                    <Button onClick={handleDocumentRequest} className="w-full h-11 text-base font-medium">
                      Submit Request
                    </Button>
                  </div>
                </Card>

                {/* Recent Requests */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Recent Requests</h3>
                  {loading ? (
                    <Card className="p-8 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                      <p className="text-muted-foreground">Loading requests...</p>
                    </Card>
                  ) : requests.length === 0 ? (
                    <Card className="p-8 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No document requests yet</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((request) => (
                        <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="mt-0.5 flex-shrink-0">{getStatusIcon(request.status)}</div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-base text-foreground truncate">{request.document_type}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{request.reason || 'No reason provided'}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(request.requested_at).toLocaleDateString()}
                                  {request.estimated_completion && ` • Est. completion: ${new Date(request.estimated_completion).toLocaleDateString()}`}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 font-medium ${
                              request.status === "approved" || request.status === "completed" ? "bg-green-500/10 text-green-500" :
                              request.status === "rejected" ? "bg-red-500/10 text-red-500" :
                              request.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                              "bg-yellow-500/10 text-yellow-500"
                            }`}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* AI Document Generation */}
              <TabsContent value="generate" className="space-y-4">
                {/* Resume Generator */}
                <Card className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">AI Resume Generator</h3>
                      <p className="text-sm text-muted-foreground mt-1">Create professional resumes with AI assistance</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resume-prompt" className="text-base font-medium">Tell us about yourself</Label>
                      <Textarea
                        id="resume-prompt"
                        placeholder="E.g., Software engineer with 3 years experience in React and Node.js, looking for senior positions..."
                        value={resumePrompt}
                        onChange={(e) => setResumePrompt(e.target.value)}
                        rows={4}
                        className="mt-2 text-base resize-none"
                      />
                    </div>

                    <Button 
                      onClick={handleGenerateResume} 
                      className="w-full h-11 text-base font-medium"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          <span>Generate Resume</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Cover Letter Generator */}
                <Card className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">AI Cover Letter Generator</h3>
                      <p className="text-sm text-muted-foreground mt-1">Tailored cover letters for specific positions</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="job-title" className="text-base font-medium">Job Title</Label>
                      <Input
                        id="job-title"
                        placeholder="e.g., Senior Software Engineer"
                        value={coverLetterJob}
                        onChange={(e) => setCoverLetterJob(e.target.value)}
                        className="h-11 mt-2 text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company-name" className="text-base font-medium">Company Name</Label>
                      <Input
                        id="company-name"
                        placeholder="e.g., Google"
                        value={coverLetterCompany}
                        onChange={(e) => setCoverLetterCompany(e.target.value)}
                        className="h-11 mt-2 text-base"
                      />
                    </div>

                    <Button 
                      onClick={handleGenerateCoverLetter} 
                      className="w-full h-11 text-base font-medium"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          <span>Generate Cover Letter</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Document History */}
              <TabsContent value="history" className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">Generated Documents</h3>
                {generatedDocs.map((doc) => (
                  <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-base text-foreground truncate">{doc.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{doc.type} • {doc.date}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="default" className="flex-shrink-0 h-10 px-4 gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documents;
