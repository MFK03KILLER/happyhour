<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';
import { toman, persianDateTime } from '../composables/useFormat';

const items = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/merchant/redemptions');
    items.value = data.items;
  } finally { loading.value = false; }
});

function initials(name) {
  if (!name) return '؟';
  return name.split(' ').slice(0, 2).map((s) => s[0]).join('');
}
</script>

<template>
  <div class="min-h-screen bg-cream-100 pb-28">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white safe-top px-5 pb-8 rounded-b-3xl">
      <div class="pt-2">
        <div class="text-xs opacity-80 font-semibold uppercase tracking-wider">استفاده‌های اخیر</div>
        <h1 class="text-2xl font-bold mt-0.5">تاریخچه</h1>
      </div>
    </header>

    <div v-if="loading" class="px-5 -mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="px-5 mt-12 text-center text-ink-500">هنوز هیچ استفاده‌ای ثبت نشده.</div>
    <div v-else class="px-5 -mt-6 space-y-3">
      <div v-for="r in items" :key="r._id" class="ios-card p-4 flex items-center gap-3">
        <div class="w-11 h-11 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center">
          {{ initials(r.customerId?.fullName || r.customerSnapshot?.name) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ r.customerId?.fullName || r.customerSnapshot?.name }}</div>
          <div class="text-sm text-ink-500 truncate">{{ r.couponId?.title }}</div>
        </div>
        <div class="text-left">
          <div class="text-[11px] text-ink-300">{{ persianDateTime(r.scannedAt) }}</div>
          <div class="text-sm font-semibold text-teal-700">{{ toman(r.amountSavedUSD || 0) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
