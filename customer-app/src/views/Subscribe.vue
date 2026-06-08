<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import IranPaySheet from '../components/IranPaySheet.vue';
import { useToastStore } from '../stores/toast';
import { useAuthStore } from '../stores/auth';
import { toman, persianNumber, persianDate } from '../composables/useFormat';

const router = useRouter();
const toast = useToastStore();
const auth = useAuthStore();
const sub = ref(null);
const currentPlan = ref(null);
const availablePlans = ref([]);
const showPay = ref(false);
const selectedTier = ref('gold');
const billing = ref('monthly');
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/customer/subscription');
    sub.value = data.subscription;
    currentPlan.value = data.plan;
    availablePlans.value = data.available || [];
  } finally { loading.value = false; }
});

async function onConfirm(paymentMethod) {
  try {
    const { data } = await client.post('/customer/subscription/subscribe', {
      tier: selectedTier.value,
      plan: billing.value,
      paymentMethod,
      audience: 'customer',
    });
    sub.value = data.subscription;
    currentPlan.value = data.plan;
    await auth.fetchMe();
    showPay.value = false;
    toast.success(`اشتراک شما به «${data.plan.label}» ارتقا یافت!`, { title: 'عضویت فعال شد 🎉' });
    router.push('/');
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'پرداخت ناموفق بود', { title: 'خطا در پرداخت' });
  }
}

async function cancelSub() {
  if (!confirm('عضویت تا پایان دوره فعلی فعال می‌ماند. آیا مطمئنید؟')) return;
  const { data } = await client.post('/customer/subscription/cancel');
  sub.value = data;
}
async function resumeSub() {
  const { data } = await client.post('/customer/subscription/resume');
  sub.value = data;
}

const selected = computed(() => availablePlans.value.find((p) => p.tier === selectedTier.value));
const selectedPrice = computed(() => selected.value?.price?.[billing.value] || 0);
const currentTier = computed(() => sub.value?.tier || currentPlan.value?.tier || 'basic');
const isCurrentlyPaid = computed(() => sub.value && sub.value.tier !== 'basic' && new Date(sub.value.currentPeriodEnd) > new Date());

function tierBg(tier) {
  if (tier === 'gold') return 'from-coral-500 to-coral-600';
  if (tier === 'premium') return 'from-purple-600 to-fuchsia-700';
  return 'from-ink-500 to-ink-700';
}

function pickTier(t) {
  if (t === 'basic') return;
  selectedTier.value = t;
}

function fmtPrice(n) {
  if (!n) return 'رایگان';
  return toman(n);
}

function fmtPeriod(b) {
  return b === 'monthly' ? 'ماهانه' : 'سالانه';
}
</script>

<template>
  <div class="min-h-screen pb-12 safe-top bg-cream-100">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -mr-8">عضویت</div>
    </header>

    <div v-if="loading" class="px-5 mt-6"><div class="h-64 bg-cream-200 rounded-3xl animate-pulse"></div></div>

    <template v-else>
      <!-- بنر اشتراک فعلی -->
      <div v-if="isCurrentlyPaid" class="px-5 mt-5">
        <div class="rounded-3xl bg-gradient-to-br text-white p-6 shadow-lift relative overflow-hidden" :class="tierBg(currentTier)">
          <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10"></div>
          <span class="chip bg-white/15 text-white">{{ currentPlan?.badge || 'فعال' }}</span>
          <div class="mt-3 text-3xl font-bold">عضویت {{ currentPlan?.label }}</div>
          <div class="opacity-90 mt-1">{{ fmtPeriod(sub.plan) }} · {{ fmtPrice(sub.amountUSD) }}</div>
          <div class="mt-3 text-sm opacity-90">
            تمدید بعدی: <span class="font-semibold">{{ persianDate(sub.currentPeriodEnd) }}</span>
          </div>
          <div v-if="sub.cancelAtPeriodEnd" class="mt-2 text-sm bg-black/20 rounded-xl px-3 py-2">
            در تاریخ {{ persianDate(sub.currentPeriodEnd) }} لغو می‌شود
          </div>
        </div>

        <div class="mt-3 flex gap-2">
          <button v-if="!sub.cancelAtPeriodEnd" @click="cancelSub" class="ios-card flex-1 p-3 text-coral-600 font-semibold text-center">
            لغو عضویت
          </button>
          <button v-else @click="resumeSub" class="ios-button-primary flex-1">فعال‌سازی مجدد</button>
        </div>
      </div>

      <!-- انتخاب پلن -->
      <div class="px-5 mt-5">
        <div class="text-center">
          <h1 class="text-2xl font-bold tracking-tight">پلن خود را انتخاب کنید</h1>
          <p class="text-ink-500 mt-1 text-sm">هر بار که بیرون می‌روید بیشتر صرفه‌جویی کنید.</p>
        </div>

        <div class="mt-4 flex justify-center">
          <div class="inline-flex bg-cream-200 rounded-full p-1">
            <button @click="billing='monthly'" class="px-5 py-1.5 rounded-full text-sm font-semibold transition" :class="billing==='monthly' ? 'bg-white shadow-soft' : 'text-ink-500'">ماهانه</button>
            <button @click="billing='yearly'" class="px-5 py-1.5 rounded-full text-sm font-semibold transition" :class="billing==='yearly' ? 'bg-white shadow-soft' : 'text-ink-500'">سالانه · تخفیف ویژه</button>
          </div>
        </div>

        <div class="mt-5 space-y-3">
          <div
            v-for="p in availablePlans"
            :key="p.tier"
            @click="pickTier(p.tier)"
            class="ios-card p-5 cursor-pointer transition relative"
            :class="[
              selectedTier === p.tier ? 'ring-2 ring-teal-600 scale-[1.01]' : 'opacity-90 hover:opacity-100',
              p.tier === 'basic' ? 'cursor-default opacity-70' : ''
            ]"
          >
            <div v-if="p.badge" class="absolute -top-2 right-4 chip text-white text-[10px]" :class="p.tier === 'gold' ? 'bg-coral-500' : p.tier === 'premium' ? 'bg-purple-600' : 'bg-ink-500'">
              {{ p.badge }}
            </div>
            <div v-if="currentTier === p.tier && isCurrentlyPaid" class="absolute -top-2 left-4 chip bg-teal-600 text-white text-[10px]">پلن فعلی</div>
            <div class="flex items-start justify-between">
              <div>
                <div class="text-xl font-bold">{{ p.label }}</div>
                <div class="text-xs text-ink-500">{{ p.description }}</div>
              </div>
              <div class="text-left">
                <div class="text-xl font-bold">{{ fmtPrice(p.price[billing] || 0) }}</div>
                <div class="text-[10px] uppercase tracking-wider text-ink-500">{{ billing === 'monthly' ? 'ماهانه' : 'سالانه' }}</div>
              </div>
            </div>

            <ul class="mt-4 space-y-1.5 text-sm">
              <li v-for="b in p.bullets" :key="b" class="flex gap-2">
                <span class="w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 text-[10px]">✓</span>
                {{ b }}
              </li>
              <li v-for="b in p.crossedOut" :key="b" class="flex gap-2 text-ink-300 line-through">
                <span class="w-4 h-4 rounded-full bg-cream-200 text-ink-300 flex items-center justify-center flex-shrink-0 text-[10px]">✕</span>
                {{ b }}
              </li>
            </ul>
          </div>
        </div>

        <button
          v-if="selectedTier !== 'basic' && selectedTier !== currentTier"
          @click="showPay = true"
          class="ios-button-primary w-full mt-5"
        >
          عضویت {{ selected?.label }} — {{ fmtPrice(selectedPrice) }} {{ fmtPeriod(billing) }}
        </button>
        <div v-if="selectedTier !== 'basic'" class="text-center text-xs text-ink-300 mt-2">۷ روز ضمانت بازگشت وجه · لغو در هر زمان</div>
      </div>
    </template>

    <IranPaySheet
      v-if="showPay && selected"
      :amount="selectedPrice"
      merchant-name="هپی اَور"
      :item-name="`عضویت ${selected.label} (${fmtPeriod(billing)})`"
      @confirm="onConfirm"
      @close="showPay = false"
    />
  </div>
</template>
