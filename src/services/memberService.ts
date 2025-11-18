import api from './api';
import type { PaginatedResponse } from './userService';

export type Member = {
  id: string;
  fullName: string;
  fatherName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone: string;
  aadharNumber?: string;
  epicNumber?: string;
  epicFileUrl?: string;
  village?: string;
  mandal?: string;
  district?: string;
  parliamentConstituency?: string;
  assemblyConstituency?: string;
  fullAddress?: string;
  partyDesignation?: string;
  occupation?: string;
  volunteerInterest: boolean;
  hasInsurance: boolean;
  insuranceNumber?: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MemberFilters = {
  page?: number;
  per_page?: number;
  status?: 'pending' | 'approved' | 'rejected';
  district?: string;
  search?: string;
};

export const memberService = {
  // Get all members (admin/cadre only)
  async getMembers(filters: MemberFilters = {}): Promise<PaginatedResponse<Member>> {
    const response = await api.get('/members/', { params: filters });
    return response.data;
  },

  // Get member by ID
  async getMemberById(memberId: string): Promise<Member> {
    const response = await api.get(`/members/${memberId}`);
    return response.data;
  },

  // Update member status (admin/cadre only)
  async updateMemberStatus(memberId: string, status: 'pending' | 'approved' | 'rejected'): Promise<Member> {
    const response = await api.put(`/members/${memberId}`, { status });
    return response.data;
  },
};

