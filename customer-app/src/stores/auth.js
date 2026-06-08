import { defineStore } from 'pinia';
import client from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('hh_access_token') || null,
    refreshToken: localStorage.getItem('hh_refresh_token') || null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.accessToken,
  },
  actions: {
    async login(email, password) {
      const { data } = await client.post('/auth/login', { email, password });
      this.setSession(data);
      try { await this.fetchMe(); } catch {}
      return data.user;
    },
    async verifyOtp({ phone, code, fullName }) {
      const { data } = await client.post('/auth/otp/verify', { phone, code, fullName });
      this.setSession(data);
      try { await this.fetchMe(); } catch {}
      return data.user;
    },
    async loginWithGoogle(idToken, acceptedTermsVersion) {
      const { data } = await client.post('/auth/google', { idToken, acceptedTermsVersion });
      this.setSession(data);
      return data.user;
    },
    async loginWithApple({ idToken, fullName, acceptedTermsVersion }) {
      const { data } = await client.post('/auth/apple', { idToken, fullName, acceptedTermsVersion });
      this.setSession(data);
      return data.user;
    },
    async fetchMe() {
      if (!this.accessToken) return null;
      const { data } = await client.get('/auth/me');
      this.user = data.user;
      return this.user;
    },
    async logout() {
      try { await client.post('/auth/logout', { refreshToken: this.refreshToken }); } catch {}
      this.clearSession();
    },
    setSession(data) {
      this.user = data.user;
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      localStorage.setItem('hh_access_token', data.accessToken);
      localStorage.setItem('hh_refresh_token', data.refreshToken);
    },
    clearSession() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('hh_access_token');
      localStorage.removeItem('hh_refresh_token');
      localStorage.removeItem('hh_onboarded');
      sessionStorage.removeItem('hh_splash_shown');
    },
  },
});
