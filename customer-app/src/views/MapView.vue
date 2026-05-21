<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useFlagsStore } from '../stores/flags';
import LeafletMap from '../components/LeafletMap.vue';
import { directionsUrl } from '../composables/useMapLink';
import { persianNumber } from '../composables/useFormat';

const router = useRouter();
const flags = useFlagsStore();
const loading = ref(true);
const error = ref('');
const merchants = ref([]);
const surpriseBags = ref([]);
const selectedPin = ref(null);
const showList = ref(false);

onMounted(async () => {
  await flags.load();
  if (!flags.isOn('maps')) {
    error.value = 'بخش نقشه هنوز فعال نشده.';
    loading.value = false;
    return;
  }
  try {
    const calls = [client.get('/customer/coupons/browse?limit=50')];
    if (flags.isOn('surprise_bag')) {
      calls.push(client.get('/customer/surprise-bags?limit=30').catch(() => ({ data: { items: [] } })));
    }
    const [mp, sb] = await Promise.all(calls);
    const seen = new Map();
    (mp.data.items || []).forEach((c) => {
      (c.merchantIds || []).forEach((m) => {
        if (m.address && m.address.lat && m.address.lng) {
          if (!seen.has(m._id)) seen.set(m._id, { merchant: m, perks: 0, bags: 0 });
          seen.get(m._id).perks += 1;
        }
      });
    });
    if (sb && sb.data && sb.data.items) {
      sb.data.items.forEach((c) => {
        (c.merchantIds || []).forEach((m) => {
          if (m.address && m.address.lat && m.address.lng) {
            if (!seen.has(m._id)) seen.set(m._id, { merchant: m, perks: 0, bags: 0 });
            seen.get(m._id).bags += 1;
          }
        });
      });
      surpriseBags.value = sb.data.items;
    }
    merchants.value = Array.from(seen.values());
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'بارگذاری نقشه ناموفق بود';
  } finally { loading.value = false; }
});

const pins = computed(() => merchants.value.map((entry) => ({
  lat: entry.merchant.address.lat,
  lng: entry.merchant.address.lng,
  label: entry.bags > 0 ? `🔥 ${entry.merchant.name.split(' - ')[0]}` : entry.merchant.name.split(' - ')[0],
  kind: entry.bags > 0 ? 'surprise_bag' : 'member_perk',
  data: entry,
})));

const center = computed(() => ({ lat: 35.7219, lng: 51.3347 }));

function onPin(pin) { selectedPin.value = pin.data; }
function directions(m) {
  const url = directionsUrl({ lat: m.address.lat, lng: m.address.lng, label: m.name });
  if (url) window.open(url, '_blank');
}
</script>

<template>
  <div class="fixed inset-0 bg-ink-900">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <div class="text-white text-sm">در حال بارگذاری نقشه...</div>
    </div>

    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center px-6">
      <div class="text-center text-white">
        <div class="text-4xl mb-3">🗺️</div>
        <div class="font-bold">{{ error }}</div>
        <p class="text-sm opacity-80 mt-1">از مدیر بخواهید این قابلیت را فعال کند.</p>
        <button @click="router.back()" class="mt-4 ios-button-secondary text-ink-900">برگشت</button>
      </div>
    </div>

    <LeafletMap v-else :pins="pins" :center="center" :dark="true" :zoom="11" @pin-click="onPin" />

    <header v-if="!loading && !error" class="absolute top-0 inset-x-0 z-[1000] safe-top p-3 flex items-center gap-2 pointer-events-none">
      <button @click="router.back()" class="w-11 h-11 rounded-full bg-white shadow-lift flex items-center justify-center active:scale-95 pointer-events-auto">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="bg-white rounded-full shadow-lift px-4 py-2 flex-1 max-w-xs pointer-events-auto">
        <div class="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">نزدیک شما</div>
        <div class="text-sm font-bold">{{ persianNumber(merchants.length) }} شعبه · {{ persianNumber(surpriseBags.length) }} پاکت</div>
      </div>
    </header>

    <button v-if="!loading && !error" @click="showList = !showList" class="absolute bottom-[max(env(safe-area-inset-bottom),16px)] left-1/2 -translate-x-1/2 z-[1000] bg-ink-900 text-white rounded-full px-5 py-3 font-semibold shadow-lift active:scale-95 flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
      {{ showList ? 'بستن لیست' : 'نمایش لیست' }}
    </button>

    <div v-if="selectedPin" class="absolute bottom-24 inset-x-4 z-[1001] bg-white rounded-2xl shadow-lift p-4 animate-slide-up">
      <div class="flex items-start gap-3">
        <img v-if="selectedPin.merchant.logoUrl" :src="selectedPin.merchant.logoUrl" class="w-12 h-12 rounded-xl object-cover bg-cream-200" />
        <div class="flex-1 min-w-0">
          <div class="font-bold truncate">{{ selectedPin.merchant.name }}</div>
          <div class="text-xs text-ink-500 truncate">{{ selectedPin.merchant.address?.street }}، {{ selectedPin.merchant.address?.city }}</div>
          <div class="flex gap-1.5 mt-1.5">
            <span v-if="selectedPin.perks" class="chip bg-teal-50 text-teal-700 text-[10px]">{{ persianNumber(selectedPin.perks) }} مزایا</span>
            <span v-if="selectedPin.bags" class="chip bg-coral-500/10 text-coral-600 text-[10px]">🔥 {{ persianNumber(selectedPin.bags) }} پاکت</span>
          </div>
        </div>
        <button @click="directions(selectedPin.merchant)" class="bg-teal-600 text-white rounded-full px-3 py-2 text-xs font-bold active:scale-95">مسیریابی</button>
      </div>
      <button @click="selectedPin = null" class="absolute top-2 left-2 text-ink-300 active:opacity-50">✕</button>
    </div>

    <div v-if="showList" class="absolute inset-x-0 bottom-0 z-[1002] max-h-[60vh] bg-white rounded-t-3xl shadow-lift overflow-hidden animate-slide-up">
      <div class="px-5 pt-3 pb-2 sticky top-0 bg-white border-b border-cream-200">
        <div class="w-10 h-1.5 bg-ink-300/30 rounded-full mx-auto mb-2"></div>
        <div class="font-bold">{{ persianNumber(merchants.length) }} شعبه نزدیک</div>
      </div>
      <div class="overflow-y-auto pb-[max(env(safe-area-inset-bottom),20px)]" style="max-height:50vh">
        <div v-for="entry in merchants" :key="entry.merchant._id" class="px-5 py-3 flex items-center gap-3 border-b border-cream-200 active:bg-cream-100" @click="selectedPin = entry; showList = false">
          <img v-if="entry.merchant.logoUrl" :src="entry.merchant.logoUrl" class="w-11 h-11 rounded-xl object-cover bg-cream-200 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">{{ entry.merchant.name }}</div>
            <div class="text-xs text-ink-500 truncate">{{ entry.merchant.address?.city }}</div>
          </div>
          <div class="flex gap-1.5">
            <span v-if="entry.bags" class="chip bg-coral-500/10 text-coral-600 text-[10px]">🔥 {{ persianNumber(entry.bags) }}</span>
            <span v-if="entry.perks" class="chip bg-teal-50 text-teal-700 text-[10px]">{{ persianNumber(entry.perks) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
