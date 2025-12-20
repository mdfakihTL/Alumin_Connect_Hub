import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Heart, MessageCircle, Users, Calendar, Briefcase, Megaphone, Trash2, Check, X, Menu, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '@/contexts/ConnectionsContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient, NotificationResponse } from '@/lib/api';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'connection' | 'event' | 'job' | 'announcement';
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { receivedRequests, acceptRequest, rejectRequest } = useConnections();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const response = await apiClient.getNotifications({ page_size: 50 });
      const formattedNotifications: Notification[] = response.notifications.map((n: NotificationResponse) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: n.time,
        read: n.read,
        avatar: n.avatar,
      }));
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Convert connection requests to notifications
  const connectionNotifications: Notification[] = receivedRequests.map(req => ({
    id: `conn_${req.id}`,
    type: 'connection',
    title: 'New connection request',
    message: `${req.from.name} wants to connect with you`,
    time: new Date(req.date).toLocaleDateString(),
    read: false,
    avatar: req.from.avatar,
  }));

  const allNotifications = [...connectionNotifications, ...notifications];
  const unreadNotifications = allNotifications.filter(n => !n.read);
  const displayedNotifications = filter === 'unread' ? unreadNotifications : allNotifications;

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      like: { icon: Heart, color: 'text-red-500 bg-red-500/10' },
      comment: { icon: MessageCircle, color: 'text-blue-500 bg-blue-500/10' },
      connection: { icon: Users, color: 'text-green-500 bg-green-500/10' },
      event: { icon: Calendar, color: 'text-purple-500 bg-purple-500/10' },
      job: { icon: Briefcase, color: 'text-orange-500 bg-orange-500/10' },
      announcement: { icon: Megaphone, color: 'text-primary bg-primary/10' },
    };
    return iconMap[type as keyof typeof iconMap] || { icon: Bell, color: 'text-gray-500 bg-gray-500/10' };
  };

  const markAsRead = async (id: string) => {
    if (id.startsWith('conn_')) return; // Connection requests handled separately
    
    try {
      await apiClient.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({
        title: 'All notifications marked as read',
      });
    } catch (error) {
      toast({
        title: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id: string) => {
    if (id.startsWith('conn_')) return; // Connection requests handled separately
    
    try {
      await apiClient.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({
        title: 'Notification deleted',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const clearAllRead = async () => {
    try {
      // Delete read notifications one by one (or implement bulk delete on backend)
      const readNotifications = notifications.filter(n => n.read);
      for (const notif of readNotifications) {
        await apiClient.deleteNotification(notif.id);
      }
      setNotifications(prev => prev.filter(n => !n.read));
      toast({
        title: 'Read notifications cleared',
      });
    } catch (error) {
      toast({
        title: 'Failed to clear notifications',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on type
    if (notification.type === 'event') {
      navigate('/events');
    } else if (notification.type === 'job') {
      navigate('/dashboard');
    } else if (notification.type === 'connection') {
      navigate('/groups');
    } else {
      navigate('/dashboard');
    }
  };

  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopNav />
        <MobileNav />
        <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading notifications...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">Notifications</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Stay updated with your network activity
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all" className="flex-1 sm:flex-none">
                    All ({allNotifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1 sm:flex-none">
                    Unread ({unreadNotifications.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-2 w-full sm:w-auto">
                {unreadNotifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="flex-1 sm:flex-none"
                  >
                    Mark all read
                  </Button>
                )}
                {notifications.some(n => n.read) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllRead}
                    className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                  >
                    Clear read
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            {displayedNotifications.length === 0 ? (
              <Card className="p-10 text-center border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                        <Bell className="w-7 h-7 text-green-500/60" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {filter === 'unread' ? "You're All Caught Up!" : 'No Notifications'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {filter === 'unread' 
                      ? "Great job! You've read all your notifications. New activity will appear here."
                      : "You don't have any notifications yet. Engage with the community to start seeing updates!"}
                  </p>
                  {filter === 'unread' && (
                    <Button variant="outline" className="mt-4" onClick={() => setFilter('all')}>
                      View All Notifications
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {displayedNotifications.map((notification) => {
                  const { icon: Icon, color } = getNotificationIcon(notification.type);
                  const isConnectionRequest = notification.id.startsWith('conn_');
                  const requestId = isConnectionRequest ? notification.id.replace('conn_', '') : null;
                  
                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 hover:shadow-md transition-all group ${
                        !notification.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      } ${!isConnectionRequest ? 'cursor-pointer' : ''}`}
                      onClick={() => !isConnectionRequest && handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        {notification.avatar ? (
                          <img
                            src={notification.avatar}
                            alt=""
                            className="w-12 h-12 rounded-full flex-shrink-0 ring-2 ring-primary/10"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm sm:text-base leading-tight">
                              {notification.title}
                            </h4>
                            {!isConnectionRequest && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs text-muted-foreground">{notification.time}</p>
                            {!notification.read && !isConnectionRequest && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>

                          {/* Connection Request Actions */}
                          {isConnectionRequest && requestId && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptRequest(requestId);
                                  toast({
                                    title: 'Connection accepted!',
                                    description: 'You are now connected',
                                  });
                                }}
                                className="h-9 gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectRequest(requestId);
                                  toast({
                                    title: 'Request declined',
                                    description: 'Connection request has been rejected',
                                  });
                                }}
                                className="h-9 gap-2 text-destructive hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
