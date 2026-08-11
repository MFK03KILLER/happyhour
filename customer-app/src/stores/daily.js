import { defineStore } from 'pinia';
import client from '../api/client';

export const useDailyStore = defineStore('daily', {
  state: () => ({ limit: 1, used: 0, remaining: 1, unlimited: false, loading: false }),
  getters: {
    isExhausted: (s) => !s.unlimited && s.remaining <= 0,
    limitLabel: (s) => (s.unlimited ? '∞' : s.limit),
    remainingLabel: (s) => (s.unlimited ? '∞' : s.remaining),
    label: (s) => (s.unlimited ? 'Unlimited claims (test account)' : `${s.used} of ${s.limit} used today`),
  },
  actions: {
    async refresh() {
      this.loading = true;
      try {
        const { data } = await client.get('/customer/daily-status');
        this.unlimited = !!data.unlimited;
        this.limit = data.limit;
        this.used = data.used;
        this.remaining = data.remaining;
      } catch {} finally { this.loading = false; }
    },
    optimisticIncrement() {
      if (this.unlimited) return;
      this.used = Math.min(this.limit, this.used + 1);
      this.remaining = Math.max(0, this.remaining - 1);
    },
  },
});
