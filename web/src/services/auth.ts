import api, { ApiResponse } from './api';

// User interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Authentication request interfaces
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Authentication response interfaces
export interface AuthResponse {
  token: string;
  user: User;
}

// Auth service class
class AuthService {  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Promise with auth response containing token and user info
   */
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<{ token: string }>('/signup', userData);
      
      // Save token to localStorage if successful
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Since backend doesn't return user info, we'll create a simplified response
        return {
          token: response.data.token,
          user: {
            id: 0, // We don't have the actual ID
            username: userData.username,
            email: userData.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
      }
      
      throw new Error('No token received from server');
    } catch (error: any) {
      // Handle and transform error
      const errorMessage = error.response?.data?.error || 'Failed to register user';
      throw new Error(errorMessage);
    }
  }
  /**
   * Login an existing user
   * @param credentials - User login credentials
   * @returns Promise with auth response containing token and user info
   */  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Attempting login with API URL:', import.meta.env.VITE_API_URL);
      const response = await api.post<{ token: string }>('/login', credentials);
      
      // Save token to localStorage if successful
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Since backend doesn't return user info, we'll create a simplified response
        return {
          token: response.data.token,
          user: {
            id: 0, // We don't have the actual ID
            username: "", // We don't have the username
            email: credentials.email, // We at least know the email
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
      }
      
      throw new Error('No token received from server');    } catch (error: any) {
      // Handle and transform error
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to login';
      throw new Error(errorMessage);
    }
  }

  /**
   * Logout the current user
   */
  logout(): void {
    localStorage.removeItem('token');
  }

  /**
   * Check if user is authenticated
   * @returns boolean indicating if user has a token
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Get the current authentication token
   * @returns The current token or null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get current user ID from JWT token
   * @returns The user ID from token or a default
   */
  getCurrentUserId(): string {
    try {
      const token = this.getToken();
      if (!token) return "1"; // Default user ID if no token
      
      // Decode JWT token to get user info
      // JWT tokens are in format: header.payload.signature
      const payload = token.split('.')[1];
      if (!payload) return "1";
      
      // Decode the Base64 payload
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.user_id || decodedPayload.id || decodedPayload.sub || "1";
    } catch (error) {
      console.error("Error getting user ID from token:", error);
      return "1"; // Fallback to default user
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
