<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import TicketCoupon from '../components/TicketCoupon.vue';
import MapPreview from '../components/MapPreview.vue';
import { useGeolocation, distanceLabel } from '../composables/useGeolocation';
import { useDailyStore } from '../stores/daily';
import { useToastStore } from '../stores/toast';
import { directionsUrl } from '../composables/useMapLink';

const route = useRoute();
const router = useRouter();
const { coords } = useGeolocation();
const daily = useDailyStore();
const toast = useToastStore();

const merchant = ref(null);
const coupons = ref([]);
const loading = ref(true);
const subscription = ref(null);
const claiming = ref(null);

function isActiveNow(coupon) {
  const w = coupon.activeWindow;
  if (!w || !w.start || !w.end) return true;
  const days = w.days || ['daily'];
  const now = new Date();
  const dayName = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
  if (!days.includes('daily') && !days.includes(dayName)) return false;
  const [sh, sm] = w.start.split(':').map(Number);
  const [eh, em] = w.end.split(':').map(Number);
  const minNow = now.getHours() * 60 + now.getMinutes();
  return minNow >= sh * 60 + sm && minNow <= eh * 60 + em;
}

function windowLabel(coupon) {
  const w = coupon.activeWindow;
  if (!w || !w.start || !w.end) return '';
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2,'0')}${ampm}`;
  };
  const days = w.days || ['daily'];
  const dayText = days.includes('daily') ? 'daily' : days.map((d) => d[0].toUpperCase() + d.slice(1)).join('/');
  return `${dayText} ${fmt(w.start)}–${fmt(w.end)}`;
}

onMounted(async () => {
  daily.refresh();
  try {
    const params = {};
    if (coords.value) { params.lat = coords.value.lat; params.lng = coords.value.lng; }
    const [m, s] = await Promise.all([
      client.get(`/customer/merchants/${route.params.id}`, { params }),
      client.get('/customer/subscription').catch(() => ({ data: { subscription: null } })),
    ]);
    merchant.value = m.data.merchant;
    coupons.value = m.data.coupons;
    subscription.value = s.data.subscription;
    const gold = (s.data.available || []).find((p) => p.tier === 'gold');
    if (gold) goldPrice.value = gold.price.monthly;
  } finally { loading.value = false; }
});

const goldPrice = ref(null);
const goldPriceLabel = computed(() => goldPrice.value != null ? Number(goldPrice.value).toLocaleString('fa-IR') : '۹۹۹٬۰۰۰');

const isSubscribed = computed(() => {
  const s = subscription.value;
  return s && s.status === 'active' && new Date(s.currentPeriodEnd) > new Date();
});

const todaysOffers = computed(() => coupons.value.filter((c) => c.todaysOffer));
const popupOffers = computed(() => coupons.value.filter((c) => c.popupOffer));
const otherOffers = computed(() => coupons.value.filter((c) => !c.todaysOffer && !c.popupOffer));

function variantFor(c) {
  if (c.popupOffer) return 'popup';
  if (c.todaysOffer) return 'today';
  return 'always';
}

async function onClaim(coupon) {
  if (!isSubscribed.value) {
    toast.info('برای دریافت کوپن عضو شوید', { title: 'نیازمند عضویت', action: { label: 'عضویت ←', handler: () => router.push('/subscribe') } });
    return;
  }
  if (daily.isExhausted) {
    toast.warning(`شما هر ۳ کوپن امروز را استفاده کرده‌اید. نیمه‌شب صفر می‌شود.`, { title: 'سقف روزانه پر شد' });
    return;
  }
  claiming.value = coupon._id;
  try {
    const { data } = await client.post(`/customer/coupons/${coupon._id}/claim`);
    daily.optimisticIncrement();
    const activeNow = data.activeNow !== false;
    if (activeNow) {
      toast.success('در کیف پول شما ذخیره شد. برای استفاده آن را در صندوق فروشگاه نشان دهید.', {
        title: 'کوپن دریافت شد! 🎉',
        action: { label: 'کیف پول', handler: () => router.push('/wallet') },
      });
    } else {
      const w = windowLabel(coupon);
      toast.warning(`دریافت شد، اما فقط در ساعات هپی اَور${w ? ` (${w})` : ''} قابل استفاده است. در آن ساعات مراجعه کنید.`, {
        title: 'خارج از ساعات هپی اَور',
        ttl: 9000,
        action: { label: 'کیف پول', handler: () => router.push('/wallet') },
      });
    }
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'دریافت کوپن ممکن نشد', { title: 'دریافت ناموفق بود' });
  } finally { claiming.value = null; }
}

function openDirections() {
  if (!merchant.value?.address) return;
  const url = directionsUrl({ lat: merchant.value.address.lat, lng: merchant.value.address.lng, label: merchant.value.name });
  if (url) window.open(url, '_blank');
}

const priceLabel = computed(() => '$'.repeat(merchant.value?.priceLevel || 2));

function offPeakLabel() {
  const slots = merchant.value?.offPeakHours || [];
  if (!slots.length) return null;
  const first = slots[0];
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2,'0')}${ampm}`;
  };
  return `${fmt(first.start)} – ${fmt(first.end)}`;
}
</script>

<template>
  <div v-if="loading" class="p-6 safe-top">
    <div class="h-72 bg-cream-200 rounded-3xl animate-pulse mb-4"></div>
    <div class="h-32 bg-cream-200 rounded-2xl animate-pulse"></div>
  </div>

  <div v-else-if="merchant" class="pb-32">
    <div class="relative">
      <img :src="merchant.coverImageUrl || merchant.logoUrl" class="w-full h-64 object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

      <button @click="router.back()" class="absolute top-[max(env(safe-area-inset-top),16px)] left-4 w-11 h-11 rounded-full glass flex items-center justify-center active:scale-95">
        <i class="fa-solid fa-arrow-left text-ink-900"></i>
      </button>
      <button class="absolute top-[max(env(safe-area-inset-top),16px)] right-4 w-11 h-11 rounded-full glass flex items-center justify-center active:scale-95">
        <i class="fa-regular fa-heart text-ink-900"></i>
      </button>

      <div class="absolute bottom-4 left-5 right-5 text-white">
        <div class="text-[11px] uppercase tracking-wider font-semibold opacity-90 flex items-center gap-2">
          <i class="fa-solid fa-location-dot"></i>
          {{ merchant.address?.city }}{{ merchant.distanceKm ? ` · ${distanceLabel(merchant.distanceKm)}` : '' }}
        </div>
        <h1 class="text-3xl font-bold mt-1 leading-tight">{{ merchant.name.split(' — ')[0] }}</h1>
        <div class="flex items-center gap-3 mt-2 text-sm">
          <div class="flex items-center gap-1">
            <i class="fa-solid fa-star text-yellow-400"></i>
            <span class="font-bold">{{ (merchant.rating || 0).toFixed(1) }}</span>
            <span class="opacity-70 text-xs">({{ merchant.ratingCount || 0 }})</span>
          </div>
          <span class="opacity-50">•</span>
          <span class="font-bold">{{ priceLabel }}</span>
          <span v-if="merchant.subCategory" class="opacity-50">•</span>
          <span v-if="merchant.subCategory">{{ merchant.subCategory }}</span>
        </div>
      </div>
    </div>

    <div class="px-5 mt-5">
      <p v-if="merchant.description" class="text-ink-700 leading-relaxed">{{ merchant.description }}</p>

      <div class="mt-4 flex gap-2">
        <button @click="openDirections" class="flex-1 ios-card p-3 flex items-center justify-center gap-2 active:scale-95 transition">
          <i class="fa-solid fa-diamond-turn-right text-teal-700"></i>
          <span class="font-semibold text-sm">مسیریابی</span>
        </button>
        <a v-if="merchant.phone" :href="`tel:${merchant.phone}`" class="flex-1 ios-card p-3 flex items-center justify-center gap-2 active:scale-95 transition">
          <i class="fa-solid fa-phone text-teal-700"></i>
          <span class="font-semibold text-sm">تماس</span>
        </a>
        <button class="flex-1 ios-card p-3 flex items-center justify-center gap-2 active:scale-95 transition">
          <i class="fa-solid fa-circle-info text-teal-700"></i>
          <span class="font-semibold text-sm">درباره</span>
        </button>
      </div>

      <div v-if="merchant.address?.lat" class="mt-4">
        <MapPreview :lat="merchant.address.lat" :lng="merchant.address.lng" :name="merchant.name" height="160px" />
      </div>

      <div class="mt-3 ios-card p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-location-dot"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm">{{ merchant.address?.street }}</div>
          <div class="text-xs text-ink-500 mt-0.5">{{ merchant.address?.city }}, {{ merchant.address?.state }} {{ merchant.address?.zip }}</div>
        </div>
      </div>

      <div v-if="offPeakLabel()" class="mt-3 ios-card p-4 flex items-start gap-3 bg-coral-500/5 border border-coral-500/20">
        <div class="w-10 h-10 rounded-xl bg-coral-500 text-white flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-clock"></i>
        </div>
        <div class="flex-1">
          <div class="font-bold text-sm text-coral-600">هپی اَور: {{ offPeakLabel() }}</div>
          <div class="text-xs text-ink-500 mt-0.5">کوپن‌ها در این ساعت‌ها قابل استفاده هستند</div>
        </div>
      </div>
    </div>

    <section v-if="todaysOffers.length" class="px-5 mt-7">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-fire text-coral-500"></i>
          <h2 class="text-lg font-bold">آفرهای امروز</h2>
        </div>
        <span class="chip bg-coral-500/10 text-coral-600 text-[10px]">{{ todaysOffers.length }}</span>
      </div>
      <div class="space-y-3">
        <TicketCoupon
          v-for="c in todaysOffers" :key="c._id"
          :coupon="c" :locked="!isSubscribed" variant="today"
          :outside-hours="isSubscribed && !isActiveNow(c)"
          @claim="onClaim"
        />
      </div>
    </section>

    <section v-if="popupOffers.length" class="px-5 mt-7">
      <div class="flex items-center gap-2 mb-3">
        <i class="fa-solid fa-bolt text-purple-500"></i>
        <h2 class="text-lg font-bold">آفرهای ویژه پاپ‌آپ</h2>
      </div>
      <div class="space-y-3">
        <TicketCoupon
          v-for="c in popupOffers" :key="c._id"
          :coupon="c" :locked="!isSubscribed" variant="popup"
          :outside-hours="isSubscribed && !isActiveNow(c)"
          @claim="onClaim"
        />
      </div>
    </section>

    <section v-if="otherOffers.length" class="px-5 mt-7">
      <h2 class="text-lg font-bold mb-3">آفرهای بیشتر</h2>
      <div class="space-y-3">
        <TicketCoupon
          v-for="c in otherOffers" :key="c._id"
          :coupon="c" :locked="!isSubscribed" variant="always"
          :outside-hours="isSubscribed && !isActiveNow(c)"
          @claim="onClaim"
        />
      </div>
    </section>

    <div v-if="!isSubscribed" class="fixed bottom-0 inset-x-0 z-30 glass border-t border-white/40 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="text-xs text-ink-500">ویژه اعضا</div>
          <div class="font-bold">عضو شوید و همه را باز کنید</div>
        </div>
        <div class="text-left">
          <div class="text-lg font-bold text-teal-700">{{ goldPriceLabel }} تومان / ماه</div>
        </div>
      </div>
      <button @click="router.push('/subscribe')" class="ios-button-primary w-full">
        Become a member
      </button>
    </div>

    <div v-else class="fixed bottom-0 inset-x-0 z-30 glass border-t border-white/40 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
      <div class="text-center text-sm">
        <span class="font-bold text-teal-700">{{ daily.remaining }}</span>
        <span class="text-ink-500"> of {{ daily.limit }} daily coupons left</span>
      </div>
    </div>

  </div>
</template>
