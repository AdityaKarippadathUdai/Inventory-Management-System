import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for adding auth token (Future Phase)
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try { const refreshed = await apiClient.post('/auth/refresh'); setAccessToken(refreshed.data.accessToken); original.headers.Authorization = `Bearer ${refreshed.data.accessToken}`; return apiClient(original); } catch { setAccessToken(null); window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); }
    }
    return Promise.reject(error);
  }
);
