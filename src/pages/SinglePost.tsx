import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import CommentSection from '@/components/CommentSection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  MessageCircle,
  Share2,
  Briefcase,
  Megaphone,
  ArrowLeft,
  Facebook,
  Twitter,
  Copy,
  Check,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { feedService } from '@/services/feedService';
import { ApiPost, PostTag, PostMedia } from '@/types/feed';

// Helper to get API base URL for media
const getMediaUrl = (url: string): string => {
  if (url.startsWith('/media/')) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alumni-portal-yw7q.onrender.com';
    return `${API_BASE_URL}${url}`;
  }
  return url;
};

// Tag display mapping - supports both API format (snake_case) and frontend format (kebab-case)
const tagDisplayMap: Record<string, { label: string; color: string; icon: string }> = {
  // API format (snake_case)
  'success_story': {
    label: 'Success Story',
    color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    icon: '🏆',
  },
  'career_milestone': {
    label: 'Career Milestone',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    icon: '📈',
  },
  'achievement': {
    label: 'Achievement',
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    icon: '⭐',
  },
  'learning_journey': {
    label: 'Learning Journey',
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    icon: '📚',
  },
  'volunteering': {
    label: 'Volunteering',
    color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
    icon: '❤️',
  },
  // Frontend format (kebab-case) for backwards compatibility
  'success-story': {
    label: 'Success Story',
    color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    icon: '🏆',
  },
  'career-milestone': {
    label: 'Career Milestone',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    icon: '📈',
  },
  'learning': {
    label: 'Learning Journey',
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    icon: '📚',
  },
};

// Helper to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface PostData {
  id: number;
  author: string;
  avatar: string;
  university: string;
  year: string;
  content: string;
  type?: string;
  tag?: string;
  likes: number;
  comments: number;
  time: string;
  media?: string;
  videoUrl?: string;
  thumbnail?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  user_liked?: boolean;
  author_id?: number;
  apiComments?: ApiPost['comments'];
  apiMedia?: PostMedia[];
}

const SinglePost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();

  // State for post data
  const [post, setPost] = useState<PostData | null>(location.state?.post || null);
  const [isLoading, setIsLoading] = useState(!location.state?.post);
  const [error, setError] = useState<string | null>(null);

  // Interaction states
  const [isLiked, setIsLiked] = useState(post?.user_liked || false);
  const [likes, setLikes] = useState(post?.likes || 0);
  const [comments, setComments] = useState(post?.comments || 0);
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  // Fetch post from API if not provided via state
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('Post ID not provided');
        setIsLoading(false);
        return;
      }

      // If post was passed via state, use it
      if (location.state?.post) {
        const statePost = location.state.post;
        setPost(statePost);
        setIsLiked(statePost.user_liked || false);
        setLikes(statePost.likes || 0);
        setComments(statePost.comments || 0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiPost = await feedService.getPost(parseInt(id, 10));
        
        // Determine post type and media URLs from API media attachments
        let type = 'text';
        let media: string | undefined;
        let videoUrl: string | undefined;
        let thumbnail: string | undefined;

        if (apiPost.media && apiPost.media.length > 0) {
          const firstMedia = apiPost.media[0];
          if (firstMedia.media_type === 'image') {
            type = 'image';
            media = getMediaUrl(firstMedia.media_url);
          } else if (firstMedia.media_type === 'video') {
            type = 'video';
            videoUrl = getMediaUrl(firstMedia.media_url);
            thumbnail = firstMedia.thumbnail_url ? getMediaUrl(firstMedia.thumbnail_url) : undefined;
          }
        }
        
        const mappedPost: PostData = {
          id: apiPost.id,
          author: apiPost.author_name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiPost.author_name.replace(/\s+/g, '')}`,
          university: apiPost.university_name,
          year: new Date(apiPost.created_at).getFullYear().toString(),
          content: apiPost.content,
          type,
          media,
          videoUrl,
          thumbnail,
          tag: apiPost.tag, // Include tag from API
          likes: apiPost.likes_count,
          comments: apiPost.comments_count,
          time: formatRelativeTime(apiPost.created_at),
          user_liked: apiPost.user_liked,
          author_id: apiPost.author_id,
          apiComments: apiPost.comments,
          apiMedia: apiPost.media,
        };

        setPost(mappedPost);
        setIsLiked(apiPost.user_liked);
        setLikes(apiPost.likes_count);
        setComments(apiPost.comments_count);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load post';
        setError(errorMessage);
        toast({
          title: 'Error loading post',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, location.state?.post, toast]);

  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

    let result = text;
    result = result.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80 font-medium">${url}</a>`;
    });
    result = result.replace(emailRegex, (email) => {
      return `<a href="mailto:${email}" class="text-primary underline hover:text-primary/80 font-medium">${email}</a>`;
    });
    return result;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop';
  };

  const handleProfileClick = () => {
    if (!post) return;
    if (post.author === user?.name || post.author === 'You') {
      navigate('/profile');
    } else {
      navigate('/profile', {
        state: {
          userData: {
            name: post.author,
            avatar: post.avatar,
            university: post.university,
            year: post.year,
          },
        },
      });
    }
  };

  const handleLikeToggle = async () => {
    if (!post) return;
    
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to like posts',
        variant: 'destructive',
      });
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikes(prev => prev + (wasLiked ? -1 : 1));

    try {
      const response = await feedService.toggleLike(post.id);
      
      // Verify server state matches
      if (response.liked !== !wasLiked) {
        setIsLiked(response.liked);
        // Refetch to get accurate count
        const updatedPost = await feedService.getPost(post.id);
        setLikes(updatedPost.likes_count);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikes(prev => prev + (wasLiked ? 1 : -1));
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update like';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (
    method: 'copy' | 'facebook' | 'twitter' | 'native',
  ) => {
    if (!post) return;
    
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `Check out this post by ${
      post.author
    }: ${post.content.slice(0, 100)}...`;

    try {
      switch (method) {
        case 'copy':
          await navigator.clipboard.writeText(postUrl);
          setCopiedPostId(post.id);
          setTimeout(() => setCopiedPostId(null), 2000);
          toast({
            title: 'Link copied!',
            description: 'Post link copied to clipboard',
          });
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              postUrl,
            )}`,
            '_blank',
          );
          break;
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareText,
            )}&url=${encodeURIComponent(postUrl)}`,
            '_blank',
          );
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: `Post by ${post.author}`,
              text: shareText,
              url: postUrl,
            });
          }
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCommentAdded = () => {
    setComments(prev => prev + 1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopNav />
        <MobileNav />
        <main
          className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${
            isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
          }`}
        >
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Skeleton className="h-9 w-9 rounded" />
                <Skeleton className="h-9 flex-1 rounded" />
              </div>
              <Card className="p-5">
                <div className="flex gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-64 w-full rounded-lg" />
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopNav />
        <MobileNav />
        <main
          className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${
            isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
          }`}
        >
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-8 text-center">
                <div className="text-destructive mb-4">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">
                    {error || 'Post not found'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    The post you're looking for might have been removed or doesn't exist.
                  </p>
                </div>
                <Button onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Feed
                </Button>
              </Card>
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

      <main
        className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto">
            {/* Header with Back and Toggle */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 flex-shrink-0"
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/dashboard')}
                className="gap-2 h-9 text-sm flex-1 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Feed</span>
              </Button>
            </div>

            {/* Single Post */}
            <Card className="overflow-hidden shadow-lg">
              {/* Post Header */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <img
                      src={post.avatar}
                      alt={post.author}
                      onClick={handleProfileClick}
                      className="w-12 h-12 rounded-full ring-2 ring-primary/10 flex-shrink-0 object-cover cursor-pointer hover:ring-primary/30 transition-all"
                    />
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-semibold text-base cursor-pointer hover:underline hover:text-primary transition-colors"
                        onClick={handleProfileClick}
                      >
                        {post.author}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {post.university} '{post.year} • {post.time}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Tag Badge */}
                {post.tag &&
                  (() => {
                    const tagInfo = tagDisplayMap[post.tag];
                    return tagInfo ? (
                      <Badge
                        className={`mb-3 ${tagInfo.color} border font-medium`}
                      >
                        <span className="mr-1">{tagInfo.icon}</span>
                        {tagInfo.label}
                      </Badge>
                    ) : null;
                  })()}

                {/* Post Type Badge */}
                {(post.type === 'job' || post.type === 'announcement') && (
                  <Badge
                    className="mb-3"
                    variant={post.type === 'job' ? 'default' : 'secondary'}
                  >
                    {post.type === 'job' && (
                      <Briefcase className="w-3 h-3 mr-1.5" />
                    )}
                    {post.type === 'announcement' && (
                      <Megaphone className="w-3 h-3 mr-1.5" />
                    )}
                    {post.type === 'job' ? 'Job Opportunity' : 'Announcement'}
                  </Badge>
                )}

                {/* Job Details */}
                {post.type === 'job' && (
                  <div className="mb-4 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h4 className="font-semibold text-base mb-1">
                      {post.jobTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {post.company} • {post.location}
                    </p>
                  </div>
                )}

                {/* Post Content */}
                <div
                  className="text-base leading-relaxed mb-4 whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: linkifyText(post.content),
                  }}
                />
              </div>

              {/* Media */}
              {post.type === 'image' && post.media && (
                <div className="relative w-full bg-muted">
                  <img
                    src={post.media}
                    alt="Post content"
                    onError={handleImageError}
                    className="w-full object-cover max-h-[600px]"
                  />
                </div>
              )}

              {post.type === 'video' && post.videoUrl && (
                <div className="relative w-full bg-muted">
                  <video
                    src={post.videoUrl}
                    poster={post.thumbnail}
                    className="w-full object-cover max-h-[600px]"
                    controls
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Post Actions */}
              <div className="p-4 sm:p-5 border-t border-border">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 ${
                      isLiked
                        ? 'text-red-500 hover:text-red-600'
                        : 'hover:text-red-600 dark:hover:text-red-400'
                    }`}
                    onClick={handleLikeToggle}
                    disabled={isLiking}
                  >
                    <Heart
                      className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`}
                    />
                    <span className="text-sm font-medium">{likes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 cursor-default"
                    disabled
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {comments} Comments
                    </span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 hover:bg-green-100 dark:hover:bg-green-950/50 hover:text-green-600 dark:hover:text-green-400"
                      >
                        <Share2 className="w-5 h-5" />
                        <span className="hidden sm:inline text-sm font-medium">
                          Share
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52"
                    >
                      <DropdownMenuItem
                        onClick={() => handleShare('copy')}
                        className="gap-2 cursor-pointer"
                      >
                        {copiedPostId === post.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Link copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy link</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleShare('facebook')}
                        className="gap-2 cursor-pointer"
                      >
                        <Facebook className="w-4 h-4" />
                        <span>Share on Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleShare('twitter')}
                        className="gap-2 cursor-pointer"
                      >
                        <Twitter className="w-4 h-4" />
                        <span>Share on Twitter</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Comment Section */}
              <CommentSection
                postId={post.id}
                onCommentAdded={handleCommentAdded}
                initialComments={post.apiComments?.map(c => ({
                  id: c.id.toString(),
                  author: c.author_name,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_name.replace(/\s+/g, '')}`,
                  content: c.content,
                  time: formatRelativeTime(c.created_at),
                }))}
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SinglePost;
