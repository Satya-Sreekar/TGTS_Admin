import api from './api';

export type LoginRequest = {
  phone: string;
};

export type VerifyOTPRequest = {
  phone: string;
  otp: string;
};

export type User = {
  id: number;
  phone: string;
  name: string;
  role: 'public' | 'cadre' | 'admin';
  region?: string;
  enrollment_date: string;
  is_active: boolean;
};

export type AuthResponse = {
  access_token: string;
  user: User;
  message: string;
};

export const authService = {
  // Send OTP to phone number
  async sendOTP(data: LoginRequest) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Verify OTP and get access token
  async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-otp', data);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};

