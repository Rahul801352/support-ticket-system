import axios from 'axios';

let rawBaseUrl = 
  import.meta?.env?.VITE_API_BASE_URL || 
  process.env.VITE_API_BASE_URL || 
  process.env.REACT_APP_API_URL || 
  'http://localhost:5000/api';

// Clean trailing slashes
let cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');

// Ensure /api suffix exists
if (!cleanBaseUrl.endsWith('/api')) {
  cleanBaseUrl += '/api';
}

const axiosInstance = axios.create({
  baseURL: cleanBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: Attach JWT Bearer Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Global 401 Unauthorized handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthPath = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthPath) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
