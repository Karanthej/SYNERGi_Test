import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Derive the server base (no /api/v1 suffix) from the API URL env var.
// When VITE_API_URL is absolute (production), strip /api/v1 to get the server root.
// When VITE_API_URL is relative (dev, Vite proxy), use empty string so relative image
// paths are requested from the Vite origin and the /uploads proxy forwards them.
const _apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1026/api/v1';
export const SERVER_BASE = _apiUrl.startsWith('http')
  ? _apiUrl.replace(/\/api\/v1\/?$/, '')
  : '';


export const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  const baseUrl = url.startsWith('/') ? `${SERVER_BASE}${url}` : `${SERVER_BASE}/${url}`;
  
  // Clerk sets cookies for authentication, so the browser handles this natively.
  
  return baseUrl;
};

