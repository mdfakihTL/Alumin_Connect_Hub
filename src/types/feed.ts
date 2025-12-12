// Post Media types - for images and videos
export type MediaType = 'image' | 'video';

export interface PostMedia {
  id: number;
  post_id: number;
  media_type: MediaType;
  file_name: string;
  file_size: number;
  mime_type: string;
  media_url: string;
  order: number;
  thumbnail_url: string | null;
}

// Upload media response
export interface UploadMediaResponse extends PostMedia {}

// Media upload state for tracking upload progress
export interface MediaUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  mediaData?: PostMedia;
}

// Supported file formats
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Comment interface from API
export interface ApiComment {
  id: number;
  content: string;
  post_id: number;
  author_id: number;
  author_name: string;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;
}

// Like interface from API
export interface ApiLike {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  created_at: string;
}

// Post status types
export type PostStatus = 'active' | 'deleted' | 'hidden';

// Post tag types (API values)
export type PostTag = 'success_story' | 'career_milestone' | 'achievement' | 'learning_journey' | 'volunteering';

// Post interface from API
export interface ApiPost {
  id: number;
  content: string;
  author_id: number;
  author_name: string;
  university_id: number;
  university_name: string;
  status: PostStatus;
  is_pinned: boolean;
  tag?: PostTag;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  created_at: string;
  updated_at: string;
  comments: ApiComment[];
  likes: ApiLike[];
  media?: PostMedia[]; // Media attachments (images/videos)
}

// Paginated posts response
export interface PostsListResponse {
  posts: ApiPost[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Create post request
export interface CreatePostRequest {
  content: string;
  tag?: PostTag;
}

// Update post request
export interface UpdatePostRequest {
  content?: string;
  tag?: PostTag;
}

// Add comment request
export interface AddCommentRequest {
  content: string;
}

// Toggle like response
export interface ToggleLikeResponse {
  liked: boolean;
  message: string;
}

// Query params for listing posts
export interface ListPostsParams {
  page?: number;
  page_size?: number;
  university_id?: number;
  tag?: PostTag;
}

// Admin-specific query params for listing posts
export interface AdminListPostsParams extends ListPostsParams {
  status_filter?: PostStatus;
  search?: string;
}

// Admin hide post response
export interface AdminHidePostResponse {
  message: string;
  post_id: number;
}

// Admin restore post response
export interface AdminRestorePostResponse {
  message: string;
  post_id: number;
}

// Admin pin/unpin post response
export interface AdminPinPostResponse {
  message: string;
  post_id: number;
  is_pinned: boolean;
}

// Frontend Post type (extended for UI)
export interface Post extends ApiPost {
  // Additional frontend-specific fields for display
  author_avatar?: string;
  type?: 'text' | 'image' | 'video' | 'job' | 'announcement';
  media?: string;
  videoUrl?: string;
  thumbnail?: string;
  time?: string; // Human-readable time
  tag?: 'success-story' | 'career-milestone' | 'achievement' | 'learning' | 'volunteering';
  jobTitle?: string;
  company?: string;
  location?: string;
}

// Frontend Comment type (extended for UI)
export interface Comment extends ApiComment {
  author_avatar?: string;
  time?: string; // Human-readable time
}

// Filter options from API
export interface TagOption {
  value: PostTag;
  label: string;
}

export interface UniversityOption {
  id: number;
  name: string;
}

export interface FilterOptionsResponse {
  tags: TagOption[];
  universities: UniversityOption[];
}
