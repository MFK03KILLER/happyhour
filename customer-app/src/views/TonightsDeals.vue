<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useFlagsStore } from '../stores/flags';
import { toman, persianTime } from '../composables/useFormat';

const router = useRouter();
const flags = useFlagsStore();
const items = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  await flags.load();
  if (!flags.isOn('surprise_bag')) {
    error.value = 'بخش پاکت‌های شگفتی هنوز فعال نشده.';
    loading.value = false;
    return;
  }
  try {
    const { data } = await client.get('/customer/surprise-bags', { params: { limit: 30 } });
    items.value = data.items;
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'بارگذاری ناموفق';
  } finally { loading.value = false; }
});

function pickupWindow(c) {
  if (!c.pickupWindowStart || !c.pickupWindowEnd) return null;
  return `${persianTime(c.pickupWindowStart)} – ${persianTime(c.pickupWindowEnd)}`;
}
function savings(c) {
  if (!c.originalValueUSD || !c.priceUSD) return null;
  return Math.round(100 - (c.priceUSD / c.originalValueUSD) * 100);
}
function vendor(c) { return c.vendorId?.name || ''; }
function city(c) { const m = (c.merchantIds || [])[0]; return m?.address?.city || ''; }
function go(c) { router.push(`/surprise-bag/${c._id}`); }
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-coral-500 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M5 8h14l-1.5 12.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5L5 8zm3-4h8a2 2 0 0 1 2 2v2H6V6a2 2 0 0 1 2-2z"/></svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight">پاکت‌های امشب</h1>
          <p class="text-xs text-ink-500">پیشنهاد لحظه‌آخری · تا ۷۰٪ تخفیف</p>
        </div>
      </div>
    </header>

    <div v-if="loading" class="mt-6 px-5 space-y-4">
      <div v-for="i in 3" :key="i" class="ios-card h-56 animate-pulse"></div>
    </div>

    <div v-else-if="error" class="mt-12 px-5 text-center">
      <div class="text-4xl mb-3">🛍️</div>
      <div class="font-semibold text-ink-700">{{ error }}</div>
      <p class="text-sm text-ink-500 mt-1">از مدیر بخواهید این قابلیت را از پنل مدیریت فعال کند.</p>
    </div>

    <div v-else-if="items.length === 0" class="mt-12 px-5 text-center text-ink-500">
      الان پاکتی موجود نیست. شب دوباره سر بزنید!
    </div>

    <div v-else class="mt-6 px-5 space-y-4">
      <button v-for="c in items" :key="c._id" @click="go(c)" class="block w-full text-right active:scale-[.985] transition-transform">
        <div class="ios-card overflow-hidden relative">
          <div class="relative aspect-[16/9] bg-cream-200">
            <img v-if="c.heroImageUrl" :src="c.heroImageUrl" :alt="c.title" class="w-full h-full object-cover" loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"></div>
            <div class="absolute top-3 right-3 flex gap-2">
              <span v-if="savings(c)" class="chip bg-coral-500 text-white">٪{{ savings(c) }}-</span>
              <span v-if="c.inventoryRemaining != null" class="chip bg-white/95 text-ink-900">{{ c.inventoryRemaining }} مانده</span>
            </div>
            <div class="absolute bottom-3 right-3 left-3 text-white drop-shadow">
              <div class="text-[11px] uppercase tracking-wider font-semibold opacity-90">{{ vendor(c) }} · {{ city(c) }}</div>
              <div class="text-xl font-bold leading-tight">{{ c.title }}</div>
            </div>
          </div>
          <div class="p-4 flex items-center justify-between">
            <div>
              <div v-if="pickupWindow(c)" class="text-sm font-semibold text-ink-700">تحویل: {{ pickupWindow(c) }}</div>
              <div v-if="c.deliveryAvailable" class="text-xs text-teal-700 mt-0.5">ارسال موجود · {{ toman(c.deliveryFeeUSD || 0) }}</div>
            </div>
            <div class="text-left">
              <div v-if="c.originalValueUSD" class="text-xs text-ink-300 line-through">{{ toman(c.originalValueUSD) }}</div>
              <div class="text-xl font-bold text-teal-700">{{ toman(c.priceUSD) }}</div>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
