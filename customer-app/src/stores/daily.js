import { defineStore } from 'pinia';
import client from '../api/client';

// The member's coupon allowance. There's no daily cap any more: each plan gives
// N coupons per restaurant per month (Basic 1, Gold 2, Premium 4). Refresh with
// a vendorId on a restaurant's page to get what's left there.
// (Still named "daily" so the existing imports keep working.)
export const useDailyStore = defineStore('daily', {
  state: () => ({ tier: 'free', limit: 0, used: 0, remaining: 0, unlimited: false, resetsAt: null, vendorId: null, loading: false }),
  getters: {
    isExhausted: (s) => !s.unlimited && !!s.vendorId && s.remaining <= 0,
    limitLabel: (s) => (s.unlimited ? '∞' : s.limit),
    remainingLabel: (s) => (s.unlimited ? '∞' : s.remaining),
    resetLabel: (s) => (s.resetsAt ? new Date(s.resetsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'the 1st'),
    planLabel: (s) => ({ basic: 'Basic', gold: 'Gold', premium: 'Premium', test: 'Test' }[s.tier] || 'No plan'),
  },
  actions: {
    async refresh(vendorId = null) {
      if (!localStorage.getItem('hh_access_token')) return;
      this.loading = true;
      try {
        const { data } = await client.get('/customer/daily-status', { params: vendorId ? { vendorId } : {} });
        this.tier = data.tier || 'free';
        this.unlimited = !!data.unlimited;
        this.limit = data.perRestaurantMonthly ?? data.limit ?? 0;
        this.used = data.used ?? 0;
        this.remaining = data.remaining ?? this.limit;
        this.resetsAt = data.resetsAt || null;
        this.vendorId = vendorId;
      } catch {} finally { this.loading = false; }
    },
    optimisticIncrement() {
      if (this.unlimited) return;
      this.used = Math.min(this.limit, this.used + 1);
      this.remaining = Math.max(0, this.remaining - 1);
    },
  },
});
