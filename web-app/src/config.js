// Backend API Configuration (same backend + MongoDB as the mobile app)
// Local dev: port 5000, Production Docker: port 1300
// NOTE: use 127.0.0.1 (not localhost) — another app on this machine occupies port 5000 on IPv6.
// export const API_BASE_URL = 'http://72.62.79.188:1300';
export const API_BASE_URL = 'http://127.0.0.1:5000';

// Convert a relative upload path (e.g. "uploads/xyz.png") to a full URL
export function getFullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_BASE_URL}/${path}`;
}
