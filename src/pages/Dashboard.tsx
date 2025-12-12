import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '@/contexts/EventsContext';
import { useConnections } from '@/contexts/ConnectionsContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import PostModal from '@/components/PostModal';
import NotificationBell from '@/components/NotificationBell';
import CommentSection from '@/components/CommentSection';
import GlobalSearchDropdown from '@/components/GlobalSearchDropdown';
import UniversityChatbot from '@/components/UniversityChatbot';
import PostFilter, { FilterOptions } from '@/components/PostFilter';
import { PostTag } from '@/types/feed';
import WorldMapHeatmap from '@/components/WorldMapHeatmap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { feedService } from '@/services/feedService';
import { ApiPost, PostMedia } from '@/types/feed';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Briefcase,
  Megaphone,
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

// Frontend tag format (kebab-case for display)
type FrontendTag = 'success-story' | 'career-milestone' | 'achievement' | 'learning' | 'volunteering';

// Mapping between API tags and frontend tags
const apiToFrontendTag: Record<PostTag, FrontendTag> = {
  'success_story': 'success-story',
  'career_milestone': 'career-milestone',
  'achievement': 'achievement',
  'learning_journey': 'learning',
  'volunteering': 'volunteering',
};

const frontendToApiTag: Record<FrontendTag, PostTag> = {
  'success-story': 'success_story',
  'career-milestone': 'career_milestone',
  'achievement': 'achievement',
  'learning': 'learning_journey',
  'volunteering': 'volunteering',
};

// Extended Post type for frontend display
interface Post {
  id: number;
  type: 'text' | 'image' | 'video' | 'job' | 'announcement';
  author: string;
  avatar: string;
  university: string;
  universityId?: number;
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
  tag?: FrontendTag;
  apiTag?: PostTag; // Original API tag
  // API fields
  author_id?: number;
  user_liked?: boolean;
  isFromApi?: boolean;
  // API media attachments
  apiMedia?: PostMedia[];
}

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

// Helper to get API base URL for media
const getMediaUrl = (url: string): string => {
  // If it's a relative URL, prepend the API base URL
  if (url.startsWith('/media/')) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alumni-portal-yw7q.onrender.com';
    return `${API_BASE_URL}${url}`;
  }
  return url;
};

// Convert API post to frontend Post format
const mapApiPostToPost = (apiPost: ApiPost): Post => {
  // Determine post type and media URLs from API media attachments
  let type: Post['type'] = 'text';
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

  return {
    id: apiPost.id,
    type,
    author: apiPost.author_name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiPost.author_name.replace(/\s+/g, '')}`,
    university: apiPost.university_name,
    universityId: apiPost.university_id,
    year: new Date(apiPost.created_at).getFullYear().toString(),
    content: apiPost.content,
    media,
    videoUrl,
    thumbnail,
    likes: apiPost.likes_count,
    comments: apiPost.comments_count,
    time: formatRelativeTime(apiPost.created_at),
    tag: apiPost.tag ? apiToFrontendTag[apiPost.tag] : undefined,
    apiTag: apiPost.tag,
    author_id: apiPost.author_id,
    user_liked: apiPost.user_liked,
    isFromApi: true,
    apiMedia: apiPost.media,
  };
};

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
    type: 'text',
    author: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    university: 'MIT',
    year: '2020',
    content:
      "After 5 years of hard work, I'm thrilled to announce that I've been promoted to VP of Engineering at TechCorp! This journey taught me that persistence and continuous learning are key. Thank you to everyone who supported me along the way! 🚀",
    likes: 456,
    comments: 78,
    time: '1h ago',
    tag: 'career-milestone',
  },
  {
    id: 2,
    type: 'image',
    author: 'Michael Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    university: 'Stanford',
    year: '2019',
    content:
      "Incredibly proud to share that our startup just raised $10M in Series A funding! From a dorm room idea to a team of 50 - it's been an amazing journey. Thank you to our investors, team, and especially our early users who believed in our vision! 🎉",
    media:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
    likes: 892,
    comments: 124,
    time: '3h ago',
    tag: 'success-story',
  },
  {
    id: 3,
    type: 'text',
    author: 'Emily Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    university: 'Harvard',
    year: '2021',
    content:
      'Completed my Machine Learning specialization from Stanford Online! 6 months of late nights and weekend study sessions paid off. Key takeaway: never stop learning, and AI is transforming every industry. Already applying these skills in my current role! 📚💻',
    likes: 234,
    comments: 45,
    time: '5h ago',
    tag: 'learning',
  },
  {
    id: 4,
    type: 'image',
    author: 'David Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    university: 'Berkeley',
    year: '2018',
    content:
      'Spent an amazing weekend volunteering at the local food bank with other alumni! Together we packed 2,000 meals for families in need. Small actions create big impact. Who wants to join us next month? ❤️🤝',
    media:
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop',
    likes: 567,
    comments: 89,
    time: '8h ago',
    tag: 'volunteering',
  },
  {
    id: 5,
    type: 'text',
    author: 'Jessica Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    university: 'Yale',
    year: '2022',
    content:
      'Thrilled to announce that I won the National Innovation Award for my research on sustainable energy! This recognition means the world to me. Grateful to my professors, lab mates, and family for their unwavering support. Science for a better tomorrow! ⭐🔬',
    likes: 678,
    comments: 92,
    time: '10h ago',
    tag: 'achievement',
  },
  {
    id: 6,
    type: 'job',
    author: 'Robert Taylor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    university: 'Princeton',
    year: '2017',
    content:
      "We're expanding! Looking for talented Product Managers to join our fintech startup. Remote-friendly, competitive salary, and equity options.",
    likes: 198,
    comments: 41,
    time: '12h ago',
    jobTitle: 'Product Manager',
    company: 'FinTech Innovations',
    location: 'Remote / NYC',
  },
  {
    id: 7,
    type: 'video',
    author: 'Amanda Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda',
    university: 'Cornell',
    year: '2020',
    content:
      'My TEDx talk on sustainable business practices is now live! Would love to hear your thoughts.',
    thumbnail:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop',
    videoUrl: 'video2.mp4',
    likes: 523,
    comments: 67,
    time: '14h ago',
  },
  {
    id: 8,
    type: 'image',
    author: 'Lisa Chang',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LisaChang',
    university: 'Columbia',
    year: '2020',
    content:
      'Officially certified as a Google Cloud Architect! The exam was tough, but totally worth it. Next up: AWS Solutions Architect. The cloud journey continues! ☁️💪',
    media:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
    likes: 423,
    comments: 67,
    time: '16h ago',
    tag: 'achievement',
  },
  {
    id: 9,
    type: 'text',
    author: 'Chris Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris',
    university: 'Columbia',
    year: '2019',
    content:
      "Reflecting on 5 years since graduation. The connections I've made through our alumni network have been invaluable. Grateful for this community! 💙",
    likes: 421,
    comments: 54,
    time: '18h ago',
  },
  {
    id: 10,
    type: 'text',
    author: 'Maria Garcia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    university: 'Duke',
    year: '2021',
    content:
      "Just joined Habitat for Humanity's board of directors! Excited to contribute to building homes and hope in our community. If you're passionate about affordable housing, let's connect! 🏠",
    likes: 387,
    comments: 48,
    time: '18h ago',
    tag: 'volunteering',
  },
  {
    id: 11,
    type: 'image',
    author: 'Alex Thompson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexThompson',
    university: 'Northwestern',
    year: '2019',
    content:
      'From Junior Developer to Engineering Manager in 3 years! The secret? Investing in people skills as much as technical skills. Leadership is a journey, not a destination. Grateful for amazing mentors! 🌟',
    media:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    likes: 512,
    comments: 76,
    time: '20h ago',
    tag: 'career-milestone',
  },
  {
    id: 12,
    type: 'announcement',
    author: 'Career Services',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Career',
    university: 'University',
    year: 'Official',
    content:
      '📢 Virtual Career Fair next month! Connect with 100+ top employers. All alumni welcome. Registration opens Monday!',
    likes: 712,
    comments: 103,
    time: '1d ago',
  },
  {
    id: 13,
    type: 'image',
    author: 'Sophie Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    university: 'Penn',
    year: '2023',
    content:
      'Just opened my dream coffee shop! Thank you to all the alumni who supported me on this journey. Come visit! ☕️',
    media:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
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
    content:
      'Our healthcare startup is hiring! Looking for passionate engineers who want to make a difference. Great mission, amazing team.',
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
    content:
      'Behind the scenes of our latest film project! So grateful for the creative community here.',
    thumbnail:
      'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=450&fit=crop',
    videoUrl: 'video3.mp4',
    likes: 589,
    comments: 84,
    time: '2d ago',
  },
];

const mockAds: Ad[] = [
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

// Suggested Connections Data
const suggestedConnections = [
  {
    id: 1,
    name: 'Alex Rivera',
    title: 'Product Manager at Microsoft',
    university: 'MIT',
    year: '2019',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexRivera',
    mutualConnections: 12,
  },
  {
    id: 2,
    name: 'Samantha Lee',
    title: 'UX Designer at Adobe',
    university: 'Stanford',
    year: '2020',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SamanthaLee',
    mutualConnections: 8,
  },
  {
    id: 3,
    name: 'James Wilson',
    title: 'Data Scientist at Meta',
    university: 'Berkeley',
    year: '2018',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JamesWilson',
    mutualConnections: 15,
  },
  {
    id: 4,
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
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events } = useEvents();
  const { connections } = useConnections();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<{
    id: number;
    content: string;
    existingMedia?: { id: number; type: 'image' | 'video'; url: string; postId: number }[];
    tag?: PostTag;
  } | null>(null);
  const [apiPosts, setApiPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<(Post | Ad)[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set()); // Track posts being liked
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );
  const [copiedPostId, setCopiedPostId] = useState<number | null>(null);
  const [dismissedEventReminder, setDismissedEventReminder] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    postTypes: [],
    tags: [],
    universities: [],
  });
  const [totalPages, setTotalPages] = useState(1);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 20;

  // Fetch posts from API
  const fetchPosts = useCallback(async (pageNum: number, reset: boolean = false, currentFilters?: FilterOptions) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    // Use provided filters or current state
    const activeFilters = currentFilters || filters;

    try {
      const response = await feedService.listPosts({
        page: pageNum,
        page_size: POSTS_PER_PAGE,
        // University filter from API - use first selected or user's university
        university_id: activeFilters.universities.length > 0 
          ? activeFilters.universities[0] 
          : user?.universityId,
        // Tag filter from API - use first selected tag (API only supports single tag)
        tag: activeFilters.tags.length > 0 ? activeFilters.tags[0] : undefined,
      });

      const mappedPosts = response.posts.map(mapApiPostToPost);
      
      // Initialize liked posts from API response
      const initialLikedPosts = new Set<number>();
      response.posts.forEach(post => {
        if (post.user_liked) {
          initialLikedPosts.add(post.id);
        }
      });
      
      if (reset) {
        setApiPosts(mappedPosts);
        setLikedPosts(initialLikedPosts);
      } else {
        setApiPosts(prev => [...prev, ...mappedPosts]);
        setLikedPosts(prev => new Set([...prev, ...initialLikedPosts]));
      }
      
      setTotalPages(response.total_pages);
      setHasMore(pageNum < response.total_pages);
      setPage(pageNum);
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
      setIsInitialLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.universityId, toast]);

  // Get all posts with filters applied (combines API posts with mock posts as fallback)
  const getAllPosts = useCallback(() => {
    let posts = apiPosts.length > 0 ? [...apiPosts] : [...allMockPosts];

    // Apply client-side filters (post type filtering is client-side only)
    if (filters.postTypes.length > 0) {
      posts = posts.filter((post) => filters.postTypes.includes(post.type));
    }

    // Tag filtering - API posts use apiTag, mock posts use frontend tag format
    if (filters.tags.length > 0) {
      posts = posts.filter((post) => {
        if (post.apiTag) {
          // API post - check against apiTag
          return filters.tags.includes(post.apiTag);
        } else if (post.tag) {
          // Mock post - convert frontend tag to API format and check
          const apiTag = frontendToApiTag[post.tag];
          return apiTag && filters.tags.includes(apiTag);
        }
        return false;
      });
    }

    // University filtering - use university ID for API posts
    if (filters.universities.length > 0) {
      posts = posts.filter((post) => {
        if (post.universityId) {
          return filters.universities.includes(post.universityId);
        }
        // Fallback for mock posts (not ideal, but maintains compatibility)
        return false;
      });
    }

    return posts;
  }, [apiPosts, filters]);

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
    if (isLoading || !hasMore) return;
    fetchPosts(page + 1);
  }, [isLoading, hasMore, page, fetchPosts]);

  // Update displayed posts when API posts change
  useEffect(() => {
    const allPosts = getAllPosts();
    
    // Insert ads every 8 posts (less intrusive)
    const postsWithAds: (Post | Ad)[] = [];
    allPosts.forEach((post, idx) => {
      postsWithAds.push(post);
      // Add ad after every 8 posts (less intrusive)
      if ((idx + 1) % 8 === 0) {
        const adIndex = Math.floor(idx / 8) % mockAds.length;
        postsWithAds.push(mockAds[adIndex]);
      }
    });

    setDisplayedPosts(postsWithAds);
  }, [getAllPosts]);

  // Create or edit post via API with media upload
  const handlePostSubmit = async (
    content: string,
    mediaFiles: File[],
    tag?: PostTag,
  ) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create posts',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingPost(true);

    try {
      if (editingPost) {
        // Edit existing post via API - include tag in the update
        const updatedPost = await feedService.updatePost(editingPost.id, { 
          content,
          tag: tag || undefined,
        });

        // Upload new media files if any
        let uploadedMedia: PostMedia[] = [];
        if (mediaFiles.length > 0) {
          try {
            uploadedMedia = await feedService.uploadMultipleMedia(
              editingPost.id,
              mediaFiles,
              (progress) => {
                // Could show progress in UI if needed
                console.log('Upload progress:', progress);
              }
            );
          } catch (uploadErr) {
            console.error('Media upload failed:', uploadErr);
            toast({
              title: 'Media upload failed',
              description: 'Post was updated but some media failed to upload',
              variant: 'destructive',
            });
          }
        }

        // Re-fetch the post to get updated media
        const refreshedPost = await feedService.getPost(editingPost.id);
        
        // Update the post in local state with refreshed data
        setApiPosts((prev) =>
          prev.map((post) =>
            post.id === editingPost.id
              ? mapApiPostToPost(refreshedPost)
              : post,
          ),
        );

        toast({
          title: 'Post updated!',
          description: 'Your post has been updated successfully',
        });
        setEditingPost(null);
      } else {
        // Create new post via API - include tag
        const createdPost = await feedService.createPost({ 
          content,
          tag: tag || undefined,
        });

        // Upload media files if any
        let uploadedMedia: PostMedia[] = [];
        if (mediaFiles.length > 0) {
          try {
            uploadedMedia = await feedService.uploadMultipleMedia(
              createdPost.id,
              mediaFiles,
              (progress) => {
                // Could show progress in UI if needed
                console.log('Upload progress:', progress);
              }
            );
          } catch (uploadErr) {
            console.error('Media upload failed:', uploadErr);
            toast({
              title: 'Media upload partially failed',
              description: 'Post was created but some media failed to upload',
              variant: 'destructive',
            });
          }
        }

        // Create the new post with uploaded media
        const firstMedia = uploadedMedia[0];
        const newPost: Post = {
          ...mapApiPostToPost(createdPost),
          // Update type and media based on uploaded files
          type: firstMedia 
            ? (firstMedia.media_type === 'image' ? 'image' : 'video') 
            : 'text',
          media: firstMedia?.media_type === 'image' 
            ? getMediaUrl(firstMedia.media_url) 
            : undefined,
          videoUrl: firstMedia?.media_type === 'video' 
            ? getMediaUrl(firstMedia.media_url) 
            : undefined,
          thumbnail: firstMedia?.thumbnail_url 
            ? getMediaUrl(firstMedia.thumbnail_url) 
            : undefined,
          apiMedia: uploadedMedia.length > 0 ? uploadedMedia : undefined,
          // Override tag from mapApiPostToPost if we have a local tag
          tag: tag ? apiToFrontendTag[tag] : (createdPost.tag ? apiToFrontendTag[createdPost.tag] : undefined),
          apiTag: tag || createdPost.tag,
        };
        
        setApiPosts((prev) => [newPost, ...prev]);
        
        toast({
          title: 'Post created!',
          description: mediaFiles.length > 0 
            ? 'Your post with media has been shared with the network'
            : 'Your post has been shared with the network',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save post';
      toast({
        title: editingPost ? 'Failed to update post' : 'Failed to create post',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Delete post with confirmation via API
  const handleDeletePost = async (postId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // Show confirmation
    const confirmed = window.confirm(
      'Are you sure you want to delete this post? This action cannot be undone.',
    );

    if (!confirmed) return;

    setIsDeletingPost(postId);

    try {
      await feedService.deletePost(postId);
      
      // Remove from local state
      setApiPosts((prev) => prev.filter((post) => post.id !== postId));
      
      toast({
        title: 'Post deleted',
        description: 'Your post has been removed',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete post';
      toast({
        title: 'Failed to delete post',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeletingPost(null);
    }
  };

  // Edit post - only allow editing own posts
  const handleEditPost = (post: Post) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to edit posts',
        variant: 'destructive',
      });
      return;
    }

    // Use apiTag if available, otherwise convert frontend tag to API format
    const tagForEdit = post.apiTag || (post.tag ? frontendToApiTag[post.tag] : undefined);

    // Convert API media to the format expected by PostModal
    const existingMedia = post.apiMedia?.map(m => ({
      id: m.id,
      type: m.media_type as 'image' | 'video',
      url: getMediaUrl(m.media_url),
      postId: post.id,
    }));

    setEditingPost({
      id: post.id,
      content: post.content,
      existingMedia,
      tag: tagForEdit,
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

  // Handle filter changes - refetch from API with new filters
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Reset and refetch with new filters
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true, newFilters);
  };

  // Initial load
  useEffect(() => {
    fetchPosts(1, true);
  }, []);


  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMorePosts]);

  // Toggle like via API
  const toggleLike = async (postId: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to like posts',
        variant: 'destructive',
      });
      return;
    }

    // Prevent double-clicking
    if (likingPosts.has(postId)) return;

    setLikingPosts(prev => new Set(prev).add(postId));

    // Optimistic update
    const wasLiked = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    // Update like count optimistically
    setApiPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likes: post.likes + (wasLiked ? -1 : 1) }
          : post,
      ),
    );

    try {
      const response = await feedService.toggleLike(postId);
      
      // Verify the response matches our optimistic update
      if (response.liked !== !wasLiked) {
        // Server state differs, revert to server state
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (response.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
      }
    } catch (err) {
      // Revert optimistic update on error
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      setApiPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: post.likes + (wasLiked ? 1 : -1) }
            : post,
        ),
      );

      const errorMessage = err instanceof Error ? err.message : 'Failed to update like';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const toggleComments = (postId: number) => {
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

  const handleCommentAdded = (postId: number) => {
    // Update comment count in API posts
    setApiPosts((prev) =>
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
    const isLiked = likedPosts.has(post.id);
    const displayLikes = post.likes;
    // Check if user owns this post (by author_id or author name match)
    const isUserPost = (post.author_id && user?.id && String(post.author_id) === user.id) || 
                       post.author === user?.name || 
                       post.author === 'You';
    const showComments = expandedComments.has(post.id);
    const isCopied = copiedPostId === post.id;
    const tagInfo = getTagInfo(post.tag);
    const hasTag = !!tagInfo;
    const isLiking = likingPosts.has(post.id);
    const isDeleting = isDeletingPost === post.id;

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

        {post.type === 'video' && post.videoUrl && (
          <div className="relative w-full bg-muted">
            <video
              src={post.videoUrl}
              poster={post.thumbnail}
              className="w-full object-cover max-h-[450px]"
              controls
              preload="metadata"
              onClick={(e) => e.stopPropagation()}
            >
              Your browser does not support the video tag.
            </video>
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
                      toggleLike(post.id);
                    }}
                    disabled={isLiking}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
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
                    posts={getAllPosts()}
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
                {/* Error State */}
                {error && !isInitialLoading && (
                  <Card className="p-6 text-center border-destructive">
                    <div className="text-destructive mb-4">
                      <svg
                        className="w-12 h-12 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <p className="font-medium">Failed to load posts</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                    <Button onClick={() => fetchPosts(1, true)} variant="outline">
                      Try Again
                    </Button>
                  </Card>
                )}

                {/* Loading Skeleton */}
                {isInitialLoading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-5">
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
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <div className="flex gap-4 mt-4">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Posts Feed with Ads */}
                {!isInitialLoading && !error && displayedPosts.map((item) => {
                  if ('image' in item && 'title' in item) {
                    return renderAd(item as Ad);
                  }
                  return renderPost(item as Post);
                })}

                {/* Loading Indicator */}
                {hasMore && displayedPosts.length > 0 && !isInitialLoading && (
                  <div
                    ref={observerTarget}
                    className="py-6 sm:py-8 text-center"
                  >
                    {isLoading ? (
                      <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <p className="text-sm text-muted-foreground">Scroll for more</p>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!isInitialLoading && !error && displayedPosts.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="text-muted-foreground">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <p className="text-lg font-medium mb-2">No posts yet</p>
                      <p className="text-sm mb-4">Be the first to share something with the community!</p>
                      {isAuthenticated && (
                        <Button onClick={() => setIsModalOpen(true)}>
                          Create Post
                        </Button>
                      )}
                    </div>
                  </Card>
                )}

                {/* End of Feed */}
                {!hasMore && displayedPosts.length > 0 && !isInitialLoading && (
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
        isSubmitting={isCreatingPost}
      />

      <MobileNav />
    </div>
  );
};

export default Dashboard;
