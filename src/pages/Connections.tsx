import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import WorldMapHeatmap from '@/components/WorldMapHeatmap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, MessageCircle, UserMinus, Check, X, Menu, RefreshCw } from 'lucide-react';
import { useConnections, Connection } from '@/contexts/ConnectionsContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

const Connections = () => {
  const { user } = useAuth();
  const { connections, receivedRequests, sentRequests, isLoading, error, acceptRequest, rejectRequest, removeConnection, refreshConnections } = useConnections();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAcceptRequest = async (requestId: string, name: string) => {
    setActionLoading(requestId);
    try {
      await acceptRequest(requestId);
      toast({
        title: 'Connection accepted!',
        description: `You are now connected with ${name}`,
      });
    } catch (err) {
      // Error handled in context
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await rejectRequest(requestId);
      toast({
        title: 'Request rejected',
        description: 'Connection request has been declined',
      });
    } catch (err) {
      // Error handled in context
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveConnection = async (connectionId: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to remove ${name} from your connections?`);
    if (confirmed) {
      setActionLoading(connectionId);
      try {
        await removeConnection(connectionId);
        toast({
          title: 'Connection removed',
          description: `${name} has been removed from your connections`,
        });
      } catch (err) {
        // Error handled in context
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleMessage = (connection: Connection) => {
    navigate('/chat', { 
      state: { 
        selectedUser: {
          name: connection.name,
          avatar: connection.avatar,
          university: connection.university,
          year: connection.year,
        }
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <MobileNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="max-w-6xl mx-auto">
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
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">Connections</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your professional network
                </p>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={refreshConnections}
                disabled={isLoading}
                className="h-9 w-9"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && connections.length === 0 && (
              <LoadingState message="Loading connections..." />
            )}

            {/* Error State */}
            {error && !isLoading && (
              <ErrorState 
                message={error} 
                onRetry={refreshConnections}
              />
            )}

            {/* Main Content */}
            {!isLoading && !error && (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full sm:w-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">
                    My Connections ({connections.length})
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="flex-1 sm:flex-none text-xs sm:text-sm">
                    Requests ({receivedRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex-1 sm:flex-none text-xs sm:text-sm">
                    Sent ({sentRequests.filter(r => r.status === 'pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="map" className="flex-1 sm:flex-none text-xs sm:text-sm">
                    Global Map
                  </TabsTrigger>
                </TabsList>

                {/* All Connections */}
                <TabsContent value="all" className="space-y-4">
                  {/* Search */}
                  <Card className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                      <Input 
                        placeholder="Search connections..." 
                        className="pl-10 h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </Card>

                  {/* Connections List */}
                  {filteredConnections.length === 0 ? (
                    <EmptyState 
                      icon={Users}
                      title="No connections found"
                      description={searchQuery ? "Try adjusting your search" : "Start connecting with alumni!"}
                    />
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredConnections.map((connection) => {
                        const isActionPending = actionLoading === connection.id;
                        
                        return (
                          <Card key={connection.id} className="p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-3 mb-4">
                              <img
                                src={connection.avatar}
                                alt={connection.name}
                                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/10"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate">{connection.name}</h3>
                                <p className="text-xs text-muted-foreground truncate">{connection.jobTitle}</p>
                                <p className="text-xs text-muted-foreground truncate">{connection.company}</p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{connection.university} '{connection.year}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 gap-2"
                                onClick={() => handleMessage(connection)}
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveConnection(connection.id, connection.name)}
                                className="text-destructive hover:text-destructive"
                                disabled={isActionPending}
                              >
                                {isActionPending ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <UserMinus className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Received Requests */}
                <TabsContent value="requests" className="space-y-4">
                  {receivedRequests.length === 0 ? (
                    <EmptyState 
                      icon={Users}
                      title="No pending requests"
                      description="You don't have any connection requests"
                    />
                  ) : (
                    <div className="space-y-3">
                      {receivedRequests.map((request) => {
                        const isActionPending = actionLoading === request.id;
                        
                        return (
                          <Card key={request.id} className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex gap-3 flex-1 min-w-0">
                                <img
                                  src={request.from.avatar}
                                  alt={request.from.name}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base truncate">{request.from.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {request.from.university} '{request.from.year}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(request.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptRequest(request.id, request.from.name)}
                                  className="gap-1"
                                  disabled={isActionPending}
                                >
                                  {isActionPending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  Accept
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="text-destructive hover:text-destructive"
                                  disabled={isActionPending}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Sent Requests */}
                <TabsContent value="sent" className="space-y-4">
                  {sentRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <EmptyState 
                      icon={Users}
                      title="No pending requests"
                      description="You haven't sent any connection requests"
                    />
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.filter(r => r.status === 'pending').map((request) => (
                        <Card key={request.id} className="p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate">Request to {request.to}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Sent {new Date(request.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Global Alumni Distribution Map */}
                <TabsContent value="map" className="space-y-4">
                  {user?.universityId ? (
                    <WorldMapHeatmap 
                      universityId={user.universityId}
                      title="Global Alumni Distribution"
                      height="500px"
                    />
                  ) : (
                    <EmptyState 
                      icon={Users}
                      title="University information required"
                      description="Please complete your profile to view the alumni distribution map"
                    />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Connections;
