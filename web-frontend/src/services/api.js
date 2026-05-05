import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, { email, password });
    return response.data;
  },
  
  verifyToken: async (token) => {
    const response = await api.post(API_ENDPOINTS.VERIFY_TOKEN, { token });
    return response.data;
  },
};

// Admin Dashboard API
export const dashboardAPI = {
  getDashboard: async () => {
    const response = await api.get(API_ENDPOINTS.DASHBOARD);
    return response.data;
  },
  
  getSettings: async () => {
    const response = await api.get(API_ENDPOINTS.SETTINGS);
    return response.data;
  },
  
  updateSettings: async (settings) => {
    const response = await api.put(API_ENDPOINTS.SETTINGS, settings);
    return response.data;
  },
  
  getAppConfig: async () => {
    const response = await api.get(API_ENDPOINTS.APP_CONFIG);
    return response.data;
  },
  
  updateAppConfig: async (config) => {
    const response = await api.put(API_ENDPOINTS.APP_CONFIG, config);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (page = 1, limit = 20, search = '') => {
    const response = await api.get(API_ENDPOINTS.USERS, {
      params: { page, limit, search },
    });
    return response.data;
  },
  
  getUserDetail: async (userId) => {
    const response = await api.get(API_ENDPOINTS.USER_DETAIL(userId));
    return response.data;
  },
  
  getUserGenerations: async (userId, page = 1, limit = 100) => {
    const response = await api.get(API_ENDPOINTS.USER_GENERATIONS(userId), {
      params: { page, limit },
    });
    return response.data;
  },
  
  updateUserStatus: async (userId, status) => {
    const response = await api.put(API_ENDPOINTS.UPDATE_USER_STATUS(userId), { status });
    return response.data;
  },
  
  addUserCredits: async (userId, credits, reason = 'Admin credit addition') => {
    const response = await api.post(API_ENDPOINTS.ADD_USER_CREDITS(userId), { credits, reason });
    return response.data;
  },
};

// Token Stats API
export const tokenStatsAPI = {
  getTokenStats: async (filter = 'all', from, to) => {
    const params = { filter };
    if (from) params.from = from;
    if (to) params.to = to;
    
    const response = await api.get(API_ENDPOINTS.TOKEN_STATS, { params });
    return response.data;
  },
};

// Content Management API
export const contentAPI = {
  getContent: async (type) => {
    const response = await api.get(API_ENDPOINTS.CONTENT(type));
    return response.data;
  },
  
  createContent: async (type, data) => {
    const response = await api.post(API_ENDPOINTS.CONTENT(type), data);
    return response.data;
  },
  
  updateContent: async (type, id, data) => {
    const response = await api.put(API_ENDPOINTS.CONTENT_ITEM(type, id), data);
    return response.data;
  },
  
  deleteContent: async (type, id) => {
    const response = await api.delete(API_ENDPOINTS.CONTENT_ITEM(type, id));
    return response.data;
  },
  
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Helper to get full image URL
export const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/${path}`;
};

export default api;
