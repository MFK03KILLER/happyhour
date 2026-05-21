<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import IranPaySheet from '../components/IranPaySheet.vue';
import { toman } from '../composables/useFormat';

const router = useRouter();
const selectedPlan = ref('monthly');
const subscription = ref(null);
const loading = ref(true);
const showPay = ref(false);

const plans = {
  monthly: { label: 'ماهانه', amount: 299000, perMonth: 299000, period: 'ماه' },
  yearly: { label: 'سالانه', amount: 2990000, perMonth: 249000, period: 'سال', save: '۱۷٪ صرفه‌جویی' },
};

onMounted(async () => {
  try {
    const { data } = await client.get('/customer/subscription');
    subscription.value = data.subscription;
  } finally { loading.value = false; }
});

function isActive() {
  const s = subscription.value;
  return s && s.status === 'active' && new Date(s.currentPeriodEnd) > new Date();
}

async function onConfirm(method) {
  try {
    await client.post('/customer/subscription/subscribe', { plan: selectedPlan.value, paymentMethod: method });
    showPay.value = false;
    router.push('/');
  } catch (e) {
    alert(e.response?.data?.error?.message || 'پرداخت ناموفق بود');
  }
}

async function cancel() {
  if (!confirm('عضویت تا پایان دوره فعلی فعال می‌ماند. آیا مطمئنید؟')) return;
  await client.post('/customer/subscription/cancel');
  const { data } = await client.get('/customer/subscription');
  subscription.value = data.subscription;
}
</script>

<template>
  <div class="min-h-screen safe-top pb-32">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -mr-8">عضویت</div>
    </header>

    <div v-if="loading" class="p-6"><div class="h-72 bg-cream-200 rounded-3xl animate-pulse"></div></div>

    <template v-else>
      <div v-if="isActive()" class="px-5 mt-6">
        <div class="ios-card p-6 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">عضویت فعال</div>
          <div class="text-2xl font-bold mt-2">شما عضو هپی‌اَور هستید 🎉</div>
          <div class="text-sm opacity-90 mt-2">تا {{ new Date(subscription.currentPeriodEnd).toLocaleDateString('fa-IR') }} اعتبار دارد</div>
          <button v-if="!subscription.cancelAtPeriodEnd" @click="cancel" class="mt-4 bg-white/15 text-white rounded-full px-4 py-2 text-sm font-semibold active:scale-95">
            لغو عضویت
          </button>
          <div v-else class="mt-3 text-xs bg-white/15 rounded-full inline-block px-3 py-1">لغو در پایان دوره</div>
        </div>
      </div>

      <div v-else class="px-5 mt-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold">دسترسی نامحدود</h1>
          <p class="text-ink-500 mt-2">به صدها رستوران و کافه با یک عضویت ساده</p>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button @click="selectedPlan = 'monthly'" class="rounded-3xl p-5 border-2 transition active:scale-95 text-right" :class="selectedPlan === 'monthly' ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'">
            <div class="font-bold">ماهانه</div>
            <div class="mt-2 text-xl font-bold">{{ toman(plans.monthly.amount) }}</div>
            <div class="text-xs text-ink-500 mt-1">هر ماه</div>
          </button>
          <button @click="selectedPlan = 'yearly'" class="rounded-3xl p-5 border-2 transition active:scale-95 text-right relative" :class="selectedPlan === 'yearly' ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'">
            <span class="chip absolute -top-2 left-3 bg-coral-500 text-white text-[10px]">{{ plans.yearly.save }}</span>
            <div class="font-bold">سالانه</div>
            <div class="mt-2 text-xl font-bold">{{ toman(plans.yearly.perMonth) }}</div>
            <div class="text-xs text-ink-500 mt-1">معادل ماهانه</div>
          </button>
        </div>

        <div class="mt-6 ios-card p-5">
          <ul class="space-y-3 text-sm">
            <li class="flex items-center gap-3"><span class="text-teal-600 text-lg">✓</span> دسترسی نامحدود به همه کوپن‌ها</li>
            <li class="flex items-center gap-3"><span class="text-teal-600 text-lg">✓</span> پاکت‌های شگفتی با تخفیف بالا</li>
            <li class="flex items-center gap-3"><span class="text-teal-600 text-lg">✓</span> لغو در هر زمان</li>
            <li class="flex items-center gap-3"><span class="text-teal-600 text-lg">✓</span> پشتیبانی ۲۴/۷</li>
          </ul>
        </div>

        <div class="fixed bottom-0 inset-x-0 z-30 glass border-t border-white/40 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-xs text-ink-500">مبلغ کل</div>
              <div class="text-2xl font-bold text-teal-700">{{ toman(plans[selectedPlan].amount) }}</div>
            </div>
            <div class="text-xs text-ink-500 text-left">پلن {{ plans[selectedPlan].label }}</div>
          </div>
          <button @click="showPay = true" class="ios-button-primary w-full">عضو شدن</button>
        </div>
      </div>
    </template>

    <IranPaySheet v-if="showPay" :amount="plans[selectedPlan].amount" merchant-name="هپی‌اَور" :item-name="`عضویت ${plans[selectedPlan].label}`" @confirm="onConfirm" @close="showPay = false" />
  </div>
</template>
