import api from './api';

export type AdminLoginRequest = {
  username: string;
  password: string;
};

export type User = {
  id: string;
  phone: string;
  name: string;
  role: string;
  region?: string;
  isActive: boolean;
  is_active?: boolean; // API may return snake_case
  enrollment_date?: string;
};

export type AdminLoginResponse = {
  access_token: string;
  user: User;
  message: string;
};

export const authService = {
  // Admin login
  async adminLogin(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    const response = await api.post('/auth/admin-login', credentials);
    return response.data;
  },

  // Logout (clear token)
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // Get stored user info
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Store auth data
  storeAuth(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
};
