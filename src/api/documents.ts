import { apiClient } from './client';
import type {
  DocumentRequestResponse,
  GeneratedDocumentResponse,
  MessageResponse,
} from './types';

export interface DocumentRequestCreate {
  document_type: string;
  reason?: string;
}

export interface GeneratedDocumentCreate {
  document_type: string;
  target_role?: string;
  company?: string;
  experience?: string;
  skills?: string[];
  additional_info?: string;
}

export const documentsApi = {
  // Get my document requests
  getRequests: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<{ requests: DocumentRequestResponse[]; total: number; page: number; page_size: number }> => {
    return apiClient.get('/documents/requests', params);
  },

  // Create document request
  createRequest: async (data: DocumentRequestCreate): Promise<DocumentRequestResponse> => {
    return apiClient.post<DocumentRequestResponse>('/documents/requests', data);
  },

  // Get single request
  getRequest: async (requestId: string): Promise<DocumentRequestResponse> => {
    return apiClient.get<DocumentRequestResponse>(`/documents/requests/${requestId}`);
  },

  // Cancel request
  cancelRequest: async (requestId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/documents/requests/${requestId}`);
  },

  // Get generated documents
  getGeneratedDocuments: async (docType?: string): Promise<GeneratedDocumentResponse[]> => {
    const params = docType ? { doc_type: docType } : undefined;
    return apiClient.get<GeneratedDocumentResponse[]>('/documents/generated', params);
  },

  // Generate document (AI)
  generateDocument: async (data: GeneratedDocumentCreate): Promise<GeneratedDocumentResponse> => {
    return apiClient.post<GeneratedDocumentResponse>('/documents/generated', data);
  },

  // Get generated document
  getGeneratedDocument: async (documentId: string): Promise<GeneratedDocumentResponse> => {
    return apiClient.get<GeneratedDocumentResponse>(`/documents/generated/${documentId}`);
  },

  // Delete generated document
  deleteGeneratedDocument: async (documentId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/documents/generated/${documentId}`);
  },
};

