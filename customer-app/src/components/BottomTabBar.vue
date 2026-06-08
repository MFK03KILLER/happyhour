<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  { to: '/', label: 'خانه', icon: 'fa-house' },
  { to: '/browse', label: 'جستجو', icon: 'fa-magnifying-glass' },
  { to: '/wallet', label: 'کیف پول', icon: 'fa-wallet' },
  { to: '/orders', label: 'سفارش‌ها', icon: 'fa-receipt' },
  { to: '/profile', label: 'حساب من', icon: 'fa-user' },
];

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
        <i class="fa-solid text-lg" :class="t.icon"></i>
        <span class="text-[10px] font-medium">{{ t.label }}</span>
      </button>
    </div>
  </nav>
</template>
