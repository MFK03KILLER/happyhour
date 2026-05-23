<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';
import { useDailyStore } from '../stores/daily';

const items = ref([]);
const loading = ref(true);
const daily = useDailyStore();

onMounted(async () => {
  daily.refresh();
  try {
    const { data } = await client.get('/customer/wallet');
    items.value = data.items;
  } finally { loading.value = false; }
});

function statusLabel(s) {
  return { active: 'Active', fully_redeemed: 'Used up', expired: 'Expired', refunded: 'Refunded' }[s] || s;
}
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Wallet</h1>
        <p class="text-ink-500 mt-1">Your claimed coupons.</p>
      </div>
      <div class="ios-card p-3 text-center">
        <div class="text-[10px] uppercase tracking-wider font-semibold text-ink-500">Today</div>
        <div class="text-xl font-bold text-teal-700">{{ daily.remaining }}<span class="text-sm text-ink-500">/{{ daily.limit }}</span></div>
      </div>
    </header>

    <div v-if="loading" class="px-5 mt-6 space-y-4">
      <div v-for="i in 3" :key="i" class="ios-card h-32 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="px-5 mt-16 text-center">
      <div class="mx-auto w-20 h-20 rounded-3xl bg-cream-200 flex items-center justify-center">
        <i class="fa-solid fa-wallet text-3xl text-ink-300"></i>
      </div>
      <div class="mt-4 font-semibold">No coupons yet</div>
      <p class="text-ink-500 text-sm mt-1">Browse offers and claim your favorites.</p>
      <router-link to="/browse" class="ios-button-primary inline-block mt-5">Browse offers</router-link>
    </div>
    <div v-else class="px-5 mt-6 space-y-4">
      <div v-for="p in items" :key="p._id" class="ios-card overflow-hidden">
        <div class="flex">
          <img :src="p.couponId?.heroImageUrl" class="w-28 h-32 object-cover" />
          <div class="flex-1 p-4 min-w-0">
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider truncate">{{ p.couponId?.vendorId?.name }}</div>
            <div class="font-bold leading-tight truncate">{{ p.couponId?.title }}</div>
            <div class="flex items-center gap-2 mt-2">
              <span class="chip bg-teal-50 text-teal-700">{{ p.usesRemaining }} / {{ p.couponId?.maxUsesPerCustomer }} uses left</span>
              <span class="chip bg-cream-200 text-ink-700">{{ statusLabel(p.status) }}</span>
            </div>
            <div class="mt-3">
              <router-link
                :to="`/wallet/${p._id}/redeem`"
                v-if="p.status === 'active' && p.usesRemaining > 0"
                class="text-sm font-semibold text-teal-700 active:opacity-70"
              >Show to merchant →</router-link>
              <div v-else class="text-sm text-ink-300">Not redeemable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
