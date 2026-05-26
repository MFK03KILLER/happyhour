<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

function can(p) { return (auth.user?.permissions || []).includes(p); }

const tabs = computed(() => {
  const t = [{ to: '/', label: 'Scan', icon: 'fa-qrcode' }];
  if (can('view_stats')) {
    t.push({ to: '/history', label: 'History', icon: 'fa-list' });
    t.push({ to: '/stats', label: 'Stats', icon: 'fa-chart-line' });
  }
  if (can('manage_coupons') || can('view_coupons')) {
    t.push({ to: '/my-coupons', label: 'Coupons', icon: 'fa-ticket' });
  }
  t.push({ to: '/settings', label: 'Store', icon: 'fa-store' });
  return t;
});

function isActive(to) { return to === '/' ? route.path === '/' : route.path.startsWith(to); }
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 pointer-events-none">
    <div class="mx-auto max-w-md glass rounded-full shadow-lift border border-white/40 px-2 py-2 flex items-center justify-between pointer-events-auto">
      <button
        v-for="t in tabs"
        :key="t.to"
        @click="router.push(t.to)"
        class="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full transition-all active:scale-95"
        :class="isActive(t.to) ? 'text-teal-600' : 'text-ink-500'"
      >
        <i class="fa-solid text-lg" :class="t.icon"></i>
        <span class="text-[10px] font-medium">{{ t.label }}</span>
      </button>
    </div>
  </nav>
</template>
