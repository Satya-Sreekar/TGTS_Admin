import api from './api';

export type MediaItem = {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  title: {
    en: string;
    te: string;
  };
  date: string;
  isPublished: boolean;
};

export type MediaListResponse = {
  media: MediaItem[];
  total: number;
  pages: number;
  current_page: number;
};

export type CreateMediaRequest = {
  type: 'photo' | 'video';
  url: string;
  thumbnail_url?: string;
  title_en: string;
  title_te: string;
  is_published?: boolean;
};

export type MediaFilters = {
  page?: number;
  per_page?: number;
  type?: 'photo' | 'video';
};

export const mediaService = {
  // Get all published media items
  async getMedia(filters: MediaFilters = {}): Promise<MediaListResponse> {
    const response = await api.get('/media/', { params: filters });
    return response.data;
  },

  // Get media item by ID
  async getMediaById(mediaId: string): Promise<MediaItem> {
    const response = await api.get(`/media/${mediaId}`);
    return response.data;
  },

  // Create media item (admin/cadre only)
  async createMedia(data: CreateMediaRequest): Promise<MediaItem> {
    console.log('Creating media with data:', data);
    const response = await api.post('/media/', data);
    console.log('Create media response:', response.data);
    return response.data;
  },

  // Upload file and get URL
  async uploadFile(file: File, type: 'photo' | 'video'): Promise<{ url: string; thumbnail_url?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload media with file (combines upload + create)
  async uploadMedia(file: File, data: Omit<CreateMediaRequest, 'url' | 'thumbnail_url'>): Promise<MediaItem> {
    console.log('Upload media called with data:', data);
    // First upload the file
    const uploadResult = await this.uploadFile(file, data.type);
    console.log('File upload result:', uploadResult);
    
    // Then create the media item with the uploaded URL
    const createData = {
      ...data,
      url: uploadResult.url,
      thumbnail_url: uploadResult.thumbnail_url,
    };
    console.log('About to create media with:', createData);
    return this.createMedia(createData);
  },
};

