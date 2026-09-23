import { defineStore } from 'pinia';
import client from '../api/client';

// Live membership prices, set by admins in the admin panel. Never hard-code a
// price in a template - it goes stale the moment the admin changes it.
// /public/plans needs no account, so this works for guests too.
export const usePricingStore = defineStore('pricing', {
  state: () => ({ plans: [], loaded: false }),
  getters: {
    plan: (s) => (tier) => s.plans.find((p) => p.tier === tier) || null,
    // The entry-level paid plan, shown on "become a member" prompts.
    gold: (s) => s.plans.find((p) => p.tier === 'gold') || null,
  },
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return;
      try {
        const { data } = await client.get('/public/plans', { params: { audience: 'customer' } });
        this.plans = data.plans || [];
        this.loaded = true;
      } catch {
        // Leave prices hidden rather than show a wrong one.
      }
    },
  },
});

// "$12.99", or "$15" for whole amounts.
export function formatUSD(n) {
  const value = Number(n) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
