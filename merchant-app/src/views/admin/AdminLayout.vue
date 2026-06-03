<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const items = [
  { to: '/admin', label: 'Dashboard', icon: 'home' },
  { to: '/admin/revenue', label: 'Revenue', icon: 'dollar' },
  { to: '/admin/payments', label: 'Payments', icon: 'card' },
  { to: '/admin/vendors', label: 'Vendors', icon: 'building' },
  { to: '/admin/merchants', label: 'Merchants', icon: 'store' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'tag' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/features', label: 'Features', icon: 'flag' },
  { to: '/admin/terms', label: 'Terms', icon: 'doc' },
  { to: '/admin/site-content', label: 'Site Content', icon: 'doc' },
  { to: '/admin/audit', label: 'Audit log', icon: 'log' },
];

const current = computed(() => items.find((i) => i.to === route.path) || items[0]);

async function doLogout() { await auth.logout(); router.push('/login'); }
</script>

<template>
  <div class="min-h-screen bg-cream-100 flex">
    <aside class="hidden md:flex flex-col w-64 bg-white border-r border-cream-200 safe-top">
      <div class="px-5 py-4 flex items-center gap-2 border-b border-cream-200">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
        </div>
        <div>
          <div class="font-bold">Happy Hour Admin</div>
          <div class="text-[11px] text-ink-500">{{ auth.user?.email }}</div>
        </div>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <router-link
          v-for="i in items"
          :key="i.to"
          :to="i.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition"
          :class="route.path === i.to ? 'bg-teal-600 text-white' : 'text-ink-700 hover:bg-cream-100'"
        >
          <svg v-if="i.icon==='home'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M3 12 12 3l9 9M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/></svg>
          <svg v-if="i.icon==='building'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h6M9 11h6M9 15h6"/></svg>
          <svg v-if="i.icon==='store'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 9V7l2-4h12l2 4v2"/><path d="M4 9a3 3 0 0 0 6 0 3 3 0 0 0 4 0 3 3 0 0 0 6 0"/><path d="M5 9v11h14V9"/></svg>
          <svg v-if="i.icon==='tag'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="m20 13-7 7-9-9V4h7l9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>
          <svg v-if="i.icon==='users'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="3"/><path d="M22 20a5 5 0 0 0-6-5"/></svg>
          <svg v-if="i.icon==='log'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>
          <svg v-if="i.icon==='dollar'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <svg v-if="i.icon==='card'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
          <svg v-if="i.icon==='flag'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M5 22V4M5 4h13l-2 5 2 5H5"/></svg>
          <svg v-if="i.icon==='doc'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h6"/></svg>
          {{ i.label }}
        </router-link>
      </nav>
      <div class="p-3 border-t border-cream-200">
        <button @click="doLogout" class="w-full text-left px-3 py-2.5 rounded-2xl text-sm font-semibold text-coral-600 hover:bg-coral-50">
          Sign out
        </button>
      </div>
    </aside>

    <main class="flex-1 min-w-0">
      <header class="md:hidden safe-top px-5 pb-3 pt-3 bg-white border-b border-cream-200 flex items-center justify-between">
        <div class="font-bold">{{ current.label }}</div>
        <button @click="doLogout" class="text-xs text-coral-600 font-semibold">Sign out</button>
      </header>

      <div class="md:hidden flex gap-2 px-5 py-3 overflow-x-auto scroll-no-bar bg-white border-b border-cream-200">
        <router-link
          v-for="i in items" :key="i.to" :to="i.to"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
          :class="route.path === i.to ? 'bg-teal-600 text-white' : 'bg-cream-100 text-ink-700'"
        >{{ i.label }}</router-link>
      </div>

      <router-view />
    </main>
  </div>
</template>
