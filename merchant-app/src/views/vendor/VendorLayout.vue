<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../../stores/auth';
import TermsModal from '../../components/TermsModal.vue';
import ChangePasswordSheet from '../../components/ChangePasswordSheet.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const showTerms = ref(false);
const showPw = ref(false);

const items = [
  { to: '/vendor', label: 'Dashboard', icon: 'home', perm: null },
  { to: '/vendor/analytics', label: 'Analytics', icon: 'chart', perm: 'view_stats' },
  { to: '/vendor/merchants', label: 'Locations', icon: 'store', perm: null },
  { to: '/vendor/coupons', label: 'Coupons', icon: 'tag', perm: null },
  { to: '/vendor/team', label: 'Team', icon: 'users', perm: 'view_team' },
  { to: '/vendor/activity', label: 'Activity', icon: 'log', perm: 'view_stats' },
  { to: '/vendor/pricing', label: 'Pricing', icon: 'dollar', perm: null },
];

function can(perm) {
  if (!perm) return true;
  return (auth.user?.permissions || []).includes(perm);
}

// Plans are never sold inside the native apps (see VendorPricing.vue).
const inApp = Capacitor.isNativePlatform();
const visibleItems = computed(() => items.filter((i) => can(i.perm) && !(inApp && i.to === '/vendor/pricing')));
// Phones/tablets get the sidebar as a slide-in drawer (the old sideways chip
// row hid half the menu, and Sign out was a tiny link).
const menuOpen = ref(false);
watch(() => route.path, () => { menuOpen.value = false; });

const current = computed(() => items.find((i) => i.to === route.path) || items[0]);

async function doLogout() { await auth.logout(); router.push('/login'); }
</script>

<template>
  <div class="min-h-screen bg-cream-100 flex">
    <div v-if="menuOpen" class="md:hidden fixed inset-0 z-40 bg-black/40 animate-fade-in" @click="menuOpen = false"></div>
    <aside
      class="flex-col bg-white border-r border-cream-200 safe-top safe-bottom fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto shadow-lift md:static md:z-auto md:w-64 md:max-w-none md:shadow-none md:flex md:flex-shrink-0"
      :class="menuOpen ? 'flex' : 'hidden'"
    >
      <div class="px-5 py-4 flex items-center gap-2 border-b border-cream-200">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
        </div>
        <div>
          <div class="font-bold">Vendor Console</div>
          <div class="text-[11px] text-ink-500">{{ auth.user?.email }}</div>
        </div>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <router-link
          v-for="i in visibleItems"
          :key="i.to" :to="i.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition"
          :class="route.path === i.to ? 'bg-teal-600 text-white' : 'text-ink-700 hover:bg-cream-100'"
        >
          <svg v-if="i.icon==='home'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M3 12 12 3l9 9M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/></svg>
          <svg v-if="i.icon==='store'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 9V7l2-4h12l2 4v2"/><path d="M4 9a3 3 0 0 0 6 0 3 3 0 0 0 4 0 3 3 0 0 0 6 0"/><path d="M5 9v11h14V9"/></svg>
          <svg v-if="i.icon==='tag'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="m20 13-7 7-9-9V4h7l9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>
          <svg v-if="i.icon==='users'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="3"/><path d="M22 20a5 5 0 0 0-6-5"/></svg>
          <svg v-if="i.icon==='chart'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 19V5M4 19h16M8 16V11M12 16V8M16 16v-3"/></svg>
          <svg v-if="i.icon==='log'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>
          <svg v-if="i.icon==='dollar'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          {{ i.label }}
        </router-link>
      </nav>
      <div class="p-3 border-t border-cream-200 space-y-1">
        <button @click="showPw = true" class="w-full text-left px-3 py-2.5 rounded-2xl text-sm font-semibold text-ink-700 hover:bg-cream-100"><i class="fa-solid fa-key mr-1.5"></i>Change password</button>
        <button @click="showTerms = true" class="w-full text-left px-3 py-2 rounded-2xl text-xs font-semibold text-ink-500 hover:bg-cream-100">
          <i class="fa-regular fa-file-lines mr-1.5"></i>Merchant Terms of Service
        </button>
        <button @click="doLogout" class="w-full text-left px-3 py-2.5 rounded-2xl text-sm font-semibold text-coral-600 hover:bg-coral-50">Sign out</button>
      </div>
    </aside>

    <main class="flex-1 min-w-0 overflow-x-clip">
      <header class="md:hidden sticky top-0 z-30 safe-top px-3 pb-3 bg-white/95 backdrop-blur border-b border-cream-200 flex items-center gap-2">
        <button type="button" class="w-10 h-10 rounded-full flex items-center justify-center active:bg-cream-200" aria-label="Open menu" @click="menuOpen = true">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div class="font-bold text-lg truncate flex-1">{{ current.label }}</div>
      </header>
      <router-view />
    </main>
    <ChangePasswordSheet v-if="showPw" @close="showPw = false" />
    <TermsModal :show="showTerms" audience="merchant" @close="showTerms = false" />
  </div>
</template>
