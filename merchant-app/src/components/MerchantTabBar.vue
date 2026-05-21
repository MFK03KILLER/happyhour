<script setup>
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const tabs = [
  { to: '/', label: 'اسکن', icon: 'scan' },
  { to: '/history', label: 'تاریخچه', icon: 'list' },
  { to: '/stats', label: 'آمار', icon: 'chart' },
  { to: '/settings', label: 'تنظیمات', icon: 'store' },
];
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
        <svg v-if="t.icon==='scan'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M3 12h18"/></svg>
        <svg v-if="t.icon==='list'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        <svg v-if="t.icon==='chart'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 19V5M4 19h16M8 16V11M12 16V8M16 16v-3"/></svg>
        <svg v-if="t.icon==='store'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 9V7l2-4h12l2 4v2"/><path d="M4 9a3 3 0 0 0 6 0 3 3 0 0 0 4 0 3 3 0 0 0 6 0"/><path d="M5 9v11h14V9"/></svg>
        <span class="text-[10px] font-medium">{{ t.label }}</span>
      </button>
    </div>
  </nav>
</template>
