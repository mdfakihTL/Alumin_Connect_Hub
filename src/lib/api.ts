import { TOKEN_KEYS, RefreshTokenResponse } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alumni-portal-yw7q.onrender.com';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    ME: '/api/v1/auth/me',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    TEMPLATE: '/api/v1/auth/template',
  },
  FEED: {
    POSTS: '/api/v1/feed/posts',
    POST: (id: number) => `/api/v1/feed/posts/${id}`,
    POST_COMMENTS: (postId: number) => `/api/v1/feed/posts/${postId}/comments`,
    POST_LIKE: (postId: number) => `/api/v1/feed/posts/${postId}/like`,
    COMMENT: (commentId: number) => `/api/v1/feed/comments/${commentId}`,
    FILTER_OPTIONS: '/api/v1/feed/posts/filters/options',
    // Media endpoints
    POST_MEDIA: (postId: number) => `/api/v1/feed/posts/${postId}/media`,
    DELETE_MEDIA: (postId: number, mediaId: number) => `/api/v1/feed/posts/${postId}/media/${mediaId}`,
    // Admin endpoints
    ADMIN_POSTS: '/api/v1/feed/admin/posts',
    ADMIN_HIDE_POST: (postId: number) => `/api/v1/feed/admin/posts/${postId}/hide`,
    ADMIN_RESTORE_POST: (postId: number) => `/api/v1/feed/admin/posts/${postId}/restore`,
    ADMIN_PIN_POST: (postId: number) => `/api/v1/feed/admin/posts/${postId}/pin`,
  },
  USERS: {
    LIST: '/api/v1/users',
    GET_BY_ID: (id: number) => `/api/v1/users/${id}`,
  },
  ALUMNI: {
    ME: '/api/v1/alumni/me',
    LIST: '/api/v1/alumni',
    GET_BY_ID: (id: number) => `/api/v1/alumni/${id}`,
  },
  EVENTS: {
    LIST: '/api/v1/events',
    GET_BY_ID: (id: number) => `/api/v1/events/${id}`,
    CREATE: '/api/v1/events',
    UPDATE: (id: number) => `/api/v1/events/${id}`,
    DELETE: (id: number) => `/api/v1/events/${id}`,
    REGISTER: (id: number) => `/api/v1/events/${id}/register`,
    UNREGISTER: (id: number) => `/api/v1/events/${id}/unregister`,
    ATTENDEES: (id: number) => `/api/v1/events/${id}/attendees`,
  },
  DOCUMENTS: {
    LIST: '/api/v1/documents',
    UPLOAD: '/api/v1/documents/upload',
    SEARCH: '/api/v1/documents/search',
    GET_BY_ID: (id: number) => `/api/v1/documents/${id}`,
    UPDATE: (id: number) => `/api/v1/documents/${id}`,
    DELETE: (id: number) => `/api/v1/documents/${id}`,
  },
  DOCUMENT_REQUESTS: {
    LIST: '/api/v1/document-requests',
    CREATE: '/api/v1/document-requests',
    GET_BY_ID: (id: number) => `/api/v1/document-requests/${id}`,
    UPDATE_STATUS: (id: number) => `/api/v1/document-requests/${id}`,
  },
  CHAT: {
    MESSAGE: '/api/v1/chat/message',
    SESSIONS: '/api/v1/chat/sessions',
    SESSION: (id: number) => `/api/v1/chat/sessions/${id}`,
  },
} as const;

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER);
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp - 30000; // 30 seconds buffer
    } catch {
      return true;
    }
  },
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Refresh the access token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshToken),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      return null;
    }

    const data: RefreshTokenResponse = await response.json();
    tokenManager.setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    tokenManager.clearTokens();
    return null;
  }
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(): Promise<string | null> {
  const accessToken = tokenManager.getAccessToken();
  
  if (!accessToken) {
    return null;
  }

  // Check if token is expired or about to expire
  if (tokenManager.isTokenExpired(accessToken)) {
    // If already refreshing, wait for the existing refresh
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

    return refreshPromise;
  }

  return accessToken;
}

// HTTP request options
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

// API client with automatic token management
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, requireAuth = true } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization header if required
  if (requireAuth) {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new ApiClientError('Not authenticated', 401);
    }
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Use default error message
      }
    }

    // Handle 401 - clear tokens and redirect
    if (response.status === 401) {
      tokenManager.clearTokens();
    }

    throw new ApiClientError(errorMessage, response.status);
  }

  // Return empty object for 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  if (isJson) {
    return response.json();
  }

  return {} as T;
}

// Custom API error class
export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

// File upload client for multipart/form-data requests
export async function apiFileUpload<T>(
  endpoint: string,
  formData: FormData,
  options: { requireAuth?: boolean; onProgress?: (progress: number) => void } = {}
): Promise<T> {
  const { requireAuth = true, onProgress } = options;

  const headers: Record<string, string> = {};

  // Add authorization header if required
  if (requireAuth) {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new ApiClientError('Not authenticated', 401);
    }
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Use XMLHttpRequest for progress tracking
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve({} as T);
          }
        } else {
          let errorMessage = 'An error occurred';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.detail || errorMessage;
          } catch {
            // Use default error message
          }
          reject(new ApiClientError(errorMessage, xhr.status));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiClientError('Network error', 0));
      });

      xhr.open('POST', `${API_BASE_URL}${endpoint}`);
      
      // Set headers (but not Content-Type - browser sets it with boundary for FormData)
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  }

  // Standard fetch for non-progress requests
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Use default error message
      }
    }

    if (response.status === 401) {
      tokenManager.clearTokens();
    }

    throw new ApiClientError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (isJson) {
    return response.json();
  }

  return {} as T;
}

// API client for DELETE requests that return 204 No Content
export async function apiDelete(
  endpoint: string,
  options: { requireAuth?: boolean } = {}
): Promise<void> {
  const { requireAuth = true } = options;

  const headers: Record<string, string> = {};

  if (requireAuth) {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new ApiClientError('Not authenticated', 401);
    }
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Use default error message
      }
    }

    if (response.status === 401) {
      tokenManager.clearTokens();
    }

    throw new ApiClientError(errorMessage, response.status);
  }
}

// Export base URL for reference
export { API_BASE_URL };
