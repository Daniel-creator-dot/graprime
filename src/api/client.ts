import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (data: any) => client.post('/auth/login', data),
  forgotPassword: (username: string) => client.post('/auth/forgot-password', { username }),
  resetPassword: (data: any) => client.post('/auth/reset-password', data),
};

export default client;

export const appointmentsApi = {
  getAll: () => client.get('/appointments'),
  create: (data: any) => client.post('/appointments', data),
  update: (id: number, data: any) => client.patch(`/appointments/${id}`, data),
  updateStatus: (id: number, status: string) => client.patch(`/appointments/${id}/status`, { status }),
};

export const doctorsApi = {
  getAll: () => client.get('/doctors'),
  create: (data: any) => client.post('/doctors', data),
  update: (id: number, data: any) => client.put(`/doctors/${id}`, data),
  updateStatus: (id: number, is_active: boolean) => client.patch(`/doctors/${id}/status`, { is_active }),
};

export const analyticsApi = {
  getDashboardStats: () => client.get('/analytics/dashboard'),
};

export const notificationsApi = {
  getAll: () => client.get('/notifications'),
  markAllRead: () => client.patch('/notifications/read'),
};


export const usersApi = {
  getAll: () => client.get('/users'),
  create: (data: any) => client.post('/users', data),
  update: (id: number, data: any) => client.put(`/users/${id}`, data),
  delete: (id: number) => client.delete(`/users/${id}`),
};

export const settingsApi = {
  getAll: () => client.get('/settings'),
  update: (data: any) => client.patch('/settings', data),
};
