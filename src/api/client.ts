import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Add interceptor to handle expired tokens (401 Unauthorized)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/'; // Or trigger your logout flow
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => client.post('/auth/login', data),
  register: (data: any) => client.post('/auth/register', data),
  forgotPassword: (username: string) => client.post('/auth/forgot-password', { username }),
  resetPassword: (data: any) => client.post('/auth/reset-password', data),
};

export default client;

export const appointmentsApi = {
  getAll: () => client.get('/appointments'),
  getMyAppointments: () => client.get('/appointments/my'),
  create: (data: any) => client.post('/appointments', data),
  update: (id: number, data: any) => client.patch(`/appointments/${id}`, data),
  updateStatus: (id: number, status: string) => client.patch(`/appointments/${id}/status`, { status }),
  initializePayment: (id: number) => client.post(`/appointments/${id}/pay`),
  generateMeetingLink: (id: number) => client.post(`/appointments/${id}/generate-link`),
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

export const prescriptionsApi = {
  getAll: () => client.get('/prescriptions'),
  getMy: () => client.get('/prescriptions/my'),
  create: (data: any) => client.post('/prescriptions', data),
  delete: (id: number) => client.delete(`/prescriptions/${id}`),
};

export const consultationsApi = {
  getByAppointment: (appointmentId: number) => client.get(`/consultations/${appointmentId}`),
  create: (data: any) => client.post('/consultations', data),
  update: (id: number, data: any) => client.put(`/consultations/${id}`, data),
};

export const labsApi = {
  getAll: (params?: any) => client.get('/labs', { params }),
  create: (data: any) => client.post('/labs', data),
  update: (id: number, data: any) => client.put(`/labs/${id}`, data),
};

export const scansApi = {
  getAll: (params?: any) => client.get('/scans', { params }),
  create: (data: any) => client.post('/scans', data),
  update: (id: number, data: any) => client.put(`/scans/${id}`, data),
};

export const patientHistoryApi = {
  getByPatient: (patientId: number) => client.get(`/patients/${patientId}/history`),
  getByAppointment: (appointmentId: number) => client.get(`/appointments/${appointmentId}/history`),
};
