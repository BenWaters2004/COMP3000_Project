// frontend/src/lib/api.js
import axios from 'axios';
const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';


const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: Add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 (unauthorized) - auto-logout and redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;
    if (response?.status === 401 && !config.skipAuthRedirect) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials); // Adjust endpoint if needed
  const { token } = response.data;
  localStorage.setItem('auth_token', token);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/logout');
  } catch (err) {
    console.warn('Logout API call failed, but token cleared locally:', err);
  } finally {
    localStorage.removeItem('auth_token');
    window.location.href = '/login'; // Redirect to login
  }
};

export const getMe = async () => {
  return api.get('/me');
};

// Export the instance as named export for other calls
export { api };