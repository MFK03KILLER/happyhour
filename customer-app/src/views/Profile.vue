<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import client from '../api/client';

const auth = useAuthStore();
const router = useRouter();
const subscription = ref(null);

onMounted(async () => {
  try {
    const { data } = await client.get('/customer/subscription');
    subscription.value = data.subscription;
  } catch {}
});

function isSubscribed() {
  const s = subscription.value;
  return s && s.status === 'active' && new Date(s.currentPeriodEnd) > new Date();
}

async function doLogout() {
  await auth.logout();
  router.push('/welcome');
}
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">Profile</h1>
    </header>

    <section class="mt-6 px-5">
      <div class="ios-card p-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center text-xl font-bold">
          {{ auth.user?.fullName?.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-lg truncate">{{ auth.user?.fullName }}</div>
          <div class="text-ink-500 text-sm truncate">{{ auth.user?.email }}</div>
        </div>
      </div>
    </section>

    <section class="mt-4 px-5">
      <router-link to="/subscribe" class="block ios-card p-5 active:bg-cream-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Membership</div>
            <div class="font-bold mt-1">
              <span v-if="isSubscribed()">Active · {{ subscription.plan }}</span>
              <span v-else class="text-coral-600">Not subscribed</span>
            </div>
            <div v-if="isSubscribed()" class="text-xs text-ink-500 mt-0.5">
              Renews {{ new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month:'short', day:'numeric'}) }}
            </div>
            <div v-else class="text-xs text-ink-500 mt-0.5">Subscribe to unlock all coupons</div>
          </div>
          <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m9 5 7 7-7 7"/></svg>
        </div>
      </router-link>
    </section>

    <section class="mt-5 px-5 space-y-2">
      <div class="ios-card divide-y divide-cream-200">
        <router-link to="/profile/notifications" class="w-full flex items-center justify-between p-4 active:bg-cream-100">
          <span class="font-medium">Notifications</span>
          <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m9 5 7 7-7 7"/></svg>
        </router-link>
        <router-link to="/profile/payment-methods" class="w-full flex items-center justify-between p-4 active:bg-cream-100">
          <span class="font-medium">Payment methods</span>
          <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m9 5 7 7-7 7"/></svg>
        </router-link>
        <router-link to="/profile/help" class="w-full flex items-center justify-between p-4 active:bg-cream-100">
          <span class="font-medium">Help & support</span>
          <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m9 5 7 7-7 7"/></svg>
        </router-link>
      </div>

      <button @click="doLogout" class="ios-card w-full p-4 text-coral-600 font-semibold active:bg-cream-100">
        Sign out
      </button>
    </section>

    <div class="mt-8 text-center text-[11px] text-ink-300">Happy Hour Demo · v1.0</div>
  </div>
</template>
