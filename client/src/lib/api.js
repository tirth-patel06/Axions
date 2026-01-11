import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ensure cookies (JWT) are sent/received
  timeout: 30000, // 30 second timeout
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Return response data as-is for successful requests
    return response;
  },
  (error) => {
    // Log errors for debugging
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });

    // Handle authentication errors - redirect to login
    if (error.response?.status === 401) {
      // Clear any stale tokens and redirect to login
      // Only redirect if not already on login/auth pages
      const isAuthPage = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/auth') ||
                         window.location.pathname === '/';
      if (!isAuthPage) {
        console.warn('Session expired or invalid - redirecting to login');
        window.location.href = '/login';
      }
    }

    // Rethrow the error for individual handlers to catch
    return Promise.reject(error);
  }
);

export { api, API_BASE_URL };
