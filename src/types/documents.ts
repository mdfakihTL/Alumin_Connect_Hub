// Document status types
export type DocumentStatus = 'processing' | 'processed' | 'failed';

// Document file types supported by the API
export type DocumentFileType = 'pdf' | 'docx' | 'txt';

// Document model from API response
export interface Document {
  id: number;
  title: string;
  description: string | null;
  file_path: string;
  file_type: DocumentFileType;
  file_size: number;
  status: DocumentStatus;
  uploader_id: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Document Request Types (for official documents)
// ============================================

// Document request status types
export type DocumentRequestStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'processing' 
  | 'completed' 
  | 'cancelled';

// Document types that can be requested
export type RequestableDocumentType = 
  | 'transcript' 
  | 'certificate' 
  | 'letter' 
  | 'degree' 
  | 'enrollment_verification'
  | 'recommendation'
  | 'other';

// Document Request model from API response
export interface DocumentRequest {
  id: number;
  document_type: RequestableDocumentType;
  reason: string;
  status: DocumentRequestStatus;
  requestor_id: number;
  university_id: number;
  requestor_name: string;
  university_name: string;
  admin_notes: string | null;
  processed_by_id: number | null;
  processed_by_name: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Create Document Request payload
export interface CreateDocumentRequestPayload {
  document_type: RequestableDocumentType;
  reason: string;
}

// Update Document Request Status payload (Admin only)
export interface UpdateDocumentRequestStatusPayload {
  status: DocumentRequestStatus;
  admin_notes?: string;
}

// List Document Requests params
export interface ListDocumentRequestsParams {
  page?: number;
  page_size?: number;
  status_filter?: DocumentRequestStatus;
}

// List Document Requests response
export interface ListDocumentRequestsResponse {
  requests: DocumentRequest[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Document Request state for frontend
export interface DocumentRequestsState {
  requests: DocumentRequest[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
}

// Request types
export interface UploadDocumentRequest {
  file: File;
  title?: string;
  description?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
}

export interface SearchDocumentsRequest {
  query: string;
  limit?: number;
}

export interface ListDocumentsParams {
  skip?: number;
  limit?: number;
  file_type?: DocumentFileType;
}

// Search result with relevance score
export interface DocumentSearchResult extends Document {
  score?: number;
  highlights?: string[];
}

// Response types
export type ListDocumentsResponse = Document[];
export type SearchDocumentsResponse = DocumentSearchResult[];

// Frontend state management types
export interface DocumentsState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number | null;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface SearchState {
  results: DocumentSearchResult[];
  isSearching: boolean;
  query: string;
  error: string | null;
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileTypeIcon(fileType: DocumentFileType): string {
  switch (fileType) {
    case 'pdf':
      return '📄';
    case 'docx':
      return '📝';
    case 'txt':
      return '📃';
    default:
      return '📁';
  }
}

export function getStatusColor(status: DocumentStatus): string {
  switch (status) {
    case 'processed':
      return 'text-green-500';
    case 'processing':
      return 'text-yellow-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function isDocumentOwner(document: Document, userId: number | string): boolean {
  return document.uploader_id === Number(userId);
}

// Document Request utility functions
export function getRequestStatusColor(status: DocumentRequestStatus): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-500';
    case 'approved':
      return 'text-green-500';
    case 'rejected':
      return 'text-red-500';
    case 'processing':
      return 'text-blue-500';
    case 'completed':
      return 'text-emerald-500';
    case 'cancelled':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

export function getRequestStatusLabel(status: DocumentRequestStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'processing':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getDocumentTypeLabel(type: RequestableDocumentType): string {
  switch (type) {
    case 'transcript':
      return 'Official Transcript';
    case 'certificate':
      return 'Certificate';
    case 'letter':
      return 'Letter';
    case 'degree':
      return 'Degree Certificate';
    case 'enrollment_verification':
      return 'Enrollment Verification';
    case 'recommendation':
      return 'Recommendation Letter';
    case 'other':
      return 'Other';
    default:
      return type;
  }
}

export function isDocumentRequestOwner(request: DocumentRequest, userId: number | string): boolean {
  return request.requestor_id === Number(userId);
}

// ============================================
// Document Request Utility Functions
// ============================================

export function getDocumentRequestStatusColor(status: DocumentRequestStatus): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-500';
    case 'approved':
      return 'text-blue-500';
    case 'rejected':
      return 'text-red-500';
    case 'processing':
      return 'text-orange-500';
    case 'completed':
      return 'text-green-500';
    case 'cancelled':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

export function getDocumentRequestStatusLabel(status: DocumentRequestStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'processing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}


export function isDocumentRequestor(request: DocumentRequest, userId: number | string): boolean {
  return request.requestor_id === Number(userId);
}
