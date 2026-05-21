<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';

const stats = ref(null);
const recentPayments = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([
      client.get('/admin/stats/overview'),
      client.get('/admin/payments?limit=5'),
    ]);
    stats.value = s.data;
    recentPayments.value = p.data.items;
  } finally { loading.value = false; }
});

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}
function timeAgo(d) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
function methodLabel(m) {
  return { apple_pay: 'Apple Pay', google_pay: 'Google Pay', card: 'Card', paypal: 'PayPal' }[m] || m;
}
function kindLabel(k) {
  return { subscription: 'Subscription', coupon_purchase: 'Coupon', other: 'Other' }[k] || k;
}
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
    <p class="text-ink-500 mt-1">Platform overview</p>

    <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="ios-card h-28 animate-pulse"></div>
    </div>

    <template v-else-if="stats">
      <div class="mt-6">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3">Revenue</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="ios-card p-5 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
            <div class="text-xs uppercase tracking-wider font-semibold opacity-80">Today</div>
            <div class="text-3xl font-bold mt-2">{{ fmt(stats.revenue?.today?.total) }}</div>
            <div class="text-xs opacity-80 mt-1">{{ stats.revenue?.today?.count || 0 }} payments</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">This week</div>
            <div class="text-3xl font-bold mt-2">{{ fmt(stats.revenue?.week?.total) }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ stats.revenue?.week?.count || 0 }} payments</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">This month</div>
            <div class="text-3xl font-bold mt-2">{{ fmt(stats.revenue?.month?.total) }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ stats.revenue?.month?.count || 0 }} payments</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">All time</div>
            <div class="text-3xl font-bold mt-2">{{ fmt(stats.revenue?.allTime?.total) }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ stats.revenue?.allTime?.count || 0 }} payments</div>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3">Activity</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Redemptions today</div>
            <div class="text-3xl font-bold mt-2">{{ stats.todayRedemptions }}</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Redemptions total</div>
            <div class="text-3xl font-bold mt-2">{{ stats.totalRedemptions }}</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Customers</div>
            <div class="text-3xl font-bold mt-2">{{ stats.totalCustomers }}</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Merchants</div>
            <div class="text-3xl font-bold mt-2">{{ stats.totalMerchants }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ stats.totalVendors }} vendors</div>
          </div>
        </div>
      </div>

      <div class="mt-8 grid md:grid-cols-2 gap-4">
        <div v-if="stats.topMerchant" class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Top merchant</div>
          <div class="flex items-center gap-3 mt-3">
            <img v-if="stats.topMerchant.merchant.logoUrl" :src="stats.topMerchant.merchant.logoUrl" class="w-12 h-12 rounded-xl object-cover bg-cream-200" />
            <div>
              <div class="font-bold">{{ stats.topMerchant.merchant.name }}</div>
              <div class="text-sm text-ink-500">{{ stats.topMerchant.count }} redemptions</div>
            </div>
          </div>
        </div>

        <div class="ios-card p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Recent payments</div>
            <router-link to="/admin/payments" class="text-sm font-semibold text-teal-700">See all →</router-link>
          </div>
          <div v-if="!recentPayments.length" class="text-sm text-ink-300">No payments yet.</div>
          <div v-else class="space-y-3">
            <div v-for="p in recentPayments" :key="p._id" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
                {{ (p.customerId?.fullName || '?').charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">{{ p.customerId?.fullName }}</div>
                <div class="text-xs text-ink-500 truncate">{{ kindLabel(p.context?.kind) }} · {{ p.context?.label }}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="font-bold text-teal-700">{{ fmt(p.amountUSD) }}</div>
                <div class="text-[10px] text-ink-300">{{ timeAgo(p.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
