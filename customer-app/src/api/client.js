import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { saveResponse, readResponse, clearOfflineCache } from './offlineCache';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

function clearSession() {
  clearOfflineCache();
  localStorage.removeItem('hh_access_token');
  localStorage.removeItem('hh_refresh_token');
}

function redirectToLogin() {
  // Native build uses hash history (capacitor://localhost/#/route); a path-based
  // redirect would 404 the file scheme, so navigate via the hash instead.
  if (Capacitor.isNativePlatform()) {
    const h = window.location.hash;
    if (!h.startsWith('#/welcome') && !h.startsWith('#/login') && !h.startsWith('#/register')) {
      window.location.hash = '#/login';
    }
    return;
  }
  if (window.location.pathname !== '/welcome' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/welcome';
  }
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hh_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

function flushQueue(error, token) {
  pendingRequests.forEach((cb) => cb(error, token));
  pendingRequests = [];
}

let offlineNoticeAt = 0;
function noticeOffline() {
  if (Date.now() - offlineNoticeAt < 20000) return;
  offlineNoticeAt = Date.now();
  window.dispatchEvent(new CustomEvent('hh-offline'));
}

client.interceptors.response.use(
  (r) => {
    if ((r.config.method || 'get') === 'get') saveResponse(r.config, r.data);
    return r;
  },
  async (error) => {
    const original = error.config;
    // Weak connection: retry a read once, then fall back to the last copy we saw.
    const isRead = original && (original.method || 'get') === 'get';
    const flaky = !error.response || error.response.status >= 500;
    if (isRead && flaky) {
      if (!original._netRetry) {
        original._netRetry = true;
        await new Promise((r) => setTimeout(r, 900));
        return client(original);
      }
      const cached = readResponse(original);
      if (cached !== null) {
        noticeOffline();
        return { data: cached, status: 200, statusText: 'OK (saved copy)', headers: {}, config: original, fromCache: true };
      }
    }
    if (error.response && error.response.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('hh_refresh_token');
      if (!refreshToken) {
        // A guest on a public page never had a session - fail the call quietly
        // instead of bouncing them to the login wall (App Review 5.1.1(v)).
        if (localStorage.getItem('hh_access_token')) {
          clearSession();
          redirectToLogin();
        }
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((err, token) => {
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
        localStorage.setItem('hh_access_token', data.accessToken);
        localStorage.setItem('hh_refresh_token', data.refreshToken);
        flushQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch (err) {
        flushQueue(err, null);
        clearSession();
        redirectToLogin();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
