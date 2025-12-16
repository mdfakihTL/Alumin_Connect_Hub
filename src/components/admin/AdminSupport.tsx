import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, AdminTicketResponse, AdminTicketDetailResponse, TicketResponseItem } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Send,
  User,
  Calendar,
  Tag,
  AlertTriangle,
  RefreshCw,
  Mail,
  Hash,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Transform API response to component format
interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetail extends SupportTicket {
  responses: TicketResponseItem[];
}

const transformTicket = (apiTicket: AdminTicketResponse): SupportTicket => ({
  id: apiTicket.id,
  userId: apiTicket.user_id,
  userName: apiTicket.user_name,
  userEmail: apiTicket.user_email,
  subject: apiTicket.subject,
  category: apiTicket.category,
  priority: apiTicket.priority,
  status: apiTicket.status,
  description: apiTicket.description,
  responseCount: apiTicket.response_count,
  createdAt: apiTicket.created_at,
  updatedAt: apiTicket.updated_at,
});

const transformTicketDetail = (apiTicket: AdminTicketDetailResponse): TicketDetail => ({
  id: apiTicket.id,
  userId: apiTicket.user_id,
  userName: apiTicket.user_name,
  userEmail: apiTicket.user_email,
  subject: apiTicket.subject,
  category: apiTicket.category,
  priority: apiTicket.priority,
  status: apiTicket.status,
  description: apiTicket.description,
  responseCount: apiTicket.responses.length,
  createdAt: apiTicket.created_at,
  updatedAt: apiTicket.updated_at,
  responses: apiTicket.responses,
});

export default function AdminSupport() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tickets from admin API
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await adminApi.getTickets({ page_size: 100 });
      setTickets(response.tickets.map(transformTicket));
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const universityTickets = tickets;

  const filteredTickets = universityTickets.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      ticket.status === activeTab ||
      (activeTab === 'in-progress' && ticket.status === 'inprogress');

    return matchesSearch && matchesTab;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'in-progress':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      default:
        return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'low':
        return 'bg-green-500/10 text-green-500';
      default:
        return '';
    }
  };

  const handleTicketClick = async (ticket: SupportTicket) => {
    setIsLoadingDetail(true);
    setResponseMessage('');
    
    try {
      const detail = await adminApi.getTicketDetail(ticket.id);
      const ticketDetail = transformTicketDetail(detail);
      setSelectedTicket(ticketDetail);
      setStatusUpdate(ticketDetail.status);
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;

    setIsSubmitting(true);
    try {
      await adminApi.updateTicketStatus(selectedTicket.id, statusUpdate);
      
      // Update selected ticket and local list
      setSelectedTicket(prev => prev ? { ...prev, status: statusUpdate, updatedAt: new Date().toISOString() } : null);
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id ? { ...t, status: statusUpdate, updatedAt: new Date().toISOString() } : t
      ));

      toast({
        title: 'Ticket Updated',
        description: 'The ticket status has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.respondToTicket(selectedTicket.id, responseMessage);
      
      // Refresh ticket details to show new response
      const detail = await adminApi.getTicketDetail(selectedTicket.id);
      const ticketDetail = transformTicketDetail(detail);
      setSelectedTicket(ticketDetail);
      
      // Update local tickets list
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, responseCount: ticketDetail.responseCount, status: ticketDetail.status, updatedAt: ticketDetail.updatedAt } 
          : t
      ));

      toast({
        title: 'Response Sent',
        description: 'Your response has been sent to the user.',
      });

      setResponseMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send response',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: universityTickets.length,
    open: universityTickets.filter(t => t.status === 'open').length,
    inProgress: universityTickets.filter(t => t.status === 'in-progress' || t.status === 'inprogress').length,
    resolved: universityTickets.filter(t => t.status === 'resolved').length,
    closed: universityTickets.filter(t => t.status === 'closed').length,
    highPriority: universityTickets.filter(t => t.priority === 'high' && t.status !== 'resolved' && t.status !== 'closed').length,
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                <div className="h-8 bg-muted rounded w-12"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="p-3 sm:p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchTickets} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              Total
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
              Open
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-blue-500">{stats.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              In Progress
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-yellow-500">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              Resolved
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-green-500">{stats.resolved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              Closed
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-gray-500">{stats.closed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-500/20">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              High Priority
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl text-red-500">{stats.highPriority}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-9 text-sm sm:text-base h-9 sm:h-10"
          />
        </div>
      </div>

      {/* Tickets Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm flex-1 min-w-[80px]">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="open" className="text-xs sm:text-sm flex-1 min-w-[80px]">Open ({stats.open})</TabsTrigger>
          <TabsTrigger value="in-progress" className="text-xs sm:text-sm flex-1 min-w-[80px]">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm flex-1 min-w-[80px]">Resolved ({stats.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 sm:mt-6">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">No Tickets Found</h3>
                <p className="text-sm sm:text-base text-muted-foreground text-center">
                  {searchQuery
                    ? 'No tickets match your search criteria.'
                    : 'No support tickets in this category.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTicketClick(ticket)}
                >
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                          <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                          </Badge>
                          <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                            <span className="capitalize">{ticket.priority} Priority</span>
                          </Badge>
                          <Badge variant="outline" className="capitalize text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {ticket.category}
                          </Badge>
                        </div>
                        <CardTitle className="mb-2 text-base sm:text-lg md:text-xl break-words">{ticket.subject}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ticket.userName}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="w-full sm:w-auto truncate">{ticket.userEmail}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span className="hidden md:inline">•</span>
                          <span className="hidden md:inline">
                            Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                          </span>
                          {ticket.responseCount > 0 && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span>{ticket.responseCount} response{ticket.responseCount !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket || isLoadingDetail} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {isLoadingDetail && (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading ticket details...</p>
            </div>
          )}
          {selectedTicket && !isLoadingDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1 capitalize">{selectedTicket.status.replace('-', ' ')}</span>
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    <span className="capitalize">{selectedTicket.priority} Priority</span>
                  </Badge>
                  <Badge variant="outline">Ticket #{selectedTicket.id.slice(-6)}</Badge>
                </div>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  <span>{selectedTicket.userName}</span>
                  <span>•</span>
                  <span>{selectedTicket.userEmail}</span>
                  <span>•</span>
                  <span>{format(new Date(selectedTicket.createdAt), 'MMM d, yyyy h:mm a')}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* User Info Card */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{selectedTicket.userName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedTicket.userEmail}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Ticket #{selectedTicket.id.slice(-6)}
                      </p>
                      <p>{format(new Date(selectedTicket.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Conversation Thread
                  </h4>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {/* Original ticket message */}
                      <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">{selectedTicket.userName}</span>
                          <Badge variant="outline" className="text-xs">Original Ticket</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(selectedTicket.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>

                      {/* Responses */}
                      {selectedTicket.responses && selectedTicket.responses.map((response) => (
                        <div
                          key={response.id}
                          className={`p-4 rounded-lg ${
                            response.is_admin
                              ? 'bg-primary/5 border-l-4 border-primary ml-4'
                              : 'bg-muted/50 border-l-4 border-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">{response.responder_name}</span>
                            <Badge 
                              variant={response.is_admin ? "default" : "outline"} 
                              className="text-xs"
                            >
                              {response.is_admin ? 'Admin' : 'Alumni'}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(response.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                        </div>
                      ))}

                      {selectedTicket.responses?.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No responses yet. Be the first to respond!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Send Response (only for open or in-progress tickets) */}
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in-progress' || selectedTicket.status === 'inprogress') && (
                  <div className="border-t pt-4">
                    <Label htmlFor="response">Reply to User</Label>
                    <div className="flex gap-2 mt-2">
                      <Textarea
                        id="response"
                        placeholder="Type your response here..."
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={3}
                        className="flex-1"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button onClick={handleSendResponse} className="mt-2" disabled={isSubmitting || !responseMessage.trim()}>
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Response
                    </Button>
                  </div>
                )}

                {/* Closed/Resolved notice */}
                {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      This ticket has been {selectedTicket.status}. Reopen by changing status to continue the conversation.
                    </p>
                  </div>
                )}

                {/* Update Status */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">Update Ticket Status</h4>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <Label htmlFor="status">Status</Label>
                      <Select value={statusUpdate} onValueChange={setStatusUpdate} disabled={isSubmitting}>
                        <SelectTrigger id="status" className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleUpdateStatus} disabled={isSubmitting || statusUpdate === selectedTicket.status}>
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
