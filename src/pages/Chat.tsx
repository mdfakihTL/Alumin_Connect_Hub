import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Send, Users, Menu } from 'lucide-react';
import { useGroups } from '@/contexts/GroupsContext';
import { useConnections } from '@/contexts/ConnectionsContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
}

const Chat = () => {
  const { user } = useAuth();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { joinedGroups } = useGroups();
  const { connections } = useConnections();
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'personal' | 'groups'>('all');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // Convert connections to chat items
  const connectionChats: ChatItem[] = useMemo(() => 
    connections.map(conn => ({
      id: `c${conn.id}`,
      name: conn.name,
      avatar: conn.avatar,
      lastMessage: 'Start a conversation',
      time: '',
      unread: 0,
      isGroup: false,
    })),
    [connections]
  );

  // Convert joined groups to chat items
  const groupChats: ChatItem[] = useMemo(() => 
    joinedGroups.map(group => ({
      id: `g${group.id}`,
      name: group.name,
      avatar: group.avatar || 'https://api.dicebear.com/7.x/shapes/svg?seed=group',
      lastMessage: group.lastMessage || 'No messages yet',
      time: group.lastMessageTime || '',
      unread: group.unreadCount || 0,
      isGroup: true,
    })),
    [joinedGroups]
  );

  // Combine all chats
  const allChats = useMemo(() => {
    const combined = [...groupChats, ...connectionChats];
    return combined.sort((a, b) => {
      // Sort by unread first, then alphabetically
      if (a.unread !== b.unread) return b.unread - a.unread;
      return a.name.localeCompare(b.name);
    });
  }, [groupChats, connectionChats]);

  // Filter chats
  const filteredChats = useMemo(() => {
    let chats = allChats;
    
    // Apply type filter
    if (filter === 'personal') {
      chats = chats.filter(c => !c.isGroup);
    } else if (filter === 'groups') {
      chats = chats.filter(c => c.isGroup);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      chats = chats.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return chats;
  }, [allChats, filter, searchQuery]);

  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);

  // Handle navigation from connections page
  useEffect(() => {
    const selectedUser = location.state?.selectedUser;
    if (selectedUser) {
      const chatItem = connectionChats.find(c => c.name === selectedUser.name);
      if (chatItem) {
        setSelectedChat(chatItem);
        setFilter('personal');
      }
    } else if (!selectedChat && filteredChats.length > 0) {
      setSelectedChat(filteredChats[0]);
    }
  }, [location.state, connectionChats]);

  // Initialize some sample messages
  useEffect(() => {
    if (selectedChat && !messages[selectedChat.id]) {
      setMessages(prev => ({
        ...prev,
        [selectedChat.id]: [
          {
            id: '1',
            content: selectedChat.lastMessage,
            sender: selectedChat.name,
            timestamp: selectedChat.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: false,
          },
        ],
      }));
    }
  }, [selectedChat]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: user?.name || 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages(prev => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
    }));

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Detect and linkify URLs and emails
  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    
    let result = text;
    
    // Replace URLs
    result = result.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${url}</a>`;
    });
    
    // Replace emails
    result = result.replace(emailRegex, (email) => {
      return `<a href="mailto:${email}" class="text-primary underline hover:text-primary/80">${email}</a>`;
    });
    
    return result;
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      <DesktopNav />
      <MobileNav />
      
      <main className={`h-screen pb-20 md:pb-0 transition-all duration-300 flex ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="flex-1 flex">
          {/* Chat List */}
          <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-9 w-9 flex-shrink-0"
                  title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold flex-1">Messages</h1>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-10 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Tabs */}
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    All ({allChats.length})
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="text-xs sm:text-sm">
                    Connections ({connectionChats.length})
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="text-xs sm:text-sm">
                    Groups ({groupChats.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No chats found</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-3 sm:p-4 flex gap-3 hover:bg-accent transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                      {chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                          <Users className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{chat.name}</h3>
                          {chat.isGroup && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Group</Badge>
                          )}
                        </div>
                        {chat.time && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {chat.lastMessage}
                        </p>
                        {chat.unread > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0 font-medium">
                            {chat.unread > 9 ? '9+' : chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          {selectedChat ? (
            <div className="hidden md:flex flex-1 flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedChat.avatar}
                    alt={selectedChat.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  {selectedChat.isGroup && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                      <Users className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-base">{selectedChat.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.isGroup ? 'Group chat' : 'Active now'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {(messages[selectedChat.id] || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {!msg.isOwn && (
                      <img
                        src={selectedChat.avatar}
                        alt={selectedChat.name}
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                      />
                    )}
                    <div className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      <Card className={`p-3 max-w-md ${msg.isOwn ? 'bg-primary text-primary-foreground' : ''}`}>
                        <p 
                          className="text-sm leading-relaxed break-words"
                          dangerouslySetInnerHTML={{ __html: linkifyText(msg.content) }}
                        />
                      </Card>
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                    {msg.isOwn && (
                      <img
                        src={user?.avatar}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Message ${selectedChat.isGroup ? selectedChat.name : selectedChat.name.split(' ')[0]}...`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-11"
                  />
                  <Button 
                    size="icon" 
                    className="h-11 w-11 flex-shrink-0"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-muted/30">
              <div className="text-center">
                <Users className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Select a chat</h3>
                <p className="text-muted-foreground">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Chat;
