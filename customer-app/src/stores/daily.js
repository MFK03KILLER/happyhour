import { defineStore } from 'pinia';
import client from '../api/client';

export const useDailyStore = defineStore('daily', {
  state: () => ({ limit: 3, used: 0, remaining: 3, loading: false }),
  getters: {
    isExhausted: (s) => s.remaining <= 0,
    label: (s) => `${s.used} of ${s.limit} used today`,
  },
  actions: {
    async refresh() {
      this.loading = true;
      try {
        const { data } = await client.get('/customer/daily-status');
        this.limit = data.limit;
        this.used = data.used;
        this.remaining = data.remaining;
      } catch {} finally { this.loading = false; }
    },
    optimisticIncrement() {
      this.used = Math.min(this.limit, this.used + 1);
      this.remaining = Math.max(0, this.remaining - 1);
    },
  },
});
