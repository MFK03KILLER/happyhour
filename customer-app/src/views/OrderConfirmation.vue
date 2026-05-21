<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import { toman, persianDate } from '../composables/useFormat';

const route = useRoute();
const router = useRouter();
const order = ref(null);
const loading = ref(true);
const stars = ref(0);
const submittingRating = ref(false);

onMounted(async () => {
  try {
    const { data } = await client.get(`/customer/orders/${route.params.redemptionId}`);
    order.value = data;
    if (data.rating && data.rating.stars) stars.value = data.rating.stars;
  } finally { loading.value = false; }
});

async function rate(n) {
  if (submittingRating.value) return;
  stars.value = n;
  submittingRating.value = true;
  try {
    await client.post(`/customer/orders/${route.params.redemptionId}/rate`, { stars: n });
  } finally { submittingRating.value = false; }
}

function shortId(id) {
  if (!id) return '';
  return id.toString().slice(-12).toUpperCase();
}
</script>

<template>
  <div class="min-h-screen bg-cream-100 safe-top pb-12">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.push('/orders')" class="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -mr-8">سفارش شما</div>
    </header>

    <div v-if="loading" class="px-5 mt-6 space-y-4">
      <div class="h-32 bg-cream-200 rounded-3xl animate-pulse"></div>
      <div class="h-72 bg-cream-200 rounded-3xl animate-pulse"></div>
    </div>

    <div v-else-if="order" class="px-5 mt-4 space-y-5">
      <div class="rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 text-white p-5 shadow-lift relative overflow-hidden">
        <div class="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-white/10"></div>
        <div class="relative text-center">
          <div class="font-semibold text-base">تجربه شما چطور بود؟</div>
          <div class="mt-3 flex items-center justify-center gap-3">
            <button v-for="n in 5" :key="n" @click="rate(n)" class="active:scale-90 transition">
              <svg class="w-8 h-8" :class="n <= stars ? 'text-yellow-300' : 'text-white/70'" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-3xl bg-white border-2 border-teal-700 overflow-hidden shadow-soft">
        <div class="bg-teal-700 text-white py-2.5 flex items-center justify-center gap-2 text-sm font-semibold">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19l11-11-1.4-1.4z"/></svg>
          استفاده شد
        </div>
        <div class="p-5">
          <div class="flex items-center gap-3">
            <img :src="order.merchantId?.logoUrl || order.couponId?.vendorId?.logoUrl" class="w-12 h-12 rounded-full object-cover bg-cream-200" />
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate">{{ order.merchantId?.name }}</div>
              <div class="text-sm text-ink-500 truncate">{{ order.merchantId?.address?.street }}، {{ order.merchantId?.address?.city }}</div>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">تاریخ</div>
              <div class="font-semibold mt-0.5">{{ persianDate(order.scannedAt) }}</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">کد سفارش</div>
              <div class="font-mono font-semibold mt-0.5" dir="ltr">{{ shortId(order._id) }}</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">کوپن</div>
              <div class="font-semibold mt-0.5">{{ order.couponId?.title }}</div>
            </div>
            <div class="text-left">
              <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">صرفه‌جویی</div>
              <div class="font-semibold mt-0.5">{{ toman(order.amountSavedUSD || order.couponId?.priceUSD || 0) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center pt-2">
        <button class="inline-flex items-center gap-2 text-sm font-semibold text-ink-700 active:opacity-70">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 11v3a8 8 0 0 0 16 0v-3"/><path d="M9 17h6"/><circle cx="12" cy="11" r="3"/></svg>
          نیاز به کمک دارید؟
        </button>
      </div>
    </div>
  </div>
</template>
