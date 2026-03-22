import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const submitReport = (data) => api.post('/report', data);
export const getReports = () => api.get('/reports');
export const updateStatus = (id, status) => api.put(`/report/${id}`, { status });
export const deleteReport = (id) => api.delete(`/report/${id}`);
export const adminLogin = (credentials) => api.post('/admin/login', credentials);

export default api;
