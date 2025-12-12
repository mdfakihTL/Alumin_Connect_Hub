import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupport } from '@/contexts/SupportContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import SupportTicketModal from '@/components/SupportTicketModal';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Menu,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function Support() {
  const { user } = useAuth();
  const { tickets, isLoading, error, getTicketsByUser, addResponse, refreshTickets } = useSupport();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const userTickets = user ? getTicketsByUser(user.id) : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in-progress':
      case 'inprogress':
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
      case 'inprogress':
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

  const handleAddResponse = async (ticketId: string) => {
    const message = responseText[ticketId]?.trim();
    if (!message) {
      toast({
        title: 'Error',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await addResponse(ticketId, message);
      setResponseText({ ...responseText, [ticketId]: '' });
      toast({
        title: 'Response Added',
        description: 'Your response has been added to the ticket.',
      });
    } catch (err) {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        {/* Header with Sidebar Toggle */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-10 w-10 flex-shrink-0"
                    title="Toggle menu"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Support Center</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                      Get help from your university administration
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={refreshTickets}
                    disabled={isLoading}
                    className="h-9 w-9"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={() => setIsModalOpen(true)} size="sm" className="flex-shrink-0">
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Ticket</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Loading State */}
          {isLoading && tickets.length === 0 && (
            <LoadingState message="Loading support tickets..." />
          )}

          {/* Error State */}
          {error && !isLoading && (
            <ErrorState 
              message={error} 
              onRetry={refreshTickets}
            />
          )}

          {/* Main Content */}
          {!isLoading && !error && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardDescription className="text-xs sm:text-sm">Total Tickets</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl">{userTickets.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardDescription className="text-xs sm:text-sm">Open</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl text-blue-500">
                      {userTickets.filter(t => t.status === 'open').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardDescription className="text-xs sm:text-sm">In Progress</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl text-yellow-500">
                      {userTickets.filter(t => t.status === 'in-progress' || t.status === 'inprogress').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardDescription className="text-xs sm:text-sm">Resolved</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl text-green-500">
                      {userTickets.filter(t => t.status === 'resolved').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Tickets List */}
              <div className="space-y-3 sm:space-y-4">
                {userTickets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                      <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">No Support Tickets Yet</h3>
                      <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 sm:mb-6 max-w-md">
                        You haven't submitted any support tickets. If you need help or have questions, feel free to create a new ticket.
                      </p>
                      <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Ticket
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  userTickets.map((ticket) => (
                    <Card key={ticket.id} className="overflow-hidden">
                      <CardHeader className="p-3 sm:p-6">
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                              <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                                {getStatusIcon(ticket.status)}
                                <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                              </Badge>
                              <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                                <span className="capitalize">{ticket.priority}</span>
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                {ticket.category}
                              </Badge>
                            </div>
                            <CardTitle className="mb-2 text-base sm:text-lg md:text-xl break-words">{ticket.subject}</CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                              <span>Ticket #{ticket.id.slice(-6)}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="w-full sm:w-auto">
                                Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                              </span>
                              {ticket.responses && ticket.responses.length > 0 && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}</span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                            className="flex-shrink-0"
                          >
                            {expandedTicket === ticket.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>

                      {expandedTicket === ticket.id && (
                        <CardContent className="border-t pt-4 sm:pt-6 p-3 sm:p-6">
                          <div className="space-y-4 sm:space-y-6">
                            {/* Original Description */}
                            <div>
                              <h4 className="font-semibold mb-2 text-sm sm:text-base">Description</h4>
                              <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap break-words">
                                {ticket.description}
                              </p>
                            </div>

                            {/* Admin Notes */}
                            {ticket.adminNotes && (
                              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                                  <AlertCircle className="w-4 h-4" />
                                  Admin Notes
                                </h4>
                                <p className="text-xs sm:text-sm text-muted-foreground break-words">{ticket.adminNotes}</p>
                              </div>
                            )}

                            {/* Responses */}
                            {ticket.responses && ticket.responses.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Conversation</h4>
                                <div className="space-y-3 sm:space-y-4">
                                  {ticket.responses.map((response) => (
                                    <div
                                      key={response.id}
                                      className={`p-3 sm:p-4 rounded-lg ${
                                        response.userRole === 'admin'
                                          ? 'bg-primary/5 border-l-4 border-primary'
                                          : 'bg-muted/50'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="font-semibold text-xs sm:text-sm">{response.userName}</span>
                                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                                          {response.userRole === 'admin' ? 'Admin' : 'You'}
                                        </Badge>
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{response.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Add Response (only for open or in-progress tickets) */}
                            {(ticket.status === 'open' || ticket.status === 'in-progress' || ticket.status === 'inprogress') && (
                              <div className="pt-4 border-t">
                                <h4 className="font-semibold mb-3 text-sm sm:text-base">Add a Response</h4>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Textarea
                                    placeholder="Type your message here..."
                                    value={responseText[ticket.id] || ''}
                                    onChange={(e) =>
                                      setResponseText({ ...responseText, [ticket.id]: e.target.value })
                                    }
                                    rows={3}
                                    className="flex-1 text-sm"
                                    disabled={submitting}
                                  />
                                  <Button
                                    onClick={() => handleAddResponse(ticket.id)}
                                    className="sm:self-end w-full sm:w-auto"
                                    disabled={submitting}
                                  >
                                    {submitting ? (
                                      <RefreshCw className="w-4 h-4 animate-spin mr-2 sm:mr-0" />
                                    ) : (
                                      <Send className="w-4 h-4 mr-2 sm:mr-0" />
                                    )}
                                    <span className="sm:hidden">Send Response</span>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <MobileNav />
      <SupportTicketModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
