<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { persianNumber, permissionLabel } from '../../composables/useFormat';

const auth = useAuthStore();
const stats = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/vendor/stats');
    stats.value = data;
  } finally { loading.value = false; }
});
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold">داشبورد بیزنس</h1>
    <p class="text-ink-500 mt-1">عملکرد همه شعب شما</p>

    <div v-if="auth.user?.permissions?.length" class="mt-3 flex gap-1.5 flex-wrap">
      <span v-for="p in auth.user.permissions" :key="p" class="chip bg-teal-50 text-teal-700 text-[10px]">
        {{ permissionLabel(p) }}
      </span>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-28 animate-pulse"></div>
    </div>
    <div v-else-if="stats" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="ios-card p-5 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">امروز</div>
        <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.today) }}</div>
        <div class="text-xs opacity-80 mt-1">استفاده کوپن</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">این هفته</div>
        <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.week) }}</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">این ماه</div>
        <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.month) }}</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">شعب فعال</div>
        <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.merchantCount) }}</div>
      </div>
    </div>
  </div>
</template>
