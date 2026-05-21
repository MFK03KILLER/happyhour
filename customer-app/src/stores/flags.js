import { defineStore } from 'pinia';
import client from '../api/client';

export const useFlagsStore = defineStore('flags', {
  state: () => ({ flags: {}, loaded: false }),
  getters: {
    isOn: (s) => (key) => !!s.flags[key],
  },
  actions: {
    async load() {
      if (this.loaded) return;
      try {
        const { data } = await client.get('/public/features');
        this.flags = data.flags || {};
      } catch { this.flags = {}; }
      this.loaded = true;
    },
    async reload() {
      this.loaded = false;
      await this.load();
    },
  },
});
