<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';

const sub = ref(null);
const currentPlan = ref(null);
const availablePlans = ref([]);
const loading = ref(true);
const saving = ref(false);
const selectedTier = ref('gold');
const billing = ref('monthly');
const showConfirm = ref(false);

onMounted(async () => {
  try {
    const { data } = await client.get('/vendor/subscription');
    sub.value = data.subscription;
    currentPlan.value = data.plan;
    availablePlans.value = data.available || [];
    if (data.tier && data.tier !== 'basic') selectedTier.value = data.tier;
  } finally { loading.value = false; }
});

async function upgrade() {
  saving.value = true;
  try {
    const { data } = await client.post('/vendor/subscription/subscribe', {
      tier: selectedTier.value,
      plan: billing.value,
      paymentMethod: 'card',
      audience: 'merchant',
    });
    sub.value = data.subscription;
    currentPlan.value = data.plan;
    showConfirm.value = false;
    alert(`اشتراک شما به «${data.plan.label}» ارتقا یافت!`);
  } catch (e) {
    alert(e.response?.data?.error?.message || 'پرداخت اشتراک ناموفق بود');
  } finally { saving.value = false; }
}

async function cancel() {
  if (!confirm('اشتراک در پایان دوره فعلی لغو می‌شود. آیا مطمئنید؟')) return;
  const { data } = await client.post('/vendor/subscription/cancel');
  sub.value = data;
}
async function resume() {
  const { data } = await client.post('/vendor/subscription/resume');
  sub.value = data;
}

const selected = computed(() => availablePlans.value.find((p) => p.tier === selectedTier.value));
const selectedPrice = computed(() => selected.value?.price?.[billing.value] || 0);
const currentTier = computed(() => sub.value?.tier || currentPlan.value?.tier || 'basic');
const isPaid = computed(() => sub.value && sub.value.tier !== 'basic' && new Date(sub.value.currentPeriodEnd) > new Date());

function tierColor(t) {
  if (t === 'gold') return 'from-coral-500 to-coral-600';
  if (t === 'premium') return 'from-purple-600 to-fuchsia-700';
  return 'from-ink-500 to-ink-700';
}

// قالب تومان با اعداد فارسی
function toman(n) {
  if (!n) return 'رایگان';
  return `${Math.round(n).toLocaleString('fa-IR')} تومان`;
}
function fmtPeriod(b) { return b === 'monthly' ? 'ماهانه' : 'سالانه'; }
function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return ''; }
}
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">قیمت‌گذاری و پلن</h1>
    <p class="text-ink-500 mt-1">پلن مناسب کسب‌وکار خود را انتخاب کنید — ارتقا، سقف کوپن فعال، تعداد شعبه و تحلیل‌ها را افزایش می‌دهد.</p>

    <div v-if="loading" class="mt-6 ios-card h-64 animate-pulse"></div>

    <template v-else>
      <!-- خلاصه پلن فعلی -->
      <div v-if="isPaid" class="mt-5 rounded-3xl bg-gradient-to-br text-white p-6 shadow-lift relative overflow-hidden" :class="tierColor(currentTier)">
        <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10"></div>
        <span class="chip bg-white/15 text-white">{{ currentPlan?.badge || 'فعال' }}</span>
        <div class="mt-3 text-3xl font-bold">پلن مرچنت {{ currentPlan?.label }}</div>
        <div class="opacity-90 mt-1">{{ fmtPeriod(sub.plan) }} · {{ toman(sub.amountUSD) }}</div>
        <div class="mt-3 text-sm opacity-90">
          تمدید بعدی: <span class="font-semibold">{{ fmtDate(sub.currentPeriodEnd) }}</span>
        </div>
        <div v-if="sub.cancelAtPeriodEnd" class="mt-2 text-sm bg-black/20 rounded-xl px-3 py-2">
          در تاریخ {{ fmtDate(sub.currentPeriodEnd) }} لغو می‌شود
        </div>
        <div class="mt-4 flex gap-2">
          <button v-if="!sub.cancelAtPeriodEnd" @click="cancel" class="bg-black/20 backdrop-blur rounded-full px-4 py-2 text-sm font-semibold">لغو اشتراک</button>
          <button v-else @click="resume" class="bg-white text-ink-900 rounded-full px-4 py-2 text-sm font-semibold">فعال‌سازی مجدد</button>
        </div>
      </div>
      <div v-else class="mt-5 ios-card p-5 bg-cream-100 border border-ink-300/20">
        <div class="text-sm">شما در پلن <strong>پایه (رایگان)</strong> هستید — ۱ کوپن فعال، ۱ شعبه، آمار ترافیک پایه. برای امکانات بیشتر، ارتقا دهید.</div>
      </div>

      <div class="mt-6 flex justify-center">
        <div class="inline-flex bg-cream-200 rounded-full p-1">
          <button @click="billing='monthly'" class="px-5 py-1.5 rounded-full text-sm font-semibold transition" :class="billing==='monthly' ? 'bg-white shadow-soft' : 'text-ink-500'">ماهانه</button>
          <button @click="billing='yearly'" class="px-5 py-1.5 rounded-full text-sm font-semibold transition" :class="billing==='yearly' ? 'bg-white shadow-soft' : 'text-ink-500'">سالانه</button>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="p in availablePlans"
          :key="p.tier"
          @click="p.tier !== 'basic' && (selectedTier = p.tier)"
          class="ios-card p-5 cursor-pointer transition relative"
          :class="[selectedTier === p.tier ? 'ring-2 ring-teal-600' : '', p.tier === 'basic' ? 'cursor-default opacity-70' : '']"
        >
          <div v-if="p.badge" class="absolute -top-2 right-4 chip text-white text-[10px]" :class="p.tier === 'gold' ? 'bg-coral-500' : p.tier === 'premium' ? 'bg-purple-600' : 'bg-ink-500'">{{ p.badge }}</div>
          <div v-if="currentTier === p.tier && isPaid" class="absolute -top-2 left-4 chip bg-teal-600 text-white text-[10px]">پلن فعلی</div>

          <div class="text-xl font-bold">{{ p.label }}</div>
          <div class="text-xs text-ink-500">{{ p.description }}</div>
          <div class="mt-3 flex items-baseline gap-1">
            <span class="text-xl font-bold">{{ toman(p.price[billing] || 0) }}</span>
            <span class="text-ink-500 text-sm">{{ fmtPeriod(billing) }}</span>
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
        @click="showConfirm = true"
        class="ios-button-primary w-full mt-5"
      >
        {{ isPaid ? 'تغییر به' : 'دریافت' }} {{ selected?.label }} — {{ toman(selectedPrice) }} {{ fmtPeriod(billing) }}
      </button>

      <div v-if="showConfirm" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lift">
          <div class="text-lg font-bold">تایید اشتراک</div>
          <p class="text-sm text-ink-500 mt-2">مبلغ <strong>{{ toman(selectedPrice) }}</strong> به صورت {{ fmtPeriod(billing) }} برای پلن {{ selected?.label }} از شما کسر می‌شود.</p>
          <div class="mt-4 flex gap-2">
            <button @click="showConfirm = false" class="ios-card flex-1 py-2.5 font-semibold text-ink-700">انصراف</button>
            <button @click="upgrade" :disabled="saving" class="ios-button-primary flex-1">{{ saving ? 'در حال پردازش…' : 'تایید' }}</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
