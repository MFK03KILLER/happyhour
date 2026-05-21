<script setup>
import { onMounted, ref, watch } from 'vue';
import client from '../../api/client';

const items = ref([]);
const total = ref(0);
const page = ref(1);
const limit = 20;
const loading = ref(true);
const filters = ref({ method: '', kind: '', status: '' });

async function load() {
  loading.value = true;
  try {
    const params = { page: page.value, limit };
    if (filters.value.method) params.method = filters.value.method;
    if (filters.value.kind) params.kind = filters.value.kind;
    if (filters.value.status) params.status = filters.value.status;
    const { data } = await client.get('/admin/payments', { params });
    items.value = data.items;
    total.value = data.total;
  } finally { loading.value = false; }
}

onMounted(load);
watch(filters, load, { deep: true });
watch(page, load);

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); }
function fmtDate(d) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function methodLabel(m) {
  return { apple_pay: 'Apple Pay', google_pay: 'Google Pay', card: 'Card', paypal: 'PayPal' }[m] || m;
}
function methodColor(m) {
  return { apple_pay: 'bg-black/10 text-ink-900', google_pay: 'bg-blue-100 text-blue-700', card: 'bg-purple-100 text-purple-700', paypal: 'bg-yellow-100 text-yellow-700' }[m] || 'bg-cream-200 text-ink-700';
}
function kindLabel(k) {
  return { subscription: 'Subscription', coupon_purchase: 'Coupon purchase', other: 'Other' }[k] || 'Other';
}
function kindColor(k) {
  return { subscription: 'bg-teal-50 text-teal-700', coupon_purchase: 'bg-coral-500/10 text-coral-600', other: 'bg-cream-200 text-ink-700' }[k] || 'bg-cream-200 text-ink-700';
}
function statusColor(s) {
  return { succeeded: 'bg-green-100 text-green-700', failed: 'bg-coral-500/10 text-coral-600', refunded: 'bg-cream-200 text-ink-500' }[s] || 'bg-cream-200 text-ink-500';
}
function totalPages() { return Math.max(1, Math.ceil(total.value / limit)); }
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Payments</h1>
        <p class="text-ink-500 mt-1">All transactions across the platform</p>
      </div>
      <div class="text-sm text-ink-500">{{ total }} total</div>
    </div>

    <div class="mt-6 ios-card p-4 flex flex-wrap gap-3">
      <select v-model="filters.method" class="input md:max-w-[200px]">
        <option value="">All methods</option>
        <option value="apple_pay">Apple Pay</option>
        <option value="google_pay">Google Pay</option>
        <option value="card">Card</option>
        <option value="paypal">PayPal</option>
      </select>
      <select v-model="filters.kind" class="input md:max-w-[200px]">
        <option value="">All kinds</option>
        <option value="subscription">Subscriptions</option>
        <option value="coupon_purchase">Coupon purchases</option>
        <option value="other">Other</option>
      </select>
      <select v-model="filters.status" class="input md:max-w-[200px]">
        <option value="">All statuses</option>
        <option value="succeeded">Succeeded</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
      </select>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 8" :key="i" class="ios-card h-16 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-12 text-center text-ink-500">No payments match.</div>
    <div v-else class="mt-6">
      <div class="hidden md:block ios-card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-cream-100 text-left">
            <tr>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase tracking-wider">When</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase tracking-wider">Customer</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase tracking-wider">Kind</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase tracking-wider">Item</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase tracking-wider">Method</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cream-200">
            <tr v-for="p in items" :key="p._id" class="hover:bg-cream-100/50">
              <td class="px-4 py-3 text-ink-700">{{ fmtDate(p.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="font-semibold">{{ p.customerId?.fullName }}</div>
                <div class="text-xs text-ink-500">{{ p.customerId?.email }}</div>
              </td>
              <td class="px-4 py-3"><span class="chip" :class="kindColor(p.context?.kind)">{{ kindLabel(p.context?.kind) }}</span></td>
              <td class="px-4 py-3 text-ink-700 truncate max-w-[200px]">{{ p.context?.label || '—' }}</td>
              <td class="px-4 py-3"><span class="chip" :class="methodColor(p.method)">{{ methodLabel(p.method) }} · {{ p.last4 }}</span></td>
              <td class="px-4 py-3"><span class="chip" :class="statusColor(p.status)">{{ p.status }}</span></td>
              <td class="px-4 py-3 text-right font-bold text-teal-700">{{ fmt(p.amountUSD) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div v-for="p in items" :key="p._id" class="ios-card p-4">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <div class="font-semibold truncate">{{ p.customerId?.fullName }}</div>
              <div class="text-xs text-ink-500 truncate">{{ p.context?.label }}</div>
              <div class="text-[10px] text-ink-300 mt-0.5">{{ fmtDate(p.createdAt) }}</div>
            </div>
            <div class="text-right">
              <div class="font-bold text-teal-700">{{ fmt(p.amountUSD) }}</div>
              <span class="chip text-[10px]" :class="statusColor(p.status)">{{ p.status }}</span>
            </div>
          </div>
          <div class="flex gap-1.5 mt-2 flex-wrap">
            <span class="chip text-[10px]" :class="kindColor(p.context?.kind)">{{ kindLabel(p.context?.kind) }}</span>
            <span class="chip text-[10px]" :class="methodColor(p.method)">{{ methodLabel(p.method) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <button @click="page > 1 && (page--)" :disabled="page <= 1" class="ios-card px-4 py-2 text-sm font-semibold disabled:opacity-40 active:scale-95">
          ← Previous
        </button>
        <div class="text-sm text-ink-500">Page {{ page }} of {{ totalPages() }}</div>
        <button @click="page < totalPages() && (page++)" :disabled="page >= totalPages()" class="ios-card px-4 py-2 text-sm font-semibold disabled:opacity-40 active:scale-95">
          Next →
        </button>
      </div>
    </div>
  </div>
</template>
