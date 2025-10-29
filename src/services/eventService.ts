import api from './api';

export type Event = {
  id: number;
  title_en: string;
  title_te?: string;
  description_en: string;
  description_te?: string;
  event_date: string;
  location_en: string;
  location_te?: string;
  image_url?: string;
  rsvp_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type EventFilters = {
  page?: number;
  per_page?: number;
  upcoming_only?: boolean;
};

export type CreateEventRequest = {
  title_en: string;
  title_te?: string;
  description_en: string;
  description_te?: string;
  event_date: string;
  location_en: string;
  location_te?: string;
  image_url?: string;
  is_published?: boolean;
};

export const eventService = {
  // Get all events
  async getEvents(filters: EventFilters = {}) {
    const response = await api.get('/events/', { params: filters });
    return response.data;
  },

  // Get event by ID
  async getEventById(eventId: number): Promise<Event> {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Create event (admin only)
  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await api.post('/events/', data);
    return response.data;
  },

  // Update event (admin only)
  async updateEvent(eventId: number, data: Partial<CreateEventRequest>): Promise<Event> {
    const response = await api.put(`/events/${eventId}`, data);
    return response.data;
  },

  // Delete event (admin only)
  async deleteEvent(eventId: number) {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  // RSVP to event
  async rsvpToEvent(eventId: number) {
    const response = await api.post(`/events/${eventId}/rsvp`);
    return response.data;
  },
};

