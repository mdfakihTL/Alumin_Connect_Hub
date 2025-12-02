import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '@/contexts/EventsContext';
import { useConnections } from '@/contexts/ConnectionsContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import PostModal from '@/components/PostModal';
import NotificationBell from '@/components/NotificationBell';
import CommentSection from '@/components/CommentSection';
import GlobalSearchDropdown from '@/components/GlobalSearchDropdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Briefcase, Megaphone, Play, 
  PlusCircle, Search, Moon, Sun, Edit, Trash2, Facebook, Twitter, Copy, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: number;
  type: 'text' | 'image' | 'video' | 'job' | 'announcement';
  author: string;
  avatar: string;
  university: string;
  year: string;
  content: string;
  media?: string;
  videoUrl?: string;
  thumbnail?: string;
  likes: number;
  comments: number;
  time: string;
  jobTitle?: string;
  company?: string;
  location?: string;
}

interface Ad {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
}

// Comprehensive dummy data
const allMockPosts: Post[] = [
  {
    id: 1,
    type: 'job',
    author: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    university: 'MIT',
    year: '2020',
    content: 'Exciting opportunity at Google! We\'re hiring Senior Software Engineers. Great benefits, innovative projects, and amazing team culture. Apply now!',
    likes: 234,
    comments: 45,
    time: '2h ago',
    jobTitle: 'Senior Software Engineer',
    company: 'Google',
    location: 'Mountain View, CA',
  },
  {
    id: 2,
    type: 'image',
    author: 'Michael Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    university: 'Stanford',
    year: '2019',
    content: 'Amazing alumni meetup in San Francisco! Great to reconnect with everyone. #AlumniNetwork #TechCommunity',
    media: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
    likes: 189,
    comments: 32,
    time: '4h ago',
  },
  {
    id: 3,
    type: 'video',
    author: 'Emily Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    university: 'Harvard',
    year: '2021',
    content: 'Check out my startup pitch at TechCrunch Disrupt! We\'re revolutionizing education tech.',
    thumbnail: 'https://images.unsplash.com/photo-1540317580384-e5d43616e5a9?w=800&h=450&fit=crop',
    videoUrl: 'video1.mp4',
    likes: 456,
    comments: 78,
    time: '6h ago',
  },
  {
    id: 4,
    type: 'announcement',
    author: 'Alumni Association',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alumni',
    university: 'University',
    year: 'Official',
    content: '🎉 Annual Alumni Gala 2024 is coming! Join us for an evening of networking, celebration, and reconnection. Early bird tickets available now!',
    likes: 567,
    comments: 89,
    time: '8h ago',
  },
  {
    id: 5,
    type: 'text',
    author: 'David Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    university: 'Berkeley',
    year: '2018',
    content: 'Just published my first book on AI and Machine Learning! Thank you to all my mentors and the alumni community for the support. Available on Amazon now! 📚',
    likes: 342,
    comments: 56,
    time: '10h ago',
  },
  {
    id: 6,
    type: 'image',
    author: 'Jessica Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    university: 'Yale',
    year: '2022',
    content: 'Graduated today! Couldn\'t have done it without the support of our amazing alumni network. On to the next chapter! 🎓',
    media: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
    likes: 678,
    comments: 92,
    time: '12h ago',
  },
  {
    id: 7,
    type: 'job',
    author: 'Robert Taylor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    university: 'Princeton',
    year: '2017',
    content: 'We\'re expanding! Looking for talented Product Managers to join our fintech startup. Remote-friendly, competitive salary, and equity options.',
    likes: 198,
    comments: 41,
    time: '14h ago',
    jobTitle: 'Product Manager',
    company: 'FinTech Innovations',
    location: 'Remote / NYC',
  },
  {
    id: 8,
    type: 'video',
    author: 'Amanda Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda',
    university: 'Cornell',
    year: '2020',
    content: 'My TEDx talk on sustainable business practices is now live! Would love to hear your thoughts.',
    thumbnail: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop',
    videoUrl: 'video2.mp4',
    likes: 523,
    comments: 67,
    time: '16h ago',
  },
  {
    id: 9,
    type: 'text',
    author: 'Chris Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris',
    university: 'Columbia',
    year: '2019',
    content: 'Reflecting on 5 years since graduation. The connections I\'ve made through our alumni network have been invaluable. Grateful for this community! 💙',
    likes: 421,
    comments: 54,
    time: '18h ago',
  },
  {
    id: 10,
    type: 'image',
    author: 'Maria Garcia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    university: 'Duke',
    year: '2021',
    content: 'Leading my first workshop on entrepreneurship! Thank you to everyone who attended. Here\'s to empowering the next generation! 🚀',
    media: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    likes: 387,
    comments: 48,
    time: '20h ago',
  },
  {
    id: 11,
    type: 'announcement',
    author: 'Career Services',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Career',
    university: 'University',
    year: 'Official',
    content: '📢 Virtual Career Fair next month! Connect with 100+ top employers. All alumni welcome. Registration opens Monday!',
    likes: 712,
    comments: 103,
    time: '1d ago',
  },
  {
    id: 12,
    type: 'text',
    author: 'James Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    university: 'Northwestern',
    year: '2016',
    content: 'Starting a mentorship program for recent grads interested in consulting. DM me if you\'re interested!',
    likes: 256,
    comments: 38,
    time: '1d ago',
  },
  {
    id: 13,
    type: 'image',
    author: 'Sophie Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    university: 'Penn',
    year: '2023',
    content: 'Just opened my dream coffee shop! Thank you to all the alumni who supported me on this journey. Come visit! ☕️',
    media: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
    likes: 445,
    comments: 71,
    time: '1d ago',
  },
  {
    id: 14,
    type: 'job',
    author: 'Lisa Thompson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    university: 'Brown',
    year: '2018',
    content: 'Our healthcare startup is hiring! Looking for passionate engineers who want to make a difference. Great mission, amazing team.',
    likes: 312,
    comments: 52,
    time: '1d ago',
    jobTitle: 'Full Stack Engineer',
    company: 'HealthTech Solutions',
    location: 'Boston, MA',
  },
  {
    id: 15,
    type: 'video',
    author: 'Ryan Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan',
    university: 'UCLA',
    year: '2020',
    content: 'Behind the scenes of our latest film project! So grateful for the creative community here.',
    thumbnail: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=450&fit=crop',
    videoUrl: 'video3.mp4',
    likes: 589,
    comments: 84,
    time: '2d ago',
  },
]

const mockAds: Ad[] = [
  {
    id: 'ad1',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    title: 'Master Your Career',
    description: 'Professional development courses from top universities',
    link: '#',
  },
  {
    id: 'ad2',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
    title: 'Alumni Travel Program',
    description: 'Exclusive destinations with fellow alumni',
    link: '#',
  },
  {
    id: 'ad3',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop',
    title: 'Invest in Your Future',
    description: 'Financial planning services for alumni',
    link: '#',
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { events } = useEvents();
  const { connections } = useConnections();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<{ id: number; content: string; media?: { type: 'image' | 'video'; url: string } } | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<(Post | Ad)[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 6;
  const nextPostId = useRef(1000); // Start user posts at 1000 to avoid conflicts

  // Combine user posts with mock posts
  const getAllPosts = () => {
    return [...userPosts, ...allMockPosts].sort((a, b) => {
      // Sort by ID descending (newest first)
      return b.id - a.id;
    });
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: any) => {
    setSearchQuery('');
    setShowSearchDropdown(false);

    switch (result.type) {
      case 'post':
        navigate(`/post/${result.id}`, { state: { post: result.data } });
        break;
      case 'user':
        navigate('/profile', { 
          state: { 
            userData: {
              name: result.data.author,
              avatar: result.data.avatar,
              university: result.data.university,
              year: result.data.year,
            }
          } 
        });
        break;
      case 'event':
        navigate('/events');
        break;
      case 'connection':
        navigate('/connections');
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when typing
  useEffect(() => {
    setShowSearchDropdown(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Load more posts
  const loadMorePosts = () => {
    const allPosts = getAllPosts();
    const startIdx = page * POSTS_PER_PAGE;
    const endIdx = startIdx + POSTS_PER_PAGE;
    const newPosts = allPosts.slice(startIdx, endIdx);

    if (newPosts.length === 0) {
      setHasMore(false);
      return;
    }

    // Insert ads every 5-6 posts
    const postsWithAds: (Post | Ad)[] = [];
    newPosts.forEach((post, idx) => {
      postsWithAds.push(post);
      // Add ad after every 5-6 posts
      if ((startIdx + idx + 1) % 6 === 0) {
        const adIndex = Math.floor((startIdx + idx) / 6) % mockAds.length;
        postsWithAds.push(mockAds[adIndex]);
      }
    });

    setDisplayedPosts(prev => [...prev, ...postsWithAds]);
    setPage(prev => prev + 1);
  };

  // Create or edit post
  const handlePostSubmit = (content: string, media: { type: 'image' | 'video'; url: string } | null) => {
    if (editingPost) {
      // Edit existing post
      setUserPosts(prev => prev.map(post => 
        post.id === editingPost.id 
          ? { 
              ...post, 
              content, 
              type: media?.type || 'text',
              media: media?.type === 'image' ? media.url : undefined,
              thumbnail: media?.type === 'video' ? media.url : undefined,
              videoUrl: media?.type === 'video' ? media.url : undefined,
            }
          : post
      ));
      
      // Also update in displayed posts
      setDisplayedPosts(prev => prev.map(item => {
        if ('id' in item && item.id === editingPost.id) {
          return {
            ...item,
            content,
            type: media?.type || 'text',
            media: media?.type === 'image' ? media.url : undefined,
            thumbnail: media?.type === 'video' ? media.url : undefined,
            videoUrl: media?.type === 'video' ? media.url : undefined,
          } as Post;
        }
        return item;
      }));
      
      toast({
        title: 'Post updated!',
        description: 'Your post has been updated successfully',
      });
      setEditingPost(null);
    } else {
      // Create new post
      const newPost: Post = {
        id: nextPostId.current++,
        type: media?.type || 'text',
        author: user?.name || 'You',
        avatar: user?.avatar || '',
        university: user?.university || '',
        year: new Date().getFullYear().toString(),
        content,
        media: media?.type === 'image' ? media.url : undefined,
        thumbnail: media?.type === 'video' ? media.url : undefined,
        videoUrl: media?.type === 'video' ? media.url : undefined,
        likes: 0,
        comments: 0,
        time: 'Just now',
      };
      setUserPosts(prev => [newPost, ...prev]);
      toast({
        title: 'Post created!',
        description: 'Your post has been shared with the network',
      });
      
      // Reset displayed posts to show new post
      setDisplayedPosts([]);
      setPage(0);
      setHasMore(true);
    }
  };

  // Delete post with confirmation
  const handleDeletePost = (postId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Show confirmation
    const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    
    if (confirmed) {
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      setDisplayedPosts(prev => prev.filter(item => !('id' in item && item.id === postId)));
      toast({
        title: 'Post deleted',
        description: 'Your post has been removed',
      });
    }
  };

  // Edit post
  const handleEditPost = (post: Post) => {
    setEditingPost({
      id: post.id,
      content: post.content,
      media: post.media ? { type: 'image', url: post.media } : 
             post.videoUrl ? { type: 'video', url: post.videoUrl } : undefined,
    });
    setIsModalOpen(true);
  };

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop';
    e.currentTarget.alt = 'Image unavailable';
  };

  // Handle avatar error
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>, seed: string) => {
    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  // Navigate to user profile
  const handleProfileClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // If it's the current user's post, go to own profile
    if (post.author === user?.name || post.author === 'You') {
      navigate('/profile');
    } else {
      // For other users, navigate to profile with user data in state
      navigate('/profile', { 
        state: { 
          userData: {
            name: post.author,
            avatar: post.avatar,
            university: post.university,
            year: post.year,
            major: 'Computer Science', // Default, would come from API
          }
        } 
      });
    }
  };

  // Detect and linkify URLs and emails in posts
  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    
    let result = text;
    
    // Replace URLs
    result = result.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80 font-medium" onclick="event.stopPropagation()">${url}</a>`;
    });
    
    // Replace emails
    result = result.replace(emailRegex, (email) => {
      return `<a href="mailto:${email}" class="text-primary underline hover:text-primary/80 font-medium" onclick="event.stopPropagation()">${email}</a>`;
    });
    
    return result;
  };

  // Initial load
  useEffect(() => {
    if (displayedPosts.length === 0 && page === 0) {
      loadMorePosts();
    }
  }, [userPosts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, page, userPosts, searchQuery]);

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCommentAdded = (postId: number) => {
    // Update comment count in displayed posts
    setDisplayedPosts(prev => prev.map(item => {
      if ('id' in item && item.id === postId) {
        return { ...item, comments: item.comments + 1 } as Post;
      }
      return item;
    }));
    
    // Update in user posts if applicable
    setUserPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    ));
  };

  const handleShare = async (post: Post, method: 'copy' | 'facebook' | 'twitter' | 'native') => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `Check out this post by ${post.author}: ${post.content.slice(0, 100)}...`;

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
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
          break;

        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank');
          break;

        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: `Post by ${post.author}`,
              text: shareText,
              url: postUrl,
            });
          } else {
            // Fallback to copy
            await navigator.clipboard.writeText(postUrl);
            toast({
              title: 'Link copied!',
              description: 'Post link copied to clipboard',
            });
          }
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderPost = (post: Post) => {
    const isLiked = likedPosts.has(post.id);
    const displayLikes = isLiked ? post.likes + 1 : post.likes;
    const isUserPost = userPosts.some(p => p.id === post.id);
    const showComments = expandedComments.has(post.id);
    const isCopied = copiedPostId === post.id;

    return (
      <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
        {/* Post Header */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3 flex-1 min-w-0">
              <img
                src={post.avatar}
                alt={post.author}
                onError={(e) => handleAvatarError(e, post.author)}
                onClick={(e) => handleProfileClick(post, e)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full ring-2 ring-primary/10 flex-shrink-0 object-cover cursor-pointer hover:ring-primary/30 transition-all"
                title={`View ${post.author}'s profile`}
              />
              <div className="min-w-0 flex-1">
                <h3 
                  className="font-semibold text-base truncate cursor-pointer hover:underline hover:text-primary transition-colors"
                  onClick={(e) => handleProfileClick(post, e)}
                  title={`View ${post.author}'s profile`}
                >
                  {post.author}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {post.university} '{post.year} • {post.time}
                </p>
              </div>
            </div>
            {isUserPost ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hover:bg-accent">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPost(post);
                    }} 
                    className="gap-2 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Post</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post.id, e);
                    }} 
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Post Type Badge */}
          {(post.type === 'job' || post.type === 'announcement') && (
            <Badge className="mb-3" variant={post.type === 'job' ? 'default' : 'secondary'}>
              {post.type === 'job' && <Briefcase className="w-3 h-3 mr-1.5" />}
              {post.type === 'announcement' && <Megaphone className="w-3 h-3 mr-1.5" />}
              {post.type === 'job' ? 'Job Opportunity' : 'Announcement'}
            </Badge>
          )}

          {/* Job Details */}
          {post.type === 'job' && (
            <div className="mb-4 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-semibold text-base mb-1">{post.jobTitle}</h4>
              <p className="text-sm text-muted-foreground">{post.company} • {post.location}</p>
            </div>
          )}

          {/* Post Content */}
          <div 
            className="text-base leading-relaxed mb-4 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: linkifyText(post.content) }}
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
              loading="lazy"
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
              loading="lazy"
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
              className={`gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 ${isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-600 dark:hover:text-red-400'}`}
              onClick={() => toggleLike(post.id)}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{displayLikes}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 ${showComments ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' : ''}`}
              onClick={() => toggleComments(post.id)}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments}</span>
            </Button>
            
            {/* Share Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 hover:bg-green-100 dark:hover:bg-green-950/50 hover:text-green-600 dark:hover:text-green-400"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => handleShare(post, 'copy')} className="gap-2 cursor-pointer">
                  {isCopied ? (
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
                <DropdownMenuItem onClick={() => handleShare(post, 'facebook')} className="gap-2 cursor-pointer">
                  <Facebook className="w-4 h-4" />
                  <span>Share on Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare(post, 'twitter')} className="gap-2 cursor-pointer">
                  <Twitter className="w-4 h-4" />
                  <span>Share on Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {navigator.share && (
                  <DropdownMenuItem onClick={() => handleShare(post, 'native')} className="gap-2 cursor-pointer">
                    <Share2 className="w-4 h-4" />
                    <span>More options...</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Comment Section */}
        {showComments && (
          <CommentSection
            postId={post.id}
            onCommentAdded={() => handleCommentAdded(post.id)}
          />
        )}
      </Card>
    );
  };

  const renderAd = (ad: Ad) => {
    return (
      <Card key={ad.id} className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-xl transition-all duration-200">
        <div className="relative bg-muted">
          <Badge className="absolute top-4 left-4 z-10 bg-primary text-xs font-semibold shadow-md">Sponsored</Badge>
          <img
            src={ad.image}
            alt={ad.title}
            onError={handleImageError}
            className="w-full h-56 sm:h-72 object-cover"
            loading="lazy"
          />
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="font-bold text-lg sm:text-xl mb-2">{ad.title}</h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{ad.description}</p>
          <Button className="w-full h-11" variant="default" size="lg">
            Learn More
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      
      <main className="min-h-screen pb-20 md:pb-0 md:ml-64">
        {/* Header with Search, Notifications and Theme Toggle */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="max-w-[900px] mx-auto flex items-center gap-2 sm:gap-3">
              {/* Search Bar with Dropdown */}
              <div className="relative flex-1" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search posts, people, events, connections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 pr-4 h-10 sm:h-11 text-sm sm:text-base w-full"
                />
                {showSearchDropdown && (
                  <GlobalSearchDropdown
                    query={searchQuery}
                    posts={getAllPosts()}
                    events={events}
                    connections={connections}
                    onSelect={handleSearchResultSelect}
                    onClose={() => setShowSearchDropdown(false)}
                  />
                )}
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 rounded-full"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>

              {/* Create Post Button */}
              <Button
                onClick={() => setIsModalOpen(true)}
                className="gap-2 h-10 sm:h-11 text-sm font-medium px-3 sm:px-4 flex-shrink-0"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-[900px] mx-auto space-y-4">

            {/* Posts Feed with Ads */}
            {displayedPosts.map((item) => {
              if ('image' in item && 'title' in item) {
                return renderAd(item as Ad);
              }
              return renderPost(item as Post);
            })}

            {/* Loading Indicator */}
            {hasMore && displayedPosts.length > 0 && (
              <div ref={observerTarget} className="py-6 sm:py-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* End of Feed */}
            {!hasMore && displayedPosts.length > 0 && (
              <Card className="p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">You're all caught up! 🎉</p>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Post Modal */}
      <PostModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPost(null);
        }}
        onSubmit={handlePostSubmit}
        editPost={editingPost}
      />

      <MobileNav />
    </div>
  );
};

export default Dashboard;
