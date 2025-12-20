import { useState, useEffect } from 'react';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const NotificationBell = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { receivedRequests, acceptRequest, rejectRequest } = useConnections();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getNotifications({ page_size: 10 });
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
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Keep existing notifications on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count periodically
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(async () => {
      try {
        const countResponse = await apiClient.getUnreadNotificationCount();
        setUnreadCount(countResponse.unread_count);
      } catch (error) {
        // Silently fail
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

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

  // Combine all notifications
  const allNotifications = [...connectionNotifications, ...notifications];
  const totalUnreadCount = unreadCount + connectionNotifications.length;

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read via API
    if (!notification.id.startsWith('conn_')) {
      try {
        await apiClient.markNotificationAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    // Navigate based on type
    if (notification.type === 'event') {
      navigate('/events');
    } else if (notification.type === 'job') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
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

  const getNotificationIcon = (type: string) => {
    const colors = {
      like: 'bg-red-500',
      comment: 'bg-blue-500',
      connection: 'bg-green-500',
      event: 'bg-purple-500',
      job: 'bg-orange-500',
      announcement: 'bg-primary',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-accent"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {totalUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[9px] sm:text-[10px] font-bold"
            >
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-base">Notifications</h3>
          {totalUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px] sm:h-[500px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allNotifications.map((notification) => {
                const isConnectionRequest = notification.id.startsWith('conn_');
                const requestId = isConnectionRequest ? notification.id.replace('conn_', '') : null;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 ${!notification.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      {notification.avatar ? (
                        <img
                          src={notification.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationIcon(
                            notification.type
                          )}`}
                        >
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-tight">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          {notification.time}
                        </p>
                        
                        {isConnectionRequest && requestId && (
                          <div className="flex gap-2 mt-2">
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
                              className="h-8 text-xs gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Accept
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                rejectRequest(requestId);
                              }}
                              className="h-8 text-xs text-destructive hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                              Decline
                            </Button>
                          </div>
                        )}
                        
                        {!isConnectionRequest && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full font-medium"
            onClick={() => {
              navigate('/notifications');
              setIsOpen(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
