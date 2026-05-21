<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';

const items = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/customer/wallet');
    items.value = data.items;
  } finally { loading.value = false; }
});

function statusLabel(s) {
  return { active: 'فعال', fully_redeemed: 'مصرف شده', expired: 'منقضی', refunded: 'بازپرداخت' }[s] || s;
}
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">کیف من</h1>
      <p class="text-ink-500 mt-1">کوپن‌های دریافت شده شما.</p>
    </header>

    <div v-if="loading" class="px-5 mt-6 space-y-4">
      <div v-for="i in 3" :key="i" class="ios-card h-32 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="px-5 mt-16 text-center">
      <div class="mx-auto w-20 h-20 rounded-3xl bg-cream-200 flex items-center justify-center">
        <svg class="w-10 h-10 text-ink-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/></svg>
      </div>
      <div class="mt-4 font-semibold">هنوز کوپنی ندارید</div>
      <p class="text-ink-500 text-sm mt-1">از بین تخفیف‌ها انتخاب کنید و ذخیره کنید.</p>
      <router-link to="/browse" class="ios-button-primary inline-block mt-5">مشاهده تخفیف‌ها</router-link>
    </div>
    <div v-else class="px-5 mt-6 space-y-4">
      <div v-for="p in items" :key="p._id" class="ios-card overflow-hidden">
        <div class="flex">
          <img :src="p.couponId?.heroImageUrl" class="w-28 h-32 object-cover" />
          <div class="flex-1 p-4 min-w-0">
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider truncate">{{ p.couponId?.vendorId?.name }}</div>
            <div class="font-bold leading-tight truncate">{{ p.couponId?.title }}</div>
            <div class="flex items-center gap-2 mt-2">
              <span class="chip bg-teal-50 text-teal-700">{{ p.usesRemaining }} از {{ p.couponId?.maxUsesPerCustomer }} باقی</span>
              <span class="chip bg-cream-200 text-ink-700">{{ statusLabel(p.status) }}</span>
            </div>
            <div class="mt-3">
              <router-link :to="`/wallet/${p._id}/redeem`" v-if="p.status === 'active' && p.usesRemaining > 0" class="text-sm font-semibold text-teal-700 active:opacity-70">
                نمایش به فروشنده ←
              </router-link>
              <div v-else class="text-sm text-ink-300">قابل استفاده نیست</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
