<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const stats = ref(null);
const loading = ref(true);
onMounted(async () => {
  try {
    const { data } = await client.get('/admin/stats/overview');
    stats.value = data;
  } finally { loading.value = false; }
});
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
    <p class="text-ink-500 mt-1">Platform overview</p>

    <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-28 animate-pulse"></div>
    </div>
    <div v-else-if="stats" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Today</div>
        <div class="text-3xl font-bold mt-2">{{ stats.todayRedemptions }}</div>
        <div class="text-xs text-ink-300 mt-1">Redemptions</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">All time</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalRedemptions }}</div>
        <div class="text-xs text-ink-300 mt-1">Redemptions</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Customers</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalCustomers }}</div>
        <div class="text-xs text-ink-300 mt-1">Registered</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Merchants</div>
        <div class="text-3xl font-bold mt-2">{{ stats.totalMerchants }}</div>
        <div class="text-xs text-ink-300 mt-1">{{ stats.totalVendors }} vendors</div>
      </div>
    </div>

    <div v-if="stats?.topMerchant" class="mt-6 ios-card p-5">
      <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Top merchant</div>
      <div class="flex items-center gap-3 mt-3">
        <img v-if="stats.topMerchant.merchant.logoUrl" :src="stats.topMerchant.merchant.logoUrl" class="w-12 h-12 rounded-xl object-cover bg-cream-200" />
        <div>
          <div class="font-bold">{{ stats.topMerchant.merchant.name }}</div>
          <div class="text-sm text-ink-500">{{ stats.topMerchant.count }} redemptions</div>
        </div>
      </div>
    </div>
  </div>
</template>
