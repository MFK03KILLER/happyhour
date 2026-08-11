<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';

const router = useRouter();
const loading = ref(true);
const paymentsProvider = ref('mock');
const payments = ref([]);

const isLive = computed(() => paymentsProvider.value === 'stripe');

onMounted(async () => {
  try {
    const [sub, hist] = await Promise.all([
      client.get('/customer/subscription'),
      client.get('/customer/payments').catch(() => ({ data: { items: [] } })),
    ]);
    paymentsProvider.value = sub.data.paymentsProvider || 'mock';
    payments.value = hist.data.items || [];
  } finally { loading.value = false; }
});

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<template>
  <div class="min-h-screen pb-12 safe-top bg-cream-100">
    <header class="px-5 pt-4 flex items-center bg-white border-b border-cream-200 pb-3">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Payment methods</div>
    </header>

    <!-- How payment works -->
    <section class="px-5 mt-5">
      <div v-if="isLive" class="ios-card p-5">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-lock text-lg"></i>
          </div>
          <div class="min-w-0">
            <div class="font-bold">Secured by Stripe</div>
            <p class="text-sm text-ink-700 mt-1 leading-relaxed">
              You enter your card on Stripe's secure checkout page each time you subscribe or buy.
              Happy Hour never sees or stores your card details.
            </p>
          </div>
        </div>
      </div>

      <div v-else class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Demo mode</div>
        <p class="text-sm text-ink-700 mt-2 leading-relaxed">
          Payments are simulated in this build — no real card data is collected, stored, or charged.
        </p>
      </div>
    </section>

    <!-- Payment history -->
    <section class="px-5 mt-5">
      <h2 class="text-sm font-bold text-ink-500 uppercase tracking-wider mb-2">Payment history</h2>

      <div v-if="loading" class="space-y-2">
        <div v-for="i in 2" :key="i" class="ios-card h-16 animate-pulse"></div>
      </div>

      <div v-else-if="payments.length === 0" class="ios-card p-6 text-center">
        <i class="fa-regular fa-credit-card text-3xl text-ink-300"></i>
        <div class="mt-2 text-sm text-ink-500">No payments yet</div>
      </div>

      <div v-else class="ios-card divide-y divide-cream-200">
        <div v-for="p in payments" :key="p._id" class="p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cream-200 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-receipt text-ink-500"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">{{ p.context?.label || 'Payment' }}</div>
            <div class="text-xs text-ink-500">
              {{ fmtDate(p.createdAt) }}
              <span v-if="p.brand"> · {{ p.brand }}<span v-if="p.last4"> ••••{{ p.last4 }}</span></span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="font-bold">${{ (p.amountUSD || 0).toFixed(2) }}</div>
            <div v-if="p.context?.discountUSD > 0" class="text-[10px] text-green-700 font-semibold">
              −${{ p.context.discountUSD.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="px-5 mt-5">
      <router-link to="/subscribe" class="ios-card w-full p-4 flex items-center justify-between active:bg-cream-100">
        <span class="font-medium">Manage membership</span>
        <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m9 5 7 7-7 7"/></svg>
      </router-link>
    </section>
  </div>
</template>
