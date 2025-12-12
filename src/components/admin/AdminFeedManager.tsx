import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trash2, 
  MessageCircle, 
  Search, 
  AlertCircle, 
  Pin, 
  PinOff,
  Eye,
  EyeOff,
  RotateCcw,
  RefreshCw,
  ThumbsUp,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { feedService } from '@/services/feedService';
import { ApiPost, PostStatus } from '@/types/feed';

type StatusFilter = PostStatus | 'all';

interface ActionLoadingState {
  [postId: number]: {
    hide?: boolean;
    restore?: boolean;
    pin?: boolean;
  };
}

const AdminFeedManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Posts state
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const pageSize = 10;
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Expanded comments state
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  
  // Action loading states (per-post)
  const [actionLoading, setActionLoading] = useState<ActionLoadingState>({});
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await feedService.adminListPosts({
        page: currentPage,
        page_size: pageSize,
        university_id: user?.universityId ? Number(user.universityId) : undefined,
        status_filter: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      });
      
      setPosts(response.posts);
      setTotalPages(response.total_pages);
      setTotalPosts(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      toast({
        title: 'Error loading posts',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, user?.universityId, statusFilter, debouncedSearch, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle hide post
  const handleHidePost = async (postId: number) => {
    setActionLoading(prev => ({ ...prev, [postId]: { ...prev[postId], hide: true } }));
    
    try {
      await feedService.hidePost(postId);
      
      // Update local state optimistically
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'hidden' as PostStatus } : post
      ));
      
      toast({
        title: 'Post hidden',
        description: 'The post has been hidden from the feed',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to hide post';
      toast({
        title: 'Failed to hide post',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: { ...prev[postId], hide: false } }));
    }
  };

  // Handle restore post
  const handleRestorePost = async (postId: number) => {
    setActionLoading(prev => ({ ...prev, [postId]: { ...prev[postId], restore: true } }));
    
    try {
      await feedService.restorePost(postId);
      
      // Update local state optimistically
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'active' as PostStatus } : post
      ));
      
      toast({
        title: 'Post restored',
        description: 'The post has been restored and is now visible',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore post';
      toast({
        title: 'Failed to restore post',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: { ...prev[postId], restore: false } }));
    }
  };

  // Handle pin/unpin post
  const handleTogglePin = async (postId: number) => {
    setActionLoading(prev => ({ ...prev, [postId]: { ...prev[postId], pin: true } }));
    
    try {
      const response = await feedService.togglePinPost(postId);
      
      // Update local state with the new pin state
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, is_pinned: response.is_pinned } : post
      ));
      
      toast({
        title: response.is_pinned ? 'Post pinned' : 'Post unpinned',
        description: response.is_pinned 
          ? 'The post is now pinned to the top of the feed' 
          : 'The post has been unpinned',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pin status';
      toast({
        title: 'Failed to update pin status',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: { ...prev[postId], pin: false } }));
    }
  };

  // Get status badge variant and text
  const getStatusBadge = (status: PostStatus, isPinned: boolean) => {
    if (isPinned) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
          <Pin className="w-3 h-3 mr-1" />
          Pinned
        </Badge>
      );
    }
    
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'hidden':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950">
            <EyeOff className="w-3 h-3 mr-1" />
            Hidden
          </Badge>
        );
      case 'deleted':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950">
            <XCircle className="w-3 h-3 mr-1" />
            Deleted
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format date to human-readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading skeleton
  const PostSkeleton = () => (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </Card>
  );

  // Sort posts: pinned first, then by date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">University Feed Management</h2>
            <p className="text-sm text-muted-foreground">
              Monitor and moderate posts from your university alumni
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {totalPosts} Posts
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          <Select 
            value={statusFilter} 
            onValueChange={(value: StatusFilter) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => fetchPosts()}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Admin Moderation</p>
            <p className="text-blue-600 dark:text-blue-300">
              You can hide inappropriate posts, restore hidden posts, and pin important announcements.
              Pinned posts appear at the top of the feed for all users.
            </p>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && !isLoading && (
        <Card className="p-8 text-center border-destructive">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load posts</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchPosts()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <Card className="p-8 text-center">
          <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts found</h3>
          <p className="text-muted-foreground">
            {debouncedSearch || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'No posts have been created yet'}
          </p>
        </Card>
      )}

      {/* Posts List */}
      {!isLoading && !error && posts.length > 0 && (
        <div className="space-y-4">
          {sortedPosts.map(post => {
            const postActionLoading = actionLoading[post.id] || {};
            const isAnyActionLoading = postActionLoading.hide || postActionLoading.restore || postActionLoading.pin;
            
            return (
              <Card 
                key={post.id} 
                className={`p-6 transition-all ${
                  post.status === 'hidden' ? 'opacity-75 border-yellow-200 dark:border-yellow-800' :
                  post.status === 'deleted' ? 'opacity-60 border-red-200 dark:border-red-800' :
                  post.is_pinned ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold">{post.author_name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.created_at)}
                      </span>
                      {getStatusBadge(post.status, post.is_pinned)}
                      <Badge variant="secondary" className="text-xs">
                        {post.university_name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {post.likes_count} likes
                      </span>
                      <button
                        onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count} comments
                      </button>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Pin/Unpin Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePin(post.id)}
                      disabled={isAnyActionLoading || post.status !== 'active'}
                      title={post.is_pinned ? 'Unpin post' : 'Pin post'}
                      className={post.is_pinned 
                        ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900'
                        : 'text-muted-foreground hover:text-amber-600'}
                    >
                      {postActionLoading.pin ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : post.is_pinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Hide/Restore Button */}
                    {post.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleHidePost(post.id)}
                        disabled={isAnyActionLoading}
                        title="Hide post"
                        className="text-muted-foreground hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                      >
                        {postActionLoading.hide ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestorePost(post.id)}
                        disabled={isAnyActionLoading}
                        title="Restore post"
                        className="text-muted-foreground hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                      >
                        {postActionLoading.restore ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Comments Section */}
                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <h4 className="font-medium text-sm">Comments ({post.comments?.length || 0})</h4>
                    {(!post.comments || post.comments.length === 0) ? (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    ) : (
                      post.comments.map(comment => (
                        <div 
                          key={comment.id} 
                          className={`flex items-start gap-4 p-3 rounded-lg ${
                            comment.status === 'deleted' 
                              ? 'bg-red-50/50 dark:bg-red-950/30 opacity-60' 
                              : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{comment.author_name}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </span>
                              {comment.status === 'deleted' && (
                                <Badge variant="outline" className="text-xs text-red-600">
                                  Deleted
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalPosts} total posts)
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {/* Show limited page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminFeedManager;
