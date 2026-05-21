<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';
import { toman } from '../composables/useFormat';

const items = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/customer/orders');
    items.value = data.items;
  } finally { loading.value = false; }
});
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">سفارش‌ها</h1>
      <p class="text-ink-500 mt-1">سابقه استفاده از کوپن‌ها.</p>
    </header>

    <div v-if="loading" class="px-5 mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-24 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="px-5 mt-16 text-center text-ink-500">
      هنوز سفارشی نداشته‌اید — اولین کوپن خود را دریافت کنید.
    </div>
    <div v-else class="px-5 mt-6 space-y-3">
      <router-link v-for="o in items" :key="o._id" :to="`/orders/${o._id}`" class="block ios-card p-4 active:scale-[.99] transition">
        <div class="flex items-center gap-3">
          <img :src="o.merchantId?.logoUrl" class="w-12 h-12 rounded-full object-cover bg-cream-200" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">{{ o.merchantId?.name }}</div>
            <div class="text-sm text-ink-500 truncate">{{ o.couponId?.title }}</div>
          </div>
          <div class="text-left">
            <div class="text-[11px] text-ink-300">{{ new Date(o.scannedAt).toLocaleDateString('fa-IR', { month:'long', day:'numeric'}) }}</div>
            <div class="text-sm font-semibold text-teal-700">{{ toman(o.amountSavedUSD || 0) }}</div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
