import { defineStore } from 'pinia';
import client from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('hh_m_access_token') || null,
    refreshToken: localStorage.getItem('hh_m_refresh_token') || null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.accessToken,
    isAdmin: (s) => s.user?.role === 'admin',
    isMerchantStaff: (s) => s.user?.role === 'merchant_staff',
    isVendor: (s) => s.user?.role === 'vendor',
  },
  actions: {
    async login(email, password) {
      const { data } = await client.post('/auth/login', { email, password });
      this.user = data.user;
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      localStorage.setItem('hh_m_access_token', data.accessToken);
      localStorage.setItem('hh_m_refresh_token', data.refreshToken);
      // Belt-and-suspenders: fetch the full /auth/me so we always have the
      // latest permissions + planTier (in case the login response shape ever drifts).
      try { await this.fetchMe(); } catch {}
      return this.user;
    },
    async fetchMe() {
      if (!this.accessToken) return null;
      const { data } = await client.get('/auth/me');
      this.user = data.user;
      return this.user;
    },
    async logout() {
      try { await client.post('/auth/logout', { refreshToken: this.refreshToken }); } catch {}
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('hh_m_access_token');
      localStorage.removeItem('hh_m_refresh_token');
    },
  },
});
