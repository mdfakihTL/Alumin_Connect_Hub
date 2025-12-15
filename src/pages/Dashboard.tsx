import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '@/contexts/EventsContext';
import { useConnections } from '@/contexts/ConnectionsContext';
import { postsApi } from '@/api/posts';
import { connectionsApi } from '@/api/connections';
import { universitiesApi } from '@/api/universities';
import { handleApiError } from '@/api/client';
import type { PostResponse, AdResponse, ConnectionResponse } from '@/api/types';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import PostModal from '@/components/PostModal';
import NotificationBell from '@/components/NotificationBell';
import CommentSection from '@/components/CommentSection';
import GlobalSearchDropdown from '@/components/GlobalSearchDropdown';
import UniversityChatbot from '@/components/UniversityChatbot';
import PostFilter, { FilterOptions } from '@/components/PostFilter';
import WorldMapHeatmap from '@/components/WorldMapHeatmap';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Briefcase,
  Megaphone,
  Play,
  PlusCircle,
  Search,
  Moon,
  Sun,
  Edit,
  Trash2,
  Facebook,
  Twitter,
  Copy,
  Check,
  Calendar,
  MapPin,
  Trophy,
  TrendingUp,
  Menu,
  UserPlus2,
  Users2,
  X,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Post {
  id: string;
  type: 'text' | 'image' | 'video' | 'job' | 'announcement';
  author: string;
  authorId: string;
  avatar: string;
  authorTitle?: string;
  authorCompany?: string;
  university: string;
  year: string;
  content: string;
  media?: string;
  videoUrl?: string;
  thumbnail?: string;
  likes: number;
  comments: number;
  time: string;
  isLiked: boolean;
  jobTitle?: string;
  company?: string;
  location?: string;
  tag?:
    | 'success-story'
    | 'career-milestone'
    | 'achievement'
    | 'learning'
    | 'volunteering';
}

interface Ad {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
}

interface SuggestedConnection {
  id: string;
  name: string;
  title?: string;
  university: string;
  year: string;
  image: string;
  mutualConnections: number;
}

// Transform API post to local format
const transformPost = (apiPost: PostResponse): Post => ({
  id: apiPost.id,
  type: apiPost.type,
  author: apiPost.author.name,
  authorId: apiPost.author.id,
  avatar: apiPost.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiPost.author.name}`,
  authorTitle: apiPost.author.title,
  authorCompany: apiPost.author.company,
  university: 'Alumni', // Will be filled from user data
  year: new Date(apiPost.created_at).getFullYear().toString(),
  content: apiPost.content,
  media: apiPost.media_url,
  videoUrl: apiPost.video_url,
  thumbnail: apiPost.thumbnail_url,
  likes: apiPost.likes_count,
  comments: apiPost.comments_count,
  time: apiPost.time,
  isLiked: apiPost.is_liked,
  jobTitle: apiPost.job_title,
  company: apiPost.company,
  location: apiPost.location,
  tag: apiPost.tag as Post['tag'],
});

// Transform API ad to local format  
const transformAd = (apiAd: AdResponse): Ad => ({
  id: apiAd.id,
  image: apiAd.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
  title: apiAd.title,
  description: apiAd.description || '',
  link: apiAd.link || '#',
});

// Transform connection suggestion to local format
const transformSuggestion = (conn: ConnectionResponse): SuggestedConnection => ({
  id: conn.user.id,
  name: conn.user.name,
  title: conn.user.job_title ? `${conn.user.job_title}${conn.user.company ? ` at ${conn.user.company}` : ''}` : undefined,
  university: conn.user.university || 'Alumni',
  year: conn.user.year || '',
  image: conn.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conn.user.name}`,
  mutualConnections: Math.floor(Math.random() * 15) + 1, // API doesn't have this yet, mock it
});

// Fallback ads when API doesn't return any (kept as backup)
const fallbackAds: Ad[] = [
  {
    id: 'ad1',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    title: 'Master Your Career',
    description: 'Professional development courses from top universities',
    link: '#',
  },
  {
    id: 'ad2',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
    title: 'Alumni Travel Program',
    description: 'Exclusive destinations with fellow alumni',
    link: '#',
  },
  {
    id: 'ad3',
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop',
    title: 'Invest in Your Future',
    description: 'Financial planning services for alumni',
    link: '#',
  },
];

// Success Stories Data
const successStories = [
  {
    id: 1,
    name: 'Sarah Chen',
    title: 'CEO at TechVision',
    year: '2015',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahChen',
    story: 'Launched a successful AI startup that was acquired by Google',
    achievement: 'Raised $50M Series B',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    title: 'Award-winning Author',
    year: '2012',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    story: 'Published bestselling book on leadership and innovation',
    achievement: 'NY Times Bestseller',
  },
  {
    id: 3,
    name: 'Dr. Priya Patel',
    title: 'Medical Research Lead',
    year: '2018',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    story: 'Leading groundbreaking cancer research at Johns Hopkins',
    achievement: 'Nobel Prize Nominee',
  },
];

// Fallback Suggested Connections Data (used when API doesn't return data)
const fallbackSuggestedConnections: SuggestedConnection[] = [
  {
    id: 'fallback-1',
    name: 'Alex Rivera',
    title: 'Product Manager at Microsoft',
    university: 'MIT',
    year: '2019',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexRivera',
    mutualConnections: 12,
  },
  {
    id: 'fallback-2',
    name: 'Samantha Lee',
    title: 'UX Designer at Adobe',
    university: 'Stanford',
    year: '2020',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SamanthaLee',
    mutualConnections: 8,
  },
  {
    id: 'fallback-3',
    name: 'James Wilson',
    title: 'Data Scientist at Meta',
    university: 'Berkeley',
    year: '2018',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JamesWilson',
    mutualConnections: 15,
  },
  {
    id: 'fallback-4',
    name: 'Nina Patel',
    title: 'Marketing Lead at Spotify',
    university: 'Harvard',
    year: '2021',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinaPatel',
    mutualConnections: 6,
  },
];

// Compact Ads Data
const compactAds = [
  {
    id: 'compact1',
    title: 'Alumni Career Workshop',
    description: 'Boost your career with expert guidance',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop',
  },
  {
    id: 'compact2',
    title: 'Networking Mixer',
    description: 'Connect with industry leaders',
    image:
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop',
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events } = useEvents();
  const { connections } = useConnections();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<{
    id: string;
    content: string;
    media?: { type: 'image' | 'video'; url: string };
    tag?: string;
  } | null>(null);
  
  // API-fetched data
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>(fallbackAds);
  const [suggestedConnections, setSuggestedConnections] = useState<SuggestedConnection[]>(fallbackSuggestedConnections);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  
  const [displayedPosts, setDisplayedPosts] = useState<(Post | Ad)[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [dismissedEventReminder, setDismissedEventReminder] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    postTypes: [],
    tags: [],
    companies: [],
    universities: [],
    searchText: '',
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 10;

  // Fetch posts from API
  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (!user) return;
    
    setIsLoadingPosts(true);
    setPostsError(null);
    
    try {
      const response = await postsApi.getFeed({
        page: pageNum,
        page_size: POSTS_PER_PAGE,
        type: filters.postTypes.length === 1 ? filters.postTypes[0] : undefined,
        tag: filters.tags.length === 1 ? filters.tags[0] : undefined,
        search: filters.searchText || undefined,
      });
      
      const transformedPosts = response.posts.map(transformPost);
      
      if (append) {
        setPosts(prev => [...prev, ...transformedPosts]);
      } else {
        setPosts(transformedPosts);
      }
      
      setTotalPosts(response.total);
      setHasMore(transformedPosts.length === POSTS_PER_PAGE && pageNum * POSTS_PER_PAGE < response.total);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setPostsError('Failed to load posts');
    } finally {
      setIsLoadingPosts(false);
    }
  }, [user, filters]);

  // Fetch suggested connections from API
  const fetchSuggestions = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await connectionsApi.getSuggestions({ limit: 10 });
      if (response.connections && response.connections.length > 0) {
        setSuggestedConnections(response.connections.map(transformSuggestion));
      }
      // Keep fallback if API returns empty
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      // Keep fallback suggestions on error
    }
  }, [user]);

  // Fetch ads from API
  const fetchAds = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await universitiesApi.getAds(user.universityId);
      if (response && response.length > 0) {
        setAds(response.map(transformAd));
      }
      // Keep fallback if API returns empty
    } catch (err) {
      console.error('Failed to fetch ads:', err);
      // Keep fallback ads on error
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchPosts(1);
      fetchSuggestions();
      fetchAds();
    }
  }, [user, fetchPosts, fetchSuggestions, fetchAds]);

  // Auto-refresh feed every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const refreshInterval = setInterval(() => {
      // Only refresh if we're on the first page and not loading
      if (page === 1 && !isLoadingPosts) {
        fetchPosts(1);
      }
    }, 60000); // 60 seconds
    
    return () => clearInterval(refreshInterval);
  }, [user, page, isLoadingPosts, fetchPosts]);

  // Update displayed posts when posts change
  useEffect(() => {
    // Insert ads every 8 posts
    const postsWithAds: (Post | Ad)[] = [];
    posts.forEach((post, idx) => {
      postsWithAds.push(post);
      if ((idx + 1) % 8 === 0 && ads.length > 0) {
        const adIndex = Math.floor(idx / 8) % ads.length;
        postsWithAds.push(ads[adIndex]);
      }
    });
    setDisplayedPosts(postsWithAds);
  }, [posts, ads]);

  // Apply local filters to posts
  const getFilteredPosts = useCallback(() => {
    let filteredPosts = [...posts];

    // Apply local filters
    if (filters.postTypes.length > 0) {
      filteredPosts = filteredPosts.filter((post) => filters.postTypes.includes(post.type));
    }

    if (filters.tags.length > 0) {
      filteredPosts = filteredPosts.filter(
        (post) => post.tag && filters.tags.includes(post.tag),
      );
    }

    if (filters.companies.length > 0) {
      filteredPosts = filteredPosts.filter(
        (post) => post.company && filters.companies.includes(post.company),
      );
    }

    if (filters.universities.length > 0) {
      filteredPosts = filteredPosts.filter((post) =>
        filters.universities.includes(post.university),
      );
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.content.toLowerCase().includes(searchLower) ||
          post.author.toLowerCase().includes(searchLower) ||
          (post.company && post.company.toLowerCase().includes(searchLower)) ||
          (post.jobTitle && post.jobTitle.toLowerCase().includes(searchLower)),
      );
    }

    return filteredPosts;
  }, [posts, filters]);

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
            },
          },
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
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
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

  // Load more posts from API
  const loadMorePosts = useCallback(() => {
    if (isLoadingPosts || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  }, [isLoadingPosts, hasMore, page, fetchPosts]);

  // Create or edit post via API
  const handlePostSubmit = async (
    content: string,
    media: { type: 'image' | 'video'; url: string } | null,
    tag?: string,
  ) => {
    try {
      if (editingPost) {
        // Edit existing post via API
        const response = await postsApi.updatePost(editingPost.id, {
          content,
          media_url: media?.type === 'image' ? media.url : undefined,
          video_url: media?.type === 'video' ? media.url : undefined,
          thumbnail_url: media?.type === 'video' ? media.url : undefined,
          tag,
        });

        // Update local state
        const updatedPost = transformPost(response);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === editingPost.id ? updatedPost : post
          ),
        );

        toast({
          title: 'Post updated!',
          description: 'Your post has been updated successfully',
        });
        setEditingPost(null);
      } else {
        // Create new post via API
        const response = await postsApi.createPost({
          type: media?.type || 'text',
          content,
          media_url: media?.type === 'image' ? media.url : undefined,
          video_url: media?.type === 'video' ? media.url : undefined,
          thumbnail_url: media?.type === 'video' ? media.url : undefined,
          tag,
        });

        // Add new post to the beginning
        const newPost = transformPost(response);
        setPosts((prev) => [newPost, ...prev]);

        toast({
          title: 'Post created!',
          description: 'Your post has been shared with the network',
        });
      }
    } catch (err) {
      handleApiError(err, editingPost ? 'Failed to update post' : 'Failed to create post');
    }
  };

  // Delete post with confirmation via API
  const handleDeletePost = async (postId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // Show confirmation
    const confirmed = window.confirm(
      'Are you sure you want to delete this post? This action cannot be undone.',
    );

    if (confirmed) {
      try {
        await postsApi.deletePost(postId);
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        toast({
          title: 'Post deleted',
          description: 'Your post has been removed',
        });
      } catch (err) {
        handleApiError(err, 'Failed to delete post');
      }
    }
  };

  // Edit post - check if user owns the post
  const handleEditPost = (post: Post) => {
    // Only allow editing own posts
    if (post.authorId !== user?.id) {
      toast({
        title: 'Cannot edit',
        description: 'You can only edit your own posts',
        variant: 'destructive',
      });
      return;
    }
    
    setEditingPost({
      id: post.id,
      content: post.content,
      media: post.media
        ? { type: 'image', url: post.media }
        : post.videoUrl
        ? { type: 'video', url: post.videoUrl }
        : undefined,
      tag: post.tag,
    });
    setIsModalOpen(true);
  };

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop';
    e.currentTarget.alt = 'Image unavailable';
  };

  // Handle avatar error
  const handleAvatarError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    seed: string,
  ) => {
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
          },
        },
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

  // Handle filter changes - refetch posts
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPosts([]);
    setPage(1);
    setHasMore(true);
  };

  // Refetch when filters change
  useEffect(() => {
    if (user && page === 1) {
      fetchPosts(1, false);
    }
  }, [filters, user]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingPosts) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingPosts, loadMorePosts]);

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    try {
      if (currentlyLiked) {
        await postsApi.unlikePost(postId);
      } else {
        await postsApi.likePost(postId);
      }
      
      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !currentlyLiked,
                likes: currentlyLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
              }
            : post,
        ),
      );
    } catch (err) {
      handleApiError(err, 'Failed to update like');
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCommentAdded = (postId: string) => {
    // Update comment count in posts
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, comments: post.comments + 1 } : post,
      ),
    );
  };

  const handleShare = async (
    post: Post,
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

  // Get tag display info
  const getTagInfo = (tag?: Post['tag']) => {
    if (!tag) return null;

    const tagMap = {
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

    return tagMap[tag];
  };

  const handlePostClick = (post: Post) => {
    navigate(`/post/${post.id}`, { state: { post } });
  };

  const renderPost = (post: Post) => {
    const isLiked = post.isLiked;
    const displayLikes = post.likes;
    const isUserPost = post.authorId === user?.id;
    const showComments = expandedComments.has(post.id);
    const isCopied = copiedPostId === post.id;
    const tagInfo = getTagInfo(post.tag);
    const hasTag = !!tagInfo;

    return (
      <Card
        key={post.id}
        className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
          hasTag
            ? 'ring-1 ' +
              tagInfo.color
                .split(' ')[0]
                .replace('bg-', 'ring-')
                .replace('/10', '/30')
            : ''
        }`}
        onClick={() => handlePostClick(post)}
      >
        {/* Post Header */}
        <div
          className={`p-4 sm:p-5 ${hasTag ? tagInfo.color.split(' ')[0] : ''}`}
        >
          {/* Tag Badge */}
          {hasTag && (
            <div className="mb-3">
              <Badge className={`${tagInfo.color} border font-medium`}>
                <span className="mr-1">{tagInfo.icon}</span>
                {tagInfo.label}
              </Badge>
            </div>
          )}

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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 hover:bg-accent"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48"
                >
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Post Type Badge */}
          {(post.type === 'job' || post.type === 'announcement') && (
            <Badge
              className="mb-3"
              variant={post.type === 'job' ? 'default' : 'secondary'}
            >
              {post.type === 'job' && <Briefcase className="w-3 h-3 mr-1.5" />}
              {post.type === 'announcement' && (
                <Megaphone className="w-3 h-3 mr-1.5" />
              )}
              {post.type === 'job' ? 'Job Opportunity' : 'Announcement'}
            </Badge>
          )}

          {/* Job Details */}
          {post.type === 'job' && (
            <div className="mb-4 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-semibold text-base mb-1">{post.jobTitle}</h4>
              <p className="text-sm text-muted-foreground">
                {post.company} • {post.location}
              </p>
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

        {post.type === 'video' && (post.videoUrl || post.thumbnail) && (
          <div className="w-full bg-muted">
            {post.videoUrl ? (
              <VideoPlayer
                src={post.videoUrl}
                poster={post.thumbnail}
                className="w-full max-h-[450px]"
                muted={true}
              />
            ) : post.thumbnail && (
              <div className="relative w-full group cursor-pointer">
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
          </div>
        )}

        {/* Post Actions */}
        <div
          className="p-4 sm:p-5 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 ${
                isLiked
                  ? 'text-red-500 hover:text-red-600'
                  : 'hover:text-red-600 dark:hover:text-red-400'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(post.id, isLiked);
              }}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{displayLikes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 ${
                showComments
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                  : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleComments(post.id);
              }}
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
                  onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(post, 'copy');
                  }}
                  className="gap-2 cursor-pointer"
                >
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
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(post, 'facebook');
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Share on Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(post, 'twitter');
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Share on Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {navigator.share && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(post, 'native');
                    }}
                    className="gap-2 cursor-pointer"
                  >
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
          <div onClick={(e) => e.stopPropagation()}>
            <CommentSection
              postId={post.id}
              onCommentAdded={() => handleCommentAdded(post.id)}
            />
          </div>
        )}
      </Card>
    );
  };

  const renderAd = (ad: Ad) => {
    return (
      <Card
        key={ad.id}
        className="overflow-hidden border border-primary/10 bg-card hover:shadow-lg transition-all duration-200"
      >
        <div className="relative bg-muted">
          <Badge className="absolute top-3 right-3 z-10 bg-muted/80 text-muted-foreground text-xs font-normal backdrop-blur-sm">
            Sponsored
          </Badge>
          <img
            src={ad.image}
            alt={ad.title}
            onError={handleImageError}
            className="w-full h-48 sm:h-56 object-cover opacity-90"
            loading="lazy"
          />
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="font-semibold text-base sm:text-lg mb-1.5">
            {ad.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
            {ad.description}
          </p>
          <Button
            className="w-full h-9 text-sm"
            variant="outline"
            size="sm"
          >
            Learn More
          </Button>
        </div>
      </Card>
    );
  };

  // Get upcoming events (next 3)
  const upcomingEvents = events
    .filter((event) => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Get today's events
  const todaysEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />

      <main
        className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        {/* Header with Search, Notifications and Theme Toggle */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
              {/* Sidebar Toggle Button - Visible on all screens */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 hover:bg-accent rounded-lg"
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {isSidebarOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    />
                    <line
                      x1="9"
                      y1="3"
                      x2="9"
                      y2="21"
                    />
                    <line
                      x1="14"
                      y1="8"
                      x2="19"
                      y2="8"
                    />
                    <line
                      x1="14"
                      y1="12"
                      x2="19"
                      y2="12"
                    />
                    <line
                      x1="14"
                      y1="16"
                      x2="19"
                      y2="16"
                    />
                  </svg>
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
              {/* Search Bar with Dropdown */}
              <div
                className="relative flex-1 min-w-0"
                ref={searchRef}
              >
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none z-10" />
                <Input
                  type="search"
                  placeholder={isMobile ? "Search..." : "Search posts, people, events, connections..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-9 pr-2 sm:pr-4 h-9 sm:h-10 text-sm sm:text-base w-full"
                />
                {showSearchDropdown && (
                  <GlobalSearchDropdown
                    query={searchQuery}
                    posts={getFilteredPosts()}
                    events={events}
                    connections={connections}
                    onSelect={handleSearchResultSelect}
                    onClose={() => setShowSearchDropdown(false)}
                  />
                )}
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Notification Bell */}
                <NotificationBell />

                {/* Filter Button */}
                <PostFilter
                  onFilterChange={handleFilterChange}
                  activeFilters={filters}
                />

                {/* Theme Toggle - Desktop Only */}
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-lg"
                    title={`Switch to ${
                      theme === 'light' ? 'dark' : 'light'
                    } mode`}
                  >
                    {theme === 'light' ? (
                      <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                )}

                {/* Create Post Button - Desktop Only */}
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="gap-2 h-9 sm:h-10 text-sm font-medium px-3 sm:px-4 hidden md:flex"
                >
                  <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden lg:inline">Create</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area with Sidebar Layout */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 items-start">
              {/* Left Sidebar - Ads & People (hidden on mobile/tablet) */}
              <aside
                className="hidden xl:block xl:w-72 shrink-0 sticky top-24 space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 hide-scrollbar"
                onWheel={(e) => {
                  // ALWAYS stop propagation to prevent feed scroll
                  e.stopPropagation();
                }}
              >
                {/* Compact Ad - TOP POSITION */}
                {compactAds[0] && (
                  <Card className="overflow-hidden border border-border/50 bg-card hover:shadow-md transition-all">
                    <div className="relative">
                      <Badge className="absolute top-2 right-2 z-10 bg-muted/80 text-muted-foreground text-[10px] font-normal backdrop-blur-sm">
                        Sponsored
                      </Badge>
                      <img
                        src={compactAds[0].image}
                        alt={compactAds[0].title}
                        className="w-full h-32 object-cover opacity-90"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1">
                        {compactAds[0].title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {compactAds[0].description}
                      </p>
                      <Button
                        className="w-full h-7 text-xs"
                        variant="outline"
                        size="sm"
                      >
                        Learn More
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Suggested Connections */}
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <div className="flex items-center gap-2">
                      <Users2 className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-base">Connect</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suggested for you
                    </p>
                  </div>
                  <div
                    className="divide-y divide-border max-h-[280px] overflow-y-auto subtle-scrollbar"
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {suggestedConnections.slice(0, 3).map((person) => (
                      <div
                        key={person.id}
                        className="p-2 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex gap-2">
                          <img
                            src={person.image}
                            alt={person.name}
                            className="w-10 h-10 rounded-full flex-shrink-0 ring-2 ring-primary/20"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs truncate">
                              {person.name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {person.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {person.mutualConnections} mutual
                            </p>
                            <Button
                              size="sm"
                              className="mt-1 h-6 text-[10px] w-full px-2"
                              onClick={() => {
                                toast({
                                  title: 'Connection request sent!',
                                  description: `Your request to connect with ${person.name} has been sent`,
                                });
                              }}
                            >
                              <UserPlus2 className="w-3 h-3 mr-1" />
                              Connect
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[10px] h-7"
                      onClick={() => navigate('/connections')}
                    >
                      View More
                    </Button>
                  </div>
                </Card>
              </aside>

              {/* Main Feed - Center Column */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Mobile AI Assistant - Shows at top on mobile/tablet */}
                <div className="lg:hidden">
                  <UniversityChatbot />
                </div>

                {/* Today's Event Reminder */}
                {!dismissedEventReminder && todaysEvents.length > 0 && (
                  <Card className="overflow-hidden border-2 border-blue-500/50 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 shadow-lg">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-blue-500 text-white">
                                Today's Event
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Happening now!
                              </span>
                            </div>
                            <h3 className="font-bold text-lg mb-1">
                              {todaysEvents[0].title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{todaysEvents[0].location}</span>
                              </div>
                              <Badge variant="secondary">
                                {todaysEvents[0].category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {todaysEvents[0].description}
                            </p>
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() => navigate('/events')}
                            >
                              View Event Details
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDismissedEventReminder(true)}
                          className="h-8 w-8 flex-shrink-0 hover:bg-blue-500/20"
                          title="Dismiss reminder"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Mobile-only: Show connections at top on small screens */}
                <div className="xl:hidden">
                  <Card className="overflow-hidden">
                    <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                      <div className="flex items-center gap-2">
                        <Users2 className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-base">
                          People to Connect
                        </h2>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expand your network
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                      {suggestedConnections.slice(0, 4).map((person) => (
                        <div
                          key={person.id}
                          className="flex gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <img
                            src={person.image}
                            alt={person.name}
                            className="w-12 h-12 rounded-full flex-shrink-0 ring-2 ring-primary/20"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {person.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {person.title}
                            </p>
                            <Button
                              size="sm"
                              className="mt-2 h-7 text-xs w-full"
                              onClick={() => {
                                toast({
                                  title: 'Connection request sent!',
                                  description: `Your request to connect with ${person.name} has been sent`,
                                });
                              }}
                            >
                              <UserPlus2 className="w-3 h-3 mr-1" />
                              Connect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigate('/connections')}
                      >
                        View More Suggestions
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Mobile-only: Global Alumni Distribution */}
                {user?.universityId && (
                  <div className="lg:hidden">
                    <WorldMapHeatmap 
                      universityId={user.universityId}
                      title="Global Alumni Distribution"
                      height="400px"
                    />
                  </div>
                )}

                {/* Posts Feed */}
                {/* Initial Loading State */}
                {isLoadingPosts && displayedPosts.length === 0 && (
                  <Card className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading posts...</p>
                  </Card>
                )}

                {/* Error State */}
                {postsError && displayedPosts.length === 0 && (
                  <Card className="p-6 text-center">
                    <p className="text-destructive mb-4">{postsError}</p>
                    <Button onClick={() => fetchPosts(1)} variant="outline">
                      Try Again
                    </Button>
                  </Card>
                )}

                {/* Posts Feed with Ads */}
                {displayedPosts.map((item) => {
                  if ('image' in item && 'title' in item) {
                    return renderAd(item as Ad);
                  }
                  return renderPost(item as Post);
                })}

                {/* Loading More Indicator */}
                {hasMore && displayedPosts.length > 0 && (
                  <div
                    ref={observerTarget}
                    className="py-6 sm:py-8 text-center"
                  >
                    {isLoadingPosts ? (
                      <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <p className="text-muted-foreground text-sm">Scroll for more</p>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingPosts && !postsError && displayedPosts.length === 0 && (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">No posts to show yet. Be the first to share something!</p>
                    <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  </Card>
                )}

                {/* End of Feed */}
                {!hasMore && displayedPosts.length > 0 && (
                  <Card className="p-4 sm:p-6 text-center">
                    <p className="text-sm sm:text-base text-muted-foreground">
                      You're all caught up! 🎉
                    </p>
                  </Card>
                )}
              </div>

              {/* Right Sidebar - Ads, AI Assistant & Content */}
              <aside
                className="hidden lg:block lg:w-80 xl:w-96 shrink-0 sticky top-24 space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto pl-2 hide-scrollbar"
                onWheel={(e) => {
                  // ALWAYS stop propagation to prevent feed scroll
                  e.stopPropagation();
                }}
              >
                {/* Compact Ad 2 - TOP POSITION */}
                {compactAds[1] && (
                  <Card className="overflow-hidden border border-border/50 bg-card hover:shadow-md transition-all">
                    <div className="relative">
                      <Badge className="absolute top-2 right-2 z-10 bg-muted/80 text-muted-foreground text-[10px] font-normal backdrop-blur-sm">
                        Sponsored
                      </Badge>
                      <img
                        src={compactAds[1].image}
                        alt={compactAds[1].title}
                        className="w-full h-32 object-cover opacity-90"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1">
                        {compactAds[1].title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {compactAds[1].description}
                      </p>
                      <Button
                        className="w-full h-7 text-xs"
                        variant="outline"
                        size="sm"
                      >
                        Learn More
                      </Button>
                    </div>
                  </Card>
                )}

                {/* University AI Assistant */}
                <UniversityChatbot />

                {/* Global Alumni Distribution */}
                {user?.universityId && (
                  <div className="hidden lg:block">
                    <WorldMapHeatmap 
                      universityId={user.universityId}
                      title="Global Alumni Distribution"
                      height="400px"
                    />
                  </div>
                )}

                {/* Success Stories */}
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      <h2 className="font-bold text-lg">Success Stories</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inspiring alumni achievements
                    </p>
                  </div>
                  <div
                    className="divide-y divide-border max-h-[300px] overflow-y-auto subtle-scrollbar"
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {successStories.map((story) => (
                      <div
                        key={story.id}
                        className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <img
                            src={story.image}
                            alt={story.name}
                            className="w-12 h-12 rounded-full flex-shrink-0 ring-2 ring-primary/20"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {story.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {story.title}
                            </p>
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs"
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {story.achievement}
                            </Badge>
                            <p className="text-xs mt-2 text-muted-foreground line-clamp-2">
                              {story.story}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                    >
                      View All Stories
                    </Button>
                  </div>
                </Card>

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-lg">Upcoming Events</h2>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Don't miss these events
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => navigate('/events')}
                          className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex gap-3">
                            {event.image && (
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-1">
                                {event.title}
                              </h3>
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(event.date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </div>
                              <Badge
                                variant="secondary"
                                className="mt-2 text-xs"
                              >
                                {event.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigate('/events')}
                      >
                        View All Events
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Compact Ad 2 */}
                {compactAds[1] && (
                  <Card className="overflow-hidden border border-border/50 bg-card hover:shadow-md transition-all">
                    <div className="relative">
                      <Badge className="absolute top-2 right-2 z-10 bg-muted/80 text-muted-foreground text-[10px] font-normal backdrop-blur-sm">
                        Sponsored
                      </Badge>
                      <img
                        src={compactAds[1].image}
                        alt={compactAds[1].title}
                        className="w-full h-32 object-cover opacity-90"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1">
                        {compactAds[1].title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {compactAds[1].description}
                      </p>
                      <Button
                        className="w-full h-7 text-xs"
                        variant="outline"
                        size="sm"
                      >
                        Learn More
                      </Button>
                    </div>
                  </Card>
                )}
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button - Mobile Only */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all md:hidden"
        size="icon"
        title="Create Post"
      >
        <PlusCircle className="w-6 h-6" />
      </Button>

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
