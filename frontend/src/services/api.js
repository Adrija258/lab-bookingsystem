/**
 * API Service
 * Centralized Axios configuration and all API calls
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========================
// AUTH SERVICES
// ========================
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  deleteAccount: () => api.delete('/auth/me'),
  getAllUsers: () => api.get('/auth/users'),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  createUser: (data) => api.post('/auth/users', data)
};

// ========================
// EQUIPMENT SERVICES
// ========================
export const equipmentService = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  getReleased: () => api.get('/equipment/released'),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`)
};

// ========================
// BOOKING SERVICES
// ========================
export const labService = {
  getAll: () => api.get('/labs'),
  create: (data) => api.post('/labs', data),
  update: (id, data) => api.put(`/labs/${id}`, data),
  delete: (id) => api.delete(`/labs/${id}`)
};

export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }),
  getPendingAttendance: () => api.get('/bookings/pending'),
  markPresent: (id) => api.patch(`/bookings/${id}/mark-present`),
  markAbsent: (id) => api.patch(`/bookings/${id}/mark-absent`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, data) => api.put(`/bookings/${id}`, data),
  getStats: () => api.get('/bookings/stats'),
  getBookingCount: (equipmentId) => api.get(`/bookings/count/${equipmentId}`)
};

export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  create: (data) => api.post('/courses', data)
};

export const experimentService = {
  getByCourse: (courseId) => api.get(`/experiments/course/${courseId}`),
  create: (data) => api.post('/experiments', data)
};

export const groupService = {
  create: (data) => api.post('/groups', data)
};

export default api;
