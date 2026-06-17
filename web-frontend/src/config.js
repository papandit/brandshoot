// Backend API Configuration
// Local dev: port 5000, Production Docker: port 1300
// NOTE: use 127.0.0.1 (not localhost) — another app on this machine occupies port 5000 on IPv6.
// export const API_BASE_URL = 'http://72.62.79.188:1300';
export const API_BASE_URL = 'http://127.0.0.1:5000';


export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  VERIFY_TOKEN: '/auth/verify-token',
  
  // Admin Dashboard
  DASHBOARD: '/admin/dashboard',
  SETTINGS: '/admin/settings',
  APP_CONFIG: '/admin/app-config',
  
  // Users
  USERS: '/admin/users',
  USER_DETAIL: (userId) => `/admin/users/${userId}`,
  USER_GENERATIONS: (userId) => `/admin/users/${userId}/generations`,
  UPDATE_USER_STATUS: (userId) => `/admin/users/${userId}/status`,
  ADD_USER_CREDITS: (userId) => `/admin/users/${userId}/credits`,
  
  // Token Stats
  TOKEN_STATS: '/admin/token-stats',
  
  // Content Management
  CONTENT: (type) => `/admin/content/${type}`,
  CONTENT_ITEM: (type, id) => `/admin/content/${type}/${id}`,
  UPLOAD_IMAGE: '/admin/content/upload',
};
