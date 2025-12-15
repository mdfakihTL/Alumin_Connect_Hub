import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, UserPlus, Search as SearchIcon } from 'lucide-react';

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  type: string;
}

interface SearchResult {
  type: 'post' | 'user' | 'event' | 'connection';
  id: string | number;
  title: string;
  subtitle?: string;
  avatar?: string;
  icon?: any;
  data?: any;
}

interface GlobalSearchDropdownProps {
  query: string;
  posts: Post[];
  events: any[];
  connections: any[];
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
}

const GlobalSearchDropdown = ({ query, posts, events, connections, onSelect, onClose }: GlobalSearchDropdownProps) => {
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchQuery = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search posts
    posts.forEach(post => {
      if (
        post.content.toLowerCase().includes(searchQuery) ||
        post.author.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          type: 'post',
          id: post.id,
          title: post.content.slice(0, 60) + (post.content.length > 60 ? '...' : ''),
          subtitle: `Post by ${post.author}`,
          avatar: post.avatar,
          icon: FileText,
          data: post,
        });
      }
    });

    // Search unique users from posts
    const uniqueUsers = new Map();
    posts.forEach(post => {
      const userName = post.author.toLowerCase();
      if (userName.includes(searchQuery) && !uniqueUsers.has(userName)) {
        uniqueUsers.set(userName, {
          type: 'user',
          id: `user_${post.author}`,
          title: post.author,
          subtitle: `${post.type} • View profile`,
          avatar: post.avatar,
          icon: Users,
          data: post,
        });
      }
    });
    uniqueUsers.forEach(user => allResults.push(user));

    // Search events
    events.forEach(event => {
      if (
        event.title?.toLowerCase().includes(searchQuery) ||
        event.location?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          type: 'event',
          id: event.id,
          title: event.title,
          subtitle: `${event.date} • ${event.location}`,
          icon: Calendar,
          data: event,
        });
      }
    });

    // Search connections
    connections.forEach(conn => {
      if (
        conn.name.toLowerCase().includes(searchQuery) ||
        conn.company?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          type: 'connection',
          id: conn.id,
          title: conn.name,
          subtitle: `${conn.jobTitle} at ${conn.company}`,
          avatar: conn.avatar,
          icon: UserPlus,
          data: conn,
        });
      }
    });

    return allResults.slice(0, 10); // Limit to 10 results
  }, [query, posts, events, connections]);

  if (!query.trim()) return null;

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 z-30 shadow-lg border-2">
      {results.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
            <SearchIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-base mb-1">No results found</h3>
          <p className="text-sm text-muted-foreground">
            Try searching for posts, people, events, or connections
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-3 py-2 font-medium">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </p>
          {results.map((result, index) => {
            const Icon = result.icon;
            
            return (
              <button
                key={`${result.type}_${result.id}`}
                onClick={() => onSelect(result)}
                className="w-full p-3 flex items-center gap-3 hover:bg-accent rounded-lg transition-colors text-left"
              >
                {result.avatar ? (
                  <img
                    src={result.avatar}
                    alt={result.title}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm truncate">{result.title}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {result.type}
                    </Badge>
                  </div>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

export default GlobalSearchDropdown;

