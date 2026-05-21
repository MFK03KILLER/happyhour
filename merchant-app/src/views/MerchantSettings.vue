<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const merchant = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/merchant/me');
    merchant.value = data;
  } finally { loading.value = false; }
});
</script>

<template>
  <div class="min-h-screen bg-cream-100 pb-28">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white safe-top px-5 pb-8 rounded-b-3xl">
      <div class="pt-2">
        <div class="text-xs opacity-80 font-semibold uppercase tracking-wider">Your location</div>
        <h1 class="text-2xl font-bold mt-0.5">Settings</h1>
      </div>
    </header>

    <div v-if="loading" class="px-5 -mt-6 space-y-4">
      <div class="ios-card h-32 animate-pulse"></div>
      <div class="ios-card h-48 animate-pulse"></div>
    </div>
    <div v-else-if="merchant" class="px-5 -mt-6 space-y-4">
      <div class="ios-card overflow-hidden">
        <div class="relative h-32 bg-cream-200">
          <img v-if="merchant.coverImageUrl" :src="merchant.coverImageUrl" class="w-full h-full object-cover" />
        </div>
        <div class="p-5 -mt-10 relative">
          <img v-if="merchant.logoUrl" :src="merchant.logoUrl" class="w-16 h-16 rounded-2xl object-cover bg-white shadow-lift" />
          <div class="mt-3">
            <div class="font-bold text-lg">{{ merchant.name }}</div>
            <div class="text-sm text-ink-500 capitalize">{{ merchant.category }} · {{ merchant.vendorId?.name }}</div>
          </div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Address</div>
        <div class="mt-2">
          <div class="font-semibold">{{ merchant.address?.street }}</div>
          <div class="text-sm text-ink-500">{{ merchant.address?.city }}, {{ merchant.address?.state }} {{ merchant.address?.zip }}</div>
        </div>
        <div v-if="merchant.phone" class="mt-3 pt-3 border-t border-cream-200">
          <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Phone</div>
          <div class="font-semibold mt-1">{{ merchant.phone }}</div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Capabilities</div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span class="chip bg-teal-50 text-teal-700">QR scanner</span>
          <span v-if="merchant.acceptsNFC" class="chip bg-teal-50 text-teal-700">NFC reader</span>
          <span class="chip bg-cream-200 text-ink-700 capitalize">{{ merchant.status }}</span>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Logged in as</div>
        <div class="mt-2 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold">{{ auth.user?.fullName?.charAt(0) }}</div>
          <div>
            <div class="font-semibold">{{ auth.user?.fullName }}</div>
            <div class="text-sm text-ink-500">{{ auth.user?.email }}</div>
          </div>
        </div>
      </div>

      <button @click="auth.logout(); $router.push('/login')" class="ios-card w-full p-4 text-coral-600 font-semibold active:bg-cream-100 text-center">
        Sign out
      </button>
    </div>
  </div>
</template>
