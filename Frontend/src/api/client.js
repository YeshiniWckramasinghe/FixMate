import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request once the user is logged in
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('fixmate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on an expired/invalid token
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fixmate_token');
      localStorage.removeItem('fixmate_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

export default client;
