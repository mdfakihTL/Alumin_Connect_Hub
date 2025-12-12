import { apiClient, apiFileUpload, API_ENDPOINTS, API_BASE_URL } from '@/lib/api';
import {
  Document,
  ListDocumentsParams,
  ListDocumentsResponse,
  UpdateDocumentRequest,
  SearchDocumentsRequest,
  SearchDocumentsResponse,
  DocumentRequest,
  CreateDocumentRequestPayload,
  UpdateDocumentRequestStatusPayload,
  ListDocumentRequestsParams,
  ListDocumentRequestsResponse,
} from '@/types/documents';

export const documentService = {
  /**
   * Upload a document (auth required)
   * Supports PDF, DOCX, TXT files
   */
  async uploadDocument(
    file: File,
    options?: {
      title?: string;
      description?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.title) {
      formData.append('title', options.title);
    }
    if (options?.description) {
      formData.append('description', options.description);
    }

    return apiFileUpload<Document>(
      API_ENDPOINTS.DOCUMENTS.UPLOAD,
      formData,
      {
        requireAuth: true,
        onProgress: options?.onProgress,
      }
    );
  },

  /**
   * List all documents (public endpoint)
   * Supports pagination and filtering by file type
   */
  async listDocuments(params?: ListDocumentsParams): Promise<ListDocumentsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip !== undefined) {
      queryParams.append('skip', String(params.skip));
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', String(params.limit));
    }
    if (params?.file_type) {
      queryParams.append('file_type', params.file_type);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.DOCUMENTS.LIST}?${queryString}` 
      : API_ENDPOINTS.DOCUMENTS.LIST;

    return apiClient<ListDocumentsResponse>(endpoint, {
      method: 'GET',
      requireAuth: false,
    });
  },

  /**
   * Search documents using AI vector search (public endpoint)
   */
  async searchDocuments(request: SearchDocumentsRequest): Promise<SearchDocumentsResponse> {
    return apiClient<SearchDocumentsResponse>(API_ENDPOINTS.DOCUMENTS.SEARCH, {
      method: 'POST',
      body: request,
      requireAuth: false,
    });
  },

  /**
   * Get a document by ID (public endpoint)
   */
  async getDocument(id: number): Promise<Document> {
    return apiClient<Document>(API_ENDPOINTS.DOCUMENTS.GET_BY_ID(id), {
      method: 'GET',
      requireAuth: false,
    });
  },

  /**
   * Update document metadata (auth required, owner only)
   */
  async updateDocument(id: number, data: UpdateDocumentRequest): Promise<Document> {
    return apiClient<Document>(API_ENDPOINTS.DOCUMENTS.UPDATE(id), {
      method: 'PUT',
      body: data,
      requireAuth: true,
    });
  },

  /**
   * Delete a document (auth required, owner only)
   */
  async deleteDocument(id: number): Promise<void> {
    return apiClient<void>(API_ENDPOINTS.DOCUMENTS.DELETE(id), {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  /**
   * Get the full URL for downloading a document
   */
  getDocumentDownloadUrl(filePath: string): string {
    // If the path already starts with http, it's a full URL
    if (filePath.startsWith('http')) {
      return filePath;
    }
    // Otherwise, prepend the API base URL
    return `${API_BASE_URL}${filePath}`;
  },

  /**
   * Validate file before upload
   * Returns error message if invalid, null if valid
   */
  validateFile(file: File): string | null {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return 'Only PDF, DOCX, and TXT files are allowed';
    }

    // Check MIME type (additional validation)
    if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
      return 'Invalid file type. Only PDF, DOCX, and TXT files are allowed';
    }

    return null;
  },

  // ============================================
  // Document Request APIs (for official documents)
  // ============================================

  /**
   * Create a document request (Alumni only)
   * Request official documents like transcripts, certificates, etc.
   */
  async createDocumentRequest(payload: CreateDocumentRequestPayload): Promise<DocumentRequest> {
    return apiClient<DocumentRequest>(API_ENDPOINTS.DOCUMENT_REQUESTS.CREATE, {
      method: 'POST',
      body: payload,
      requireAuth: true,
    });
  },

  /**
   * List document requests
   * Alumni see their own requests, Admin sees all from their university
   */
  async listDocumentRequests(params?: ListDocumentRequestsParams): Promise<ListDocumentRequestsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page !== undefined) {
      queryParams.append('page', String(params.page));
    }
    if (params?.page_size !== undefined) {
      queryParams.append('page_size', String(params.page_size));
    }
    if (params?.status_filter) {
      queryParams.append('status_filter', params.status_filter);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.DOCUMENT_REQUESTS.LIST}?${queryString}` 
      : API_ENDPOINTS.DOCUMENT_REQUESTS.LIST;

    return apiClient<ListDocumentRequestsResponse>(endpoint, {
      method: 'GET',
      requireAuth: true,
    });
  },

  /**
   * Get a document request by ID
   */
  async getDocumentRequest(id: number): Promise<DocumentRequest> {
    return apiClient<DocumentRequest>(API_ENDPOINTS.DOCUMENT_REQUESTS.GET_BY_ID(id), {
      method: 'GET',
      requireAuth: true,
    });
  },

  /**
   * Update document request status (Admin only)
   * Approve/reject with optional notes
   */
  async updateDocumentRequestStatus(
    id: number, 
    payload: UpdateDocumentRequestStatusPayload
  ): Promise<DocumentRequest> {
    return apiClient<DocumentRequest>(API_ENDPOINTS.DOCUMENT_REQUESTS.UPDATE_STATUS(id), {
      method: 'PUT',
      body: payload,
      requireAuth: true,
    });
  },
};
