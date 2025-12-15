import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import CommentSection from '@/components/CommentSection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Briefcase,
  Megaphone,
  Play,
  ArrowLeft,
  Edit,
  Trash2,
  Facebook,
  Twitter,
  Copy,
  Check,
  Menu,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const SinglePost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { postId } = useParams();
  const { user } = useAuth();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();

  const [post, setPost] = useState<any>(location.state?.post || null);
  const [isLoading, setIsLoading] = useState(!location.state?.post);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);
  const showComments = true;

  // Fetch post from API if not passed through state
  useEffect(() => {
    const fetchPost = async () => {
      if (post) {
        // Post from state - initialize likes/comments
        setLikes(post.likes || 0);
        setComments(post.comments || 0);
        return;
      }
      
      if (!postId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const apiPost = await apiClient.getPost(postId);
        
        // Format the post
        const formattedPost = {
          id: apiPost.id,
          type: apiPost.type || 'text',
          author: apiPost.author?.name || 'Unknown',
          avatar: apiPost.author?.avatar || '',
          university: apiPost.author?.title || '',
          year: '',
          content: apiPost.content || '',
          media: apiPost.media_url || undefined,
          videoUrl: apiPost.video_url || undefined,
          thumbnail: apiPost.thumbnail_url || undefined,
          likes: apiPost.likes_count || 0,
          comments: apiPost.comments_count || 0,
          time: apiPost.time || '',
          tag: apiPost.tag,
          jobTitle: apiPost.job_title,
          company: apiPost.company,
          location: apiPost.location,
        };
        
        setPost(formattedPost);
        setLikes(formattedPost.likes);
        setComments(formattedPost.comments);
        setIsLiked(apiPost.is_liked || false);
      } catch (error) {
        console.error('Failed to fetch post:', error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, location.state?.post]);

  // Handle like toggle with API
  const handleLikeToggle = async () => {
    if (!post) return;
    
    const wasLiked = isLiked;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikes(wasLiked ? likes - 1 : likes + 1);

    try {
      if (wasLiked) {
        const response = await apiClient.unlikePost(post.id.toString());
        setLikes(response.likes_count);
      } else {
        const response = await apiClient.likePost(post.id.toString());
        setLikes(response.likes_count);
      }
    } catch (error: any) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikes(wasLiked ? likes : likes - 1);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update like',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Post not found</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Feed</Button>
        </div>
      </div>
    );
  }

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

  const handleShare = async (
    method: 'copy' | 'facebook' | 'twitter' | 'native',
  ) => {
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
                    const tagMap: Record<
                      string,
                      { label: string; color: string; icon: string }
                    > = {
                      'success-story': {
                        label: 'Success Story',
                        color:
                          'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
                        icon: '🏆',
                      },
                      'career-milestone': {
                        label: 'Career Milestone',
                        color:
                          'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
                        icon: '📈',
                      },
                      achievement: {
                        label: 'Achievement',
                        color:
                          'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
                        icon: '⭐',
                      },
                      learning: {
                        label: 'Learning Journey',
                        color:
                          'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
                        icon: '📚',
                      },
                      volunteering: {
                        label: 'Volunteering',
                        color:
                          'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
                        icon: '❤️',
                      },
                    };
                    const tagInfo = tagMap[post.tag];
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

              {post.type === 'video' && post.thumbnail && (
                <div className="relative w-full group cursor-pointer bg-muted">
                  <img
                    src={post.thumbnail}
                    alt="Video thumbnail"
                    onError={handleImageError}
                    className="w-full object-cover max-h-[450px]"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-10 h-10 text-primary ml-1" />
                    </div>
                  </div>
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
                  >
                    <Heart
                      className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
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
              {showComments && (
                <CommentSection
                  postId={post.id}
                  onCommentAdded={() => setComments(comments + 1)}
                />
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SinglePost;
