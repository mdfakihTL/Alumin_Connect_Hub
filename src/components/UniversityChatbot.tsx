import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: string[];
  isError?: boolean;
}

// Example prompts for MIT Knowledge Base
const examplePrompts = [
  "What are the admission requirements?",
  "Tell me about scholarship opportunities",
  "What programs does MIT offer?",
  "How do I access alumni benefits?",
  "What are the housing options?",
];

// API configuration - uses same base URL as main API
const getApiBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('alumni-portal')) {
    return 'https://alumni-portal-yw7q.onrender.com/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseURL();

// Interface for Knowledge Base API response
interface ChatQueryResponse {
  answer: string;
  sources: string[];
  university_id: string;
  university_name: string;
  context_used: string;
  is_dummy: boolean;
}

const UniversityChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi ${user?.name || 'there'}! 👋 I'm your MIT AI Assistant powered by the Knowledge Base. I can answer questions about admissions, academics, campus life, alumni benefits, and more. Ask me anything!`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call the actual Knowledge Base API
  const fetchKnowledgeBaseAnswer = async (question: string): Promise<{ answer: string; sources: string[] }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const data: ChatQueryResponse = await response.json();
      return {
        answer: data.answer,
        sources: data.sources,
      };
    } catch (error) {
      console.error('Knowledge Base API error:', error);
      throw error;
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call the actual Knowledge Base API
      const { answer, sources } = await fetchKnowledgeBaseAnswer(textToSend);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        sender: 'bot',
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined,
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      // Handle error - show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error 
          ? `Sorry, I couldn't get an answer: ${error.message}. Please try again later.`
          : "Sorry, something went wrong. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

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
                <span className="truncate">MIT Knowledge Assistant</span>
                <Badge className="bg-primary text-xs flex-shrink-0">AI</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Ask me anything about MIT!</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/30">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate">MIT AI Assistant</h3>
            <p className="text-xs text-muted-foreground truncate">Powered by Knowledge Base</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div 
        className="h-[250px] sm:h-[300px] lg:h-[350px] max-h-[40vh] overflow-y-auto subtle-scrollbar p-3 sm:p-4 space-y-3 bg-muted/20"
        onWheel={(e) => {
          e.stopPropagation();
        }}
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.isError
                  ? 'bg-destructive/10 border border-destructive/30'
                  : 'bg-card border border-border'
              }`}
            >
              {message.isError && (
                <div className="flex items-center gap-1 mb-1 text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">Error</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    📚 Sources: {message.sources.join(', ')}
                  </p>
                </div>
              )}
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {messages.length <= 2 && (
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
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
            placeholder="Ask a question..."
            className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
            disabled={isTyping}
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
            className="h-8 sm:h-9 px-2 sm:px-3"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UniversityChatbot;
