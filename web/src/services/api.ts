import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse,InternalAxiosRequestConfig, } from 'axios';

// Base API configuration
const API_URL = import.meta.env.VITE_API_URL;
console.log('Loaded VITE_API_URL:', API_URL);
// Create a configured axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors here (e.g., 401 Unauthorized, 403 Forbidden)
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Common response interface for API responses
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status?: string;
  code?: number;
}

export default api;
