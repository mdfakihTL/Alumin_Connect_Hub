import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const examplePrompts = [
  "What are the admission requirements?",
  "Tell me about scholarship opportunities",
  "What clubs and organizations are available?",
  "How do I access the career center?",
  "What are the housing options?",
];

const dummyResponses: { [key: string]: string } = {
  "admission": "Our university has a holistic admission process. We typically look for a GPA of 3.5+, strong test scores, extracurricular activities, and compelling essays. The application deadline for Fall admission is January 15th.",
  "scholarship": "We offer several scholarship opportunities including Merit Scholarships (up to $20,000/year), Need-based Financial Aid, and Alumni Legacy Scholarships. Visit our Financial Aid office or check the student portal for applications.",
  "clubs": "We have over 200+ student organizations including cultural clubs, professional societies, sports clubs, and special interest groups. Popular ones include Tech Club, Debate Society, and Student Government. Check out the Student Activities Center!",
  "career": "The Career Center offers resume reviews, mock interviews, job fairs, and networking events. You can book appointments through the student portal. We also have an alumni mentorship program connecting students with industry professionals.",
  "housing": "We offer on-campus residence halls for freshmen and apartments for upperclassmen. Off-campus housing resources are available through our Housing Office. All freshmen are required to live on campus for their first year.",
  "default": "I'm here to help! I can answer questions about admissions, scholarships, campus life, academic programs, career services, and more. Feel free to ask me anything about the university!",
};

const UniversityChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi ${user?.name || 'there'}! 👋 I'm your University AI Assistant. I can help answer questions about admissions, scholarships, campus life, and more. Try asking me something or click on an example below!`,
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

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('admission') || lowerMessage.includes('apply') || lowerMessage.includes('requirement')) {
      return dummyResponses.admission;
    } else if (lowerMessage.includes('scholarship') || lowerMessage.includes('financial') || lowerMessage.includes('aid')) {
      return dummyResponses.scholarship;
    } else if (lowerMessage.includes('club') || lowerMessage.includes('organization') || lowerMessage.includes('activity')) {
      return dummyResponses.clubs;
    } else if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('internship')) {
      return dummyResponses.career;
    } else if (lowerMessage.includes('housing') || lowerMessage.includes('dorm') || lowerMessage.includes('residence')) {
      return dummyResponses.housing;
    } else {
      return dummyResponses.default;
    }
  };

  const handleSendMessage = (messageText?: string) => {
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

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(textToSend),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
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
                <span className="truncate">University AI Assistant</span>
                <Badge className="bg-primary text-xs flex-shrink-0">New</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Ask me anything about campus!</p>
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
            <h3 className="font-bold text-sm sm:text-base truncate">AI Assistant</h3>
            <p className="text-xs text-muted-foreground truncate">Always here to help</p>
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
                  : 'bg-card border border-border'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
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
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a question..."
            className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
          />
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
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

