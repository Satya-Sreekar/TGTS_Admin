import api from './api';

export type Document = {
  id: number;
  title_en: string;
  title_te?: string;
  description_en?: string;
  description_te?: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: number;
  access_level: string[];
  is_published: boolean;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
};

export type DocumentFilters = {
  page?: number;
  per_page?: number;
  category?: string;
};

export type CreateDocumentRequest = {
  title_en: string;
  title_te?: string;
  description_en?: string;
  description_te?: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: number;
  access_level?: string[];
  is_published?: boolean;
};

export const documentService = {
  // Get all documents
  async getDocuments(filters: DocumentFilters = {}) {
    const response = await api.get('/documents/', { params: filters });
    return response.data;
  },

  // Get document by ID
  async getDocumentById(documentId: number): Promise<Document> {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  // Create document (admin only)
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const response = await api.post('/documents/', data);
    return response.data;
  },

  // Update document (admin only)
  async updateDocument(documentId: number, data: Partial<CreateDocumentRequest>): Promise<Document> {
    const response = await api.put(`/documents/${documentId}`, data);
    return response.data;
  },

  // Delete document (admin only)
  async deleteDocument(documentId: number) {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  // Upload file
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

