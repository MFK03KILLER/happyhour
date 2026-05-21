<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const stats = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const canSee = (auth.user?.permissions || []).includes('view_stats');
    if (canSee) {
      const { data } = await client.get('/vendor/stats');
      stats.value = data;
    }
  } finally { loading.value = false; }
});

function can(p) { return (auth.user?.permissions || []).includes(p); }
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {{ auth.user?.fullName }}</h1>
    <p class="text-ink-500 mt-1">Your vendor at a glance</p>

    <div v-if="!can('view_stats')" class="mt-6 ios-card p-5">
      <div class="text-sm text-ink-500">You don't have permission to view stats. Ask your admin for the <code>view_stats</code> permission.</div>
    </div>

    <div v-else-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-28 animate-pulse"></div>
    </div>
    <div v-else-if="stats" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Today</div>
        <div class="text-3xl font-bold mt-2">{{ stats.today }}</div>
        <div class="text-xs text-ink-300 mt-1">Redemptions</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">This week</div>
        <div class="text-3xl font-bold mt-2">{{ stats.week }}</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">This month</div>
        <div class="text-3xl font-bold mt-2">{{ stats.month }}</div>
      </div>
      <div class="ios-card p-5">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Locations</div>
        <div class="text-3xl font-bold mt-2">{{ stats.merchantCount }}</div>
      </div>
    </div>

    <div class="mt-6 ios-card p-5">
      <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Your permissions</div>
      <div class="mt-3 flex flex-wrap gap-2">
        <span v-for="p in (auth.user?.permissions || [])" :key="p" class="chip bg-teal-50 text-teal-700">{{ p.replace('_', ' ') }}</span>
        <span v-if="!(auth.user?.permissions || []).length" class="text-sm text-ink-500">No special permissions</span>
      </div>
    </div>
  </div>
</template>
