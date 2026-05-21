<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useFlagsStore } from '../stores/flags';

const route = useRoute();
const router = useRouter();
const flags = useFlagsStore();

const tabs = computed(() => {
  const base = [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/browse', label: 'Browse', icon: 'search' },
  ];
  if (flags.isOn('maps')) base.push({ to: '/map', label: 'Map', icon: 'map' });
  base.push({ to: '/wallet', label: 'Wallet', icon: 'wallet' });
  base.push({ to: '/profile', label: 'Profile', icon: 'profile' });
  return base;
});

function isActive(to) {
  if (to === '/') return route.path === '/';
  return route.path.startsWith(to);
}
function go(to) {
  if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(8);
  router.push(to);
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 pointer-events-none">
    <div class="mx-auto max-w-md glass rounded-full shadow-lift border border-white/40 px-2 py-2 flex items-center justify-between pointer-events-auto">
      <button
        v-for="t in tabs"
        :key="t.to"
        @click="go(t.to)"
        class="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full transition-all active:scale-95"
        :class="isActive(t.to) ? 'text-teal-600' : 'text-ink-500'"
      >
        <svg v-if="t.icon==='home'" class="w-6 h-6" :fill="isActive(t.to) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12 12 3l9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>
        <svg v-if="t.icon==='search'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-3.5-3.5"/></svg>
        <svg v-if="t.icon==='map'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>
        <svg v-if="t.icon==='wallet'" class="w-6 h-6" :fill="isActive(t.to) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><circle cx="17" cy="14" r="1.4"/></svg>
        <svg v-if="t.icon==='profile'" class="w-6 h-6" :fill="isActive(t.to) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
        <span class="text-[10px] font-medium" :class="isActive(t.to) ? 'opacity-100' : 'opacity-80'">{{ t.label }}</span>
      </button>
    </div>
  </nav>
</template>
