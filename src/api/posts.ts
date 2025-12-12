import { apiClient } from './client';
import type {
  PostResponse,
  PostCreateRequest,
  PostListResponse,
  CommentResponse,
  MessageResponse,
} from './types';

export const postsApi = {
  // Get posts feed
  getFeed: async (params?: {
    page?: number;
    page_size?: number;
    type?: string;
    tag?: string;
    search?: string;
  }): Promise<PostListResponse> => {
    return apiClient.get<PostListResponse>('/posts', params);
  },

  // Get single post
  getPost: async (postId: string): Promise<PostResponse> => {
    return apiClient.get<PostResponse>(`/posts/${postId}`);
  },

  // Create post
  createPost: async (data: PostCreateRequest): Promise<PostResponse> => {
    return apiClient.post<PostResponse>('/posts', data);
  },

  // Update post
  updatePost: async (postId: string, data: Partial<PostCreateRequest>): Promise<PostResponse> => {
    return apiClient.put<PostResponse>(`/posts/${postId}`, data);
  },

  // Delete post
  deletePost: async (postId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/posts/${postId}`);
  },

  // Like post
  likePost: async (postId: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/posts/${postId}/like`);
  },

  // Unlike post
  unlikePost: async (postId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/posts/${postId}/like`);
  },

  // Get comments
  getComments: async (postId: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{ comments: CommentResponse[]; total: number }> => {
    return apiClient.get(`/posts/${postId}/comments`, params);
  },

  // Add comment
  addComment: async (postId: string, content: string): Promise<CommentResponse> => {
    return apiClient.post<CommentResponse>(`/posts/${postId}/comments`, { content });
  },

  // Delete comment
  deleteComment: async (postId: string, commentId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/posts/${postId}/comments/${commentId}`);
  },
};

