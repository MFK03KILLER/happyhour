import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hh_m_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];
function flush(err, token) { queue.forEach((cb) => cb(err, token)); queue = []; }

client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response && error.response.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('hh_m_refresh_token');
      if (!refreshToken) return Promise.reject(error);
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((err, token) => {
            if (err) return reject(err);
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('hh_m_access_token', data.accessToken);
        localStorage.setItem('hh_m_refresh_token', data.refreshToken);
        flush(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch (err) {
        flush(err, null);
        localStorage.removeItem('hh_m_access_token');
        localStorage.removeItem('hh_m_refresh_token');
        if (Capacitor.isNativePlatform()) window.location.hash = '#/login';
        else window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
