<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const settings = ref({
  newOffers: true,
  expiringCoupons: true,
  redemptionConfirmations: true,
  marketingEmails: false,
  pushEnabled: true,
});
</script>

<template>
  <div class="min-h-screen pb-12 safe-top">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Notifications</div>
    </header>

    <section class="px-5 mt-6">
      <div class="ios-card divide-y divide-cream-200">
        <label class="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div class="font-semibold">New offers</div>
            <div class="text-sm text-ink-500">When new coupons drop near you.</div>
          </div>
          <input type="checkbox" v-model="settings.newOffers" class="w-11 h-6 rounded-full appearance-none bg-cream-200 checked:bg-teal-600 relative cursor-pointer transition before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:shadow-soft before:transition checked:before:translate-x-5" />
        </label>
        <label class="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div class="font-semibold">Expiring coupons</div>
            <div class="text-sm text-ink-500">Remind me before they expire.</div>
          </div>
          <input type="checkbox" v-model="settings.expiringCoupons" class="w-11 h-6 rounded-full appearance-none bg-cream-200 checked:bg-teal-600 relative cursor-pointer transition before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:shadow-soft before:transition checked:before:translate-x-5" />
        </label>
        <label class="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div class="font-semibold">Redemption receipts</div>
            <div class="text-sm text-ink-500">Confirmation after every scan.</div>
          </div>
          <input type="checkbox" v-model="settings.redemptionConfirmations" class="w-11 h-6 rounded-full appearance-none bg-cream-200 checked:bg-teal-600 relative cursor-pointer transition before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:shadow-soft before:transition checked:before:translate-x-5" />
        </label>
        <label class="flex items-center justify-between p-4 cursor-pointer">
          <div>
            <div class="font-semibold">Marketing emails</div>
            <div class="text-sm text-ink-500">Weekly highlights and partners.</div>
          </div>
          <input type="checkbox" v-model="settings.marketingEmails" class="w-11 h-6 rounded-full appearance-none bg-cream-200 checked:bg-teal-600 relative cursor-pointer transition before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:shadow-soft before:transition checked:before:translate-x-5" />
        </label>
      </div>

      <div class="ios-card mt-5 p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Push notifications</div>
        <p class="text-sm text-ink-700 mt-2 leading-relaxed">Enable on your device through Settings → Notifications → Happy Hour.</p>
      </div>
    </section>
  </div>
</template>
