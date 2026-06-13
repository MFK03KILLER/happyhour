<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import ApplePaySheet from '../components/ApplePaySheet.vue';
import { useToastStore } from '../stores/toast';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const bag = ref(null);
const loading = ref(true);
const showPay = ref(false);
const fulfillment = ref('pickup');

onMounted(async () => {
  try {
    const { data } = await client.get(`/customer/coupons/${route.params.id}`);
    bag.value = data;
  } finally { loading.value = false; }
});

const total = computed(() => {
  if (!bag.value) return 0;
  const fee = fulfillment.value === 'delivery' ? (bag.value.deliveryFeeUSD || 0) : 0;
  return (bag.value.priceUSD || 0) + fee;
});

function pickupWindow() {
  if (!bag.value?.pickupWindowStart || !bag.value?.pickupWindowEnd) return null;
  const s = new Date(bag.value.pickupWindowStart);
  const e = new Date(bag.value.pickupWindowEnd);
  const fmt = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${fmt(s)} – ${fmt(e)}`;
}

async function onConfirm(paymentMethod) {
  try {
    await client.post(`/customer/surprise-bags/${bag.value._id}/buy`, { paymentMethod, fulfillment: fulfillment.value });
    showPay.value = false;
    toast.success('رزرو شد! در بازه‌ای که روی پاکت نمایش داده شده مراجعه کنید.', { title: 'پاکت رزرو شد 🛍️' });
    router.push('/wallet');
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'خرید ناموفق بود', { title: 'پرداخت ناموفق بود' });
  }
}

function vendor() { return bag.value?.vendorId?.name || ''; }
function merchant() { return (bag.value?.merchantIds || [])[0]; }
function savings() {
  if (!bag.value?.originalValueUSD || !bag.value?.priceUSD) return null;
  return Math.round(100 - (bag.value.priceUSD / bag.value.originalValueUSD) * 100);
}
</script>

<template>
  <div v-if="loading" class="p-6"><div class="h-72 bg-cream-200 rounded-3xl animate-pulse"></div></div>
  <div v-else-if="bag" class="pb-32">
    <div class="relative">
      <img :src="bag.heroImageUrl" :alt="bag.title" class="w-full h-72 object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <button @click="router.back()" class="absolute top-[max(env(safe-area-inset-top),16px)] left-4 w-11 h-11 rounded-full glass flex items-center justify-center active:scale-95">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="absolute top-[max(env(safe-area-inset-top),16px)] right-4 flex gap-2">
        <span v-if="savings()" class="chip bg-coral-500 text-white">-{{ savings() }}%</span>
        <span v-if="bag.inventoryRemaining != null" class="chip bg-white/95 text-ink-900">{{ bag.inventoryRemaining }} left</span>
      </div>
      <div class="absolute bottom-4 left-5 right-5 text-white drop-shadow">
        <div class="text-xs uppercase tracking-wider font-semibold opacity-90">{{ vendor() }}</div>
        <div class="text-2xl font-bold leading-tight">{{ bag.title }}</div>
        <div v-if="merchant()" class="text-sm opacity-90 mt-0.5">{{ merchant().address?.street }}, {{ merchant().address?.city }}</div>
      </div>
    </div>

    <div class="px-5 mt-5 space-y-4">
      <p class="text-ink-700 leading-relaxed">{{ bag.description || bag.subtitle }}</p>

      <div v-if="pickupWindow()" class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">بازه تحویل</div>
        <div class="font-bold text-lg mt-1">{{ pickupWindow() }}</div>
        <div class="text-sm text-ink-500 mt-1">در این بازه برای دریافت پاکت مراجعه کنید.</div>
      </div>

      <div v-if="bag.deliveryAvailable" class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">روش دریافت</div>
        <div class="grid grid-cols-2 gap-3">
          <button @click="fulfillment = 'pickup'" class="rounded-2xl p-4 border-2 transition active:scale-95 text-right" :class="fulfillment === 'pickup' ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'">
            <div class="font-bold">حضوری</div>
            <div class="text-xs text-ink-500 mt-1">رایگان</div>
          </button>
          <button @click="fulfillment = 'delivery'" class="rounded-2xl p-4 border-2 transition active:scale-95 text-right" :class="fulfillment === 'delivery' ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'">
            <div class="font-bold">ارسال به مقصد</div>
            <div class="text-xs text-ink-500 mt-1">{{ Math.round(bag.deliveryFeeUSD || 0).toLocaleString('fa-IR') }} تومان +</div>
          </button>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">شرایط</div>
        <p class="mt-2 text-sm text-ink-700">{{ bag.termsAndConditions || 'محتوای پاکت سورپرایز — تعداد محدود. پس از تحویل، قابل بازگشت نیست.' }}</p>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 z-30 glass border-t border-white/40 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="text-xs text-ink-500">مبلغ کل</div>
          <div class="text-2xl font-bold text-teal-700">{{ Math.round(total).toLocaleString('fa-IR') }} تومان</div>
        </div>
        <div v-if="bag.originalValueUSD" class="text-left">
          <div class="text-xs text-ink-500">قیمت اصلی</div>
          <div class="text-sm text-ink-300 line-through">{{ Math.round(bag.originalValueUSD).toLocaleString('fa-IR') }} تومان</div>
        </div>
      </div>
      <button @click="showPay = true" class="ios-button-primary w-full text-base">رزرو با {{ Math.round(total).toLocaleString('fa-IR') }} تومان</button>
    </div>

    <IranPaySheet
      v-if="showPay"
      :amount="total"
      :merchant-name="vendor()"
      :item-name="bag.title"
      @confirm="onConfirm"
      @close="showPay = false"
    />
  </div>
</template>
