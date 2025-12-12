import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MessageCircle,
  Send,
  Sparkles,
  X,
  History,
  Plus,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { chatService } from '@/services/chatService';
import { ChatSession, ChatMessage as ApiChatMessage } from '@/types/chat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  tokens_used?: number;
}

interface ChatState {
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sessions: ChatSession[];
  currentSessionId: number | null;
  isLoadingSessions: boolean;
  isLoadingHistory: boolean;
}

const examplePrompts = [
  "What are the upcoming events?",
  "Tell me about networking opportunities",
  "How can I connect with alumni in my field?",
  "What career resources are available?",
  "How do I update my profile?",
];

const UniversityChatbot = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatState, setChatState] = useState<ChatState>({
    isLoading: false,
    isSending: false,
    error: null,
    sessions: [],
    currentSessionId: null,
    isLoadingSessions: false,
    isLoadingHistory: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate welcome message
  const getWelcomeMessage = useCallback((): Message => ({
    id: 'welcome',
    text: `Hi ${user?.name || 'there'}! 👋 I'm your University AI Assistant powered by RAG technology. I can help answer questions about events, alumni connections, career resources, and more. Try asking me something or click on an example below!`,
    sender: 'bot',
    timestamp: new Date(),
  }), [user?.name]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, [getWelcomeMessage]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    if (!isAuthenticated) return;

    setChatState(prev => ({ ...prev, isLoadingSessions: true }));
    try {
      const sessions = await chatService.listSessions();
      setChatState(prev => ({
        ...prev,
        sessions,
        isLoadingSessions: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setChatState(prev => ({
        ...prev,
        isLoadingSessions: false,
      }));
    }
  }, [isAuthenticated]);

  // Load sessions when chat opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSessions();
    }
  }, [isOpen, isAuthenticated, loadSessions]);

  // Load session history
  const loadSessionHistory = async (sessionId: number) => {
    setChatState(prev => ({ ...prev, isLoadingHistory: true, error: null }));
    try {
      const session = await chatService.getSession(sessionId);
      
      // Convert API messages to local message format
      const historyMessages: Message[] = session.messages.map((msg: ApiChatMessage) => ({
        id: msg.id.toString(),
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'bot',
        timestamp: new Date(msg.created_at),
        tokens_used: msg.tokens_used,
      }));

      setMessages([getWelcomeMessage(), ...historyMessages]);
      setChatState(prev => ({
        ...prev,
        currentSessionId: sessionId,
        isLoadingHistory: false,
        error: null,
      }));

      toast({
        title: 'Session loaded',
        description: `Loaded conversation: ${session.title}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      setChatState(prev => ({
        ...prev,
        isLoadingHistory: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error loading session',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Start a new chat session
  const startNewSession = () => {
    setChatState(prev => ({
      ...prev,
      currentSessionId: null,
      error: null,
    }));
    setMessages([getWelcomeMessage()]);
    toast({
      title: 'New conversation',
      description: 'Started a new chat session',
    });
  };

  // Send message to API
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    // Check authentication
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to use the AI Assistant',
        variant: 'destructive',
      });
      return;
    }

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setChatState(prev => ({ ...prev, isSending: true, error: null }));

    try {
      // Send message to API
      const response = chatState.currentSessionId
        ? await chatService.continueSession(chatState.currentSessionId, textToSend)
        : await chatService.startNewSession(textToSend);

      // Add bot response
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: response.response,
        sender: 'bot',
        timestamp: new Date(),
        tokens_used: response.tokens_used,
      };
      setMessages(prev => [...prev, botMessage]);

      // Update session ID if this was a new session
      if (!chatState.currentSessionId && response.session_id) {
        setChatState(prev => ({
          ...prev,
          currentSessionId: response.session_id,
        }));
        // Refresh sessions list to include the new session
        loadSessions();
      }

      setChatState(prev => ({ ...prev, isSending: false, error: null }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      
      // Add error message to chat
      const errorBotMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorBotMessage]);

      setChatState(prev => ({
        ...prev,
        isSending: false,
        error: errorMessage,
      }));

      toast({
        title: 'Error sending message',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Retry last failed message
  const handleRetry = () => {
    // Find the last user message before an error
    const lastUserMessageIndex = messages.findLastIndex(
      (msg, idx) =>
        msg.sender === 'user' &&
        messages[idx + 1]?.isError
    );

    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[lastUserMessageIndex];
      // Remove error message
      setMessages(prev => prev.filter(msg => !msg.isError));
      // Retry sending
      handleSendMessage(lastUserMessage.text);
    }
  };

  const handleExampleClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format session date
  const formatSessionDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Collapsed view
  if (!isOpen) {
    return (
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20"
        onClick={() => setIsOpen(true)}
      >
        <div className="p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-purple-500/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span className="truncate">University AI Assistant</span>
                <Badge className="bg-primary text-xs flex-shrink-0">AI</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Ask me anything about alumni network!
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Expanded view
  return (
    <Card className="overflow-hidden border-2 border-primary/30">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">AI Assistant</h3>
              <p className="text-xs text-muted-foreground truncate">
                {chatState.currentSessionId ? `Session #${chatState.currentSessionId}` : 'New conversation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Session History Dropdown */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={chatState.isLoadingSessions}
                  >
                    {chatState.isLoadingSessions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <History className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={startNewSession} className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span>New conversation</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {chatState.sessions.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No previous conversations
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {chatState.sessions.map((session) => (
                        <DropdownMenuItem
                          key={session.id}
                          onClick={() => loadSessionHistory(session.id)}
                          className="flex flex-col items-start gap-1 cursor-pointer"
                        >
                          <span className="font-medium text-sm truncate w-full">
                            {session.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatSessionDate(session.created_at)}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* New Chat Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewSession}
              className="h-8 w-8"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {chatState.error && !chatState.isSending && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive flex-1 truncate">{chatState.error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="h-[250px] sm:h-[300px] lg:h-[350px] max-h-[40vh] overflow-y-auto subtle-scrollbar p-3 sm:p-4 space-y-3 bg-muted/20"
        onWheel={(e) => {
          e.stopPropagation();
        }}
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Loading History Skeleton */}
        {chatState.isLoadingHistory && (
          <div className="space-y-3">
            <div className="flex justify-start">
              <Skeleton className="h-16 w-3/4 rounded-lg" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-2/3 rounded-lg" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-20 w-3/4 rounded-lg" />
            </div>
          </div>
        )}

        {/* Messages */}
        {!chatState.isLoadingHistory &&
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.isError
                    ? 'bg-destructive/10 border border-destructive/30 text-destructive'
                    : 'bg-card border border-border'
                }`}
              >
                {message.isError && (
                  <div className="flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs font-medium">Error</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.tokens_used && (
                    <span className="text-xs opacity-50">
                      {message.tokens_used} tokens
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

        {/* Typing Indicator */}
        {chatState.isSending && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts - Show only for new conversations */}
      {messages.length <= 1 && !chatState.isLoadingHistory && (
        <div className="p-2 sm:p-3 border-t border-border bg-card">
          <p className="text-xs font-medium text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {examplePrompts.map((prompt, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-[10px] sm:text-xs py-1"
                onClick={() => handleExampleClick(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-2 sm:p-3 border-t border-border bg-card">
        {!isAuthenticated ? (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground mb-2">
              Please log in to use the AI Assistant
            </p>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              Log In
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
              disabled={chatState.isSending || chatState.isLoadingHistory}
            />
            <Button
              size="sm"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || chatState.isSending || chatState.isLoadingHistory}
              className="h-8 sm:h-9 px-2 sm:px-3"
            >
              {chatState.isSending ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UniversityChatbot;
