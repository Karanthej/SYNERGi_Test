import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Removed Clerk from global

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1026/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config) => {
    // Attempt to get token from Clerk first
    let token = null;
    if (window.Clerk && window.Clerk.session) {
      try {
        token = await window.Clerk.session.getToken();
      } catch (e) {
        console.error("Failed to fetch Clerk token", e);
      }
    }
    
    // Fallback to local storage removed as Clerk is the sole provider

    if (token) {
      // Don't overwrite if explicitly provided in the request config
      if (config.headers && typeof config.headers.has === 'function' && !config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Debounce guard so repeated network errors don't spam redirects
let offlineRedirectScheduled = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      // Only treat as offline when the browser itself reports no connectivity.
      // A missing response can also mean the backend is temporarily unavailable
      // (e.g. restarting), a CORS error, or a request timeout — none of which
      // mean the user's internet is gone.
      if (!axios.isCancel(error) && !navigator.onLine && !offlineRedirectScheduled) {
        offlineRedirectScheduled = true;
        // Small delay so rapid sequential failures don't each trigger a redirect
        setTimeout(() => {
          offlineRedirectScheduled = false;
          if (!navigator.onLine) {
            sessionStorage.setItem("preOfflinePath", window.location.pathname + window.location.search);
            window.location.href = '/offline';
          }
        }, 1500);
      }
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Handle standard HTTP errors by redirecting globally where appropriate.
    if (status === 401) {
       useAuthStore.getState().logout();
    } else if (status === 503) {
      window.location.href = '/maintenance';
    }

    return Promise.reject(error);
  }
);
