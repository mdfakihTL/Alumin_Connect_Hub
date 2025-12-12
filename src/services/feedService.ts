import { apiClient, apiFileUpload, apiDelete, API_ENDPOINTS } from '@/lib/api';
import {
  ApiPost,
  ApiComment,
  PostsListResponse,
  CreatePostRequest,
  UpdatePostRequest,
  AddCommentRequest,
  ToggleLikeResponse,
  ListPostsParams,
  AdminListPostsParams,
  AdminHidePostResponse,
  AdminRestorePostResponse,
  AdminPinPostResponse,
  FilterOptionsResponse,
  PostMedia,
  UploadMediaResponse,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from '@/types/feed';

export const feedService = {
  /**
   * Get paginated list of posts
   */
  async listPosts(params: ListPostsParams = {}): Promise<PostsListResponse> {
    const { page = 1, page_size = 20, university_id, tag } = params;
    
    let endpoint = `${API_ENDPOINTS.FEED.POSTS}?page=${page}&page_size=${page_size}`;
    if (university_id) {
      endpoint += `&university_id=${university_id}`;
    }
    if (tag) {
      endpoint += `&tag=${tag}`;
    }
    
    return apiClient<PostsListResponse>(endpoint, {
      method: 'GET',
      requireAuth: false, // Auth is optional but recommended
    });
  },

  /**
   * Get filter options for posts (tags, universities)
   */
  async getFilterOptions(): Promise<FilterOptionsResponse> {
    return apiClient<FilterOptionsResponse>(API_ENDPOINTS.FEED.FILTER_OPTIONS, {
      method: 'GET',
      requireAuth: false,
    });
  },

  /**
   * Get a single post by ID with all comments and likes
   */
  async getPost(postId: number): Promise<ApiPost> {
    return apiClient<ApiPost>(API_ENDPOINTS.FEED.POST(postId), {
      method: 'GET',
      requireAuth: false, // Auth is optional
    });
  },

  /**
   * Create a new post
   */
  async createPost(data: CreatePostRequest): Promise<ApiPost> {
    return apiClient<ApiPost>(API_ENDPOINTS.FEED.POSTS, {
      method: 'POST',
      body: data,
      requireAuth: true,
    });
  },

  /**
   * Update an existing post (author only)
   */
  async updatePost(postId: number, data: UpdatePostRequest): Promise<ApiPost> {
    return apiClient<ApiPost>(API_ENDPOINTS.FEED.POST(postId), {
      method: 'PUT',
      body: data,
      requireAuth: true,
    });
  },

  /**
   * Delete a post (author or admin)
   */
  async deletePost(postId: number): Promise<void> {
    return apiClient<void>(API_ENDPOINTS.FEED.POST(postId), {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  /**
   * Add a comment to a post
   */
  async addComment(postId: number, data: AddCommentRequest): Promise<ApiComment> {
    return apiClient<ApiComment>(API_ENDPOINTS.FEED.POST_COMMENTS(postId), {
      method: 'POST',
      body: data,
      requireAuth: true,
    });
  },

  /**
   * Delete a comment (author or admin)
   */
  async deleteComment(commentId: number): Promise<void> {
    return apiClient<void>(API_ENDPOINTS.FEED.COMMENT(commentId), {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  /**
   * Toggle like on a post (like if not liked, unlike if already liked)
   */
  async toggleLike(postId: number): Promise<ToggleLikeResponse> {
    return apiClient<ToggleLikeResponse>(API_ENDPOINTS.FEED.POST_LIKE(postId), {
      method: 'POST',
      requireAuth: true,
    });
  },

  // ==================== Admin Feed Management ====================

  /**
   * List all posts with admin moderation options (Admin only)
   * Includes posts of all statuses: active, hidden, deleted
   */
  async adminListPosts(params: AdminListPostsParams = {}): Promise<PostsListResponse> {
    const { page = 1, page_size = 20, university_id, status_filter, search } = params;
    
    let endpoint = `${API_ENDPOINTS.FEED.ADMIN_POSTS}?page=${page}&page_size=${page_size}`;
    if (university_id) {
      endpoint += `&university_id=${university_id}`;
    }
    if (status_filter) {
      endpoint += `&status_filter=${status_filter}`;
    }
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    
    return apiClient<PostsListResponse>(endpoint, {
      method: 'GET',
      requireAuth: true,
    });
  },

  /**
   * Hide a post (soft delete - Admin only)
   */
  async hidePost(postId: number): Promise<AdminHidePostResponse> {
    return apiClient<AdminHidePostResponse>(API_ENDPOINTS.FEED.ADMIN_HIDE_POST(postId), {
      method: 'POST',
      requireAuth: true,
    });
  },

  /**
   * Restore a hidden or deleted post (Admin only)
   */
  async restorePost(postId: number): Promise<AdminRestorePostResponse> {
    return apiClient<AdminRestorePostResponse>(API_ENDPOINTS.FEED.ADMIN_RESTORE_POST(postId), {
      method: 'POST',
      requireAuth: true,
    });
  },

  /**
   * Pin or unpin a post (Admin only) - toggles pin state
   */
  async togglePinPost(postId: number): Promise<AdminPinPostResponse> {
    return apiClient<AdminPinPostResponse>(API_ENDPOINTS.FEED.ADMIN_PIN_POST(postId), {
      method: 'POST',
      requireAuth: true,
    });
  },

  // ==================== Media Management ====================

  /**
   * Validate a file for upload
   * Returns an error message if invalid, or null if valid
   */
  validateMediaFile(file: File): { valid: boolean; error?: string; mediaType?: 'image' | 'video' } {
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    
    // Check if it's an image
    if (SUPPORTED_IMAGE_FORMATS.includes(extension)) {
      if (file.size > MAX_IMAGE_SIZE) {
        return { 
          valid: false, 
          error: `Image size exceeds maximum of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` 
        };
      }
      return { valid: true, mediaType: 'image' };
    }
    
    // Check if it's a video
    if (SUPPORTED_VIDEO_FORMATS.includes(extension)) {
      if (file.size > MAX_VIDEO_SIZE) {
        return { 
          valid: false, 
          error: `Video size exceeds maximum of ${MAX_VIDEO_SIZE / (1024 * 1024)}MB` 
        };
      }
      return { valid: true, mediaType: 'video' };
    }
    
    // Invalid format
    return { 
      valid: false, 
      error: `Unsupported file format. Supported: ${[...SUPPORTED_IMAGE_FORMATS, ...SUPPORTED_VIDEO_FORMATS].join(', ')}` 
    };
  },

  /**
   * Upload media (image or video) to a post
   * Only the post author can upload media
   * 
   * @param postId - The ID of the post to attach media to
   * @param file - The file to upload
   * @param onProgress - Optional callback for upload progress (0-100)
   * @returns The uploaded media details
   */
  async uploadMedia(
    postId: number, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<UploadMediaResponse> {
    // Validate file before upload
    const validation = this.validateMediaFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);

    return apiFileUpload<UploadMediaResponse>(
      API_ENDPOINTS.FEED.POST_MEDIA(postId),
      formData,
      {
        requireAuth: true,
        onProgress,
      }
    );
  },

  /**
   * Upload multiple media files to a post
   * Files are uploaded sequentially to maintain order
   * 
   * @param postId - The ID of the post to attach media to
   * @param files - Array of files to upload
   * @param onProgress - Optional callback for overall progress (0-100)
   * @param onFileProgress - Optional callback for individual file progress
   * @returns Array of uploaded media details
   */
  async uploadMultipleMedia(
    postId: number,
    files: File[],
    onProgress?: (progress: number) => void,
    onFileProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadMediaResponse[]> {
    const results: UploadMediaResponse[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const result = await this.uploadMedia(postId, file, (fileProgress) => {
        onFileProgress?.(i, fileProgress);
        
        // Calculate overall progress
        const completedFiles = i;
        const overallProgress = Math.round(
          ((completedFiles * 100) + fileProgress) / totalFiles
        );
        onProgress?.(overallProgress);
      });
      
      results.push(result);
    }

    onProgress?.(100);
    return results;
  },

  /**
   * Delete media from a post
   * Only the post author can delete media
   * Deletes both the database record and the physical file
   * 
   * @param postId - The ID of the post
   * @param mediaId - The ID of the media to delete
   */
  async deleteMedia(postId: number, mediaId: number): Promise<void> {
    return apiDelete(API_ENDPOINTS.FEED.DELETE_MEDIA(postId, mediaId), {
      requireAuth: true,
    });
  },

  /**
   * Get media type from file
   */
  getMediaTypeFromFile(file: File): 'image' | 'video' | null {
    const validation = this.validateMediaFile(file);
    return validation.valid ? validation.mediaType || null : null;
  },
};
