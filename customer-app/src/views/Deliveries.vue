<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useFlagsStore } from '../stores/flags';

const router = useRouter();
const flags = useFlagsStore();
const items = ref([]);
const loading = ref(true);

const STATUS_META = {
  pending: { label: 'Waiting for store', color: 'bg-amber-50 text-amber-700', icon: 'fa-hourglass-half' },
  confirmed: { label: 'Confirmed', color: 'bg-teal-50 text-teal-700', icon: 'fa-circle-check' },
  preparing: { label: 'Preparing', color: 'bg-teal-50 text-teal-700', icon: 'fa-fire-burner' },
  out_for_delivery: { label: 'On the way', color: 'bg-purple-50 text-purple-700', icon: 'fa-motorcycle' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: 'fa-box-open' },
  cancelled: { label: 'Cancelled', color: 'bg-cream-200 text-ink-500', icon: 'fa-ban' },
};

onMounted(async () => {
  await flags.load();
  if (!flags.isOn('delivery')) { loading.value = false; return; }
  try {
    const { data } = await client.get('/customer/deliveries');
    items.value = data.items || [];
  } finally { loading.value = false; }
});
</script>

<template>
  <div class="min-h-screen pb-12 safe-top bg-cream-100">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Deliveries</div>
    </header>

    <!-- Coming soon state -->
    <div v-if="!flags.isOn('delivery')" class="px-5 mt-16 text-center">
      <div class="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-lift">
        <i class="fa-solid fa-truck-fast text-4xl text-white"></i>
      </div>
      <h1 class="mt-5 text-2xl font-bold tracking-tight">Delivery is coming soon</h1>
      <p class="text-ink-500 mt-2 leading-relaxed max-w-xs mx-auto">
        Soon you'll get surprise bags delivered right to your door. We're putting the finishing touches on it — stay tuned! 🚚
      </p>
      <router-link to="/browse" class="ios-button-primary inline-block mt-6">Browse offers</router-link>
    </div>

    <template v-else>
      <div v-if="loading" class="px-5 mt-6 space-y-4">
        <div v-for="i in 3" :key="i" class="ios-card h-28 animate-pulse"></div>
      </div>
      <div v-else-if="items.length === 0" class="px-5 mt-16 text-center">
        <div class="mx-auto w-20 h-20 rounded-3xl bg-cream-200 flex items-center justify-center">
          <i class="fa-solid fa-truck-fast text-3xl text-ink-300"></i>
        </div>
        <div class="mt-4 font-semibold">No deliveries yet</div>
        <p class="text-ink-500 text-sm mt-1">Order a surprise bag with delivery and track it here.</p>
        <router-link to="/tonight" class="ios-button-primary inline-block mt-5">Tonight's deals</router-link>
      </div>
      <div v-else class="px-5 mt-4 space-y-3">
        <router-link v-for="d in items" :key="d._id" :to="`/deliveries/${d._id}`" class="block ios-card p-4 active:bg-cream-100">
          <div class="flex items-center gap-3">
            <img :src="d.couponId?.heroImageUrl" class="w-14 h-14 rounded-2xl object-cover bg-cream-200 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate">{{ d.itemLabel }}</div>
              <div class="text-xs text-ink-500 truncate">{{ d.merchantId?.name }}</div>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="chip text-[10px]" :class="STATUS_META[d.status]?.color">
                  <i class="fa-solid text-[9px]" :class="STATUS_META[d.status]?.icon"></i>
                  {{ STATUS_META[d.status]?.label }}
                </span>
                <span class="chip bg-cream-200 text-ink-500 text-[10px] font-mono">{{ d.trackingCode }}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-bold text-teal-700">${{ (d.totalUSD || 0).toFixed(2) }}</div>
              <div class="text-[10px] text-ink-300">{{ new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</div>
            </div>
          </div>
        </router-link>
      </div>
    </template>
  </div>
</template>
