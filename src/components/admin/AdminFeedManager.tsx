import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/api/admin';
import { handleApiError } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, MessageCircle, Search, AlertCircle, Filter, CalendarDays, Users, Loader2, RefreshCw, Image, Video, Briefcase, Megaphone, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    title?: string;
    company?: string;
    is_mentor: boolean;
  };
  type: string;
  content: string;
  media_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  tag?: string;
  likes_count: number;
  comments_count: number;
  is_active: boolean;
  created_at: string;
}

const postTypes = [
  { value: 'text', label: 'Text', icon: MessageCircle },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'job', label: 'Job', icon: Briefcase },
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
];

const tags = [
  'success-story',
  'career-milestone',
  'achievement',
  'learning',
  'volunteering',
];

const AdminFeedManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [mentorFilter, setMentorFilter] = useState<boolean | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getPosts({
        page,
        page_size: pageSize,
        search: searchQuery || undefined,
        type: typeFilter || undefined,
        tag: tagFilter || undefined,
        is_mentor: mentorFilter,
        date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
      });
      setPosts(response.posts);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      // Fallback to empty state
      setPosts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, typeFilter, tagFilter, mentorFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await adminApi.deletePost(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
        setTotal(prev => prev - 1);
        toast({
          title: 'Post deleted',
          description: 'The post has been removed from the feed',
        });
      } catch (error) {
        handleApiError(error, 'Failed to delete post');
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setTagFilter('');
    setMentorFilter(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasActiveFilters = searchQuery || typeFilter || tagFilter || mentorFilter !== undefined || dateFrom || dateTo;

  const getTypeIcon = (type: string) => {
    const found = postTypes.find(t => t.value === type);
    return found ? <found.icon className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">University Feed Management</h2>
            <p className="text-sm text-muted-foreground">
              Monitor and moderate posts from your university alumni
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {total} Posts
            </Badge>
            <Button variant="outline" size="icon" onClick={fetchPosts} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts by content or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="p-4 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Post Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Post Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {postTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tag Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tag</Label>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All tags</SelectItem>
                      {tags.map(tag => (
                        <SelectItem key={tag} value={tag}>
                          {tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mentor Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Author Type</Label>
                  <Select 
                    value={mentorFilter === undefined ? '' : mentorFilter.toString()} 
                    onValueChange={(v) => setMentorFilter(v === '' ? undefined : v === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All authors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All authors</SelectItem>
                      <SelectItem value="true">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Mentors only
                        </div>
                      </SelectItem>
                      <SelectItem value="false">Non-mentors only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, 'MMM d') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, 'MMM d') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="w-4 h-4" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Info Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Admin Moderation</p>
            <p className="text-blue-600 dark:text-blue-300">
              You can remove inappropriate posts to maintain a professional environment. Filter by mentor posts, date range, or post type.
            </p>
          </div>
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading posts...</p>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No posts found</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            {posts.map(post => (
              <Card key={post.id} className={`p-6 ${!post.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{post.author.name}</h3>
                        {post.author.is_mentor && (
                          <Badge variant="secondary" className="text-xs">Mentor</Badge>
                        )}
                        <Badge variant="outline" className="text-xs gap-1">
                          {getTypeIcon(post.type)}
                          {post.type}
                        </Badge>
                        {post.tag && (
                          <Badge className="text-xs">{post.tag.replace(/-/g, ' ')}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleString()}
                        </span>
                      </div>
                      {post.author.title && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {post.author.title} {post.author.company && `at ${post.author.company}`}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.content}</p>
                      
                      {/* Media Preview */}
                      {post.media_url && (
                        <div className="mb-3">
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="max-h-40 rounded-lg object-cover"
                          />
                        </div>
                      )}
                      {post.thumbnail_url && (
                        <div className="mb-3 relative">
                          <img 
                            src={post.thumbnail_url} 
                            alt="Video thumbnail" 
                            className="max-h-40 rounded-lg object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>❤️ {post.likes_count} likes</span>
                        <span>💬 {post.comments_count} comments</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {total > pageSize && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminFeedManager;
