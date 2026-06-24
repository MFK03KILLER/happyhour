<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useFlagsStore } from '../stores/flags';
import LeafletMap from '../components/LeafletMap.vue';
import { directionsUrl } from '../composables/useMapLink';
import { useGeolocation, distanceLabel } from '../composables/useGeolocation';

const router = useRouter();
const flags = useFlagsStore();
const { coords, request: requestGeo } = useGeolocation();

const loading = ref(true);
const error = ref('');
const merchants = ref([]);
const selectedId = ref(null);
const sheetOpen = ref(true);
const mapRef = ref(null);

const SF = { lat: 37.7749, lng: -122.4194 };
const userLoc = computed(() => coords.value || null);
// Center on the cluster of restaurants (they're all in SF) so they're always visible,
// even when the viewer is far away. The blue dot still shows the real location.
const mapCenter = computed(() => {
  const pts = merchants.value.filter((e) => e.merchant.address?.lat != null);
  if (!pts.length) return coords.value || SF;
  const lat = pts.reduce((s, e) => s + e.merchant.address.lat, 0) / pts.length;
  const lng = pts.reduce((s, e) => s + e.merchant.address.lng, 0) / pts.length;
  return { lat, lng };
});
const sheetHeight = computed(() => (sheetOpen.value ? '42vh' : '116px'));

function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function iconFor(m) {
  const sub = (m.subCategory || '').toLowerCase();
  const tags = (m.cuisineTags || []).join(' ').toLowerCase();
  if (sub.includes('bakery') || tags.includes('bakery')) return '🥐';
  if (sub.includes('steak') || tags.includes('steak')) return '🥩';
  return ({ cafe: '☕', dining: '🍽️', bar: '🍷', activities: '🎟️', wellness: '💆', hotels: '🏨', services: '🛍️' })[m.category] || '📍';
}

onMounted(async () => {
  await flags.load();
  if (!flags.isOn('maps')) { error.value = 'Maps view is not enabled yet.'; loading.value = false; return; }
  try { await requestGeo(); } catch { /* user may deny — fall back to SF */ }
  try {
    const params = { limit: 60 };
    if (coords.value) { params.lat = coords.value.lat; params.lng = coords.value.lng; }
    const calls = [client.get('/customer/coupons/browse', { params })];
    if (flags.isOn('surprise_bag')) {
      calls.push(client.get('/customer/surprise-bags', { params: { limit: 40 } }).catch(() => ({ data: { items: [] } })));
    }
    const [mp, sb] = await Promise.all(calls);
    const seen = new Map();
    const ingest = (items, key) => (items || []).forEach((c) => (c.merchantIds || []).forEach((m) => {
      if (m.address && m.address.lat != null && m.address.lng != null) {
        if (!seen.has(m._id)) seen.set(m._id, { merchant: m, perks: 0, bags: 0 });
        seen.get(m._id)[key] += 1;
      }
    }));
    ingest(mp.data.items, 'perks');
    if (sb && sb.data) ingest(sb.data.items, 'bags');
    const here = coords.value || null;
    merchants.value = Array.from(seen.values())
      .map((e) => ({
        ...e,
        id: e.merchant._id,
        icon: iconFor(e.merchant),
        distanceKm: here ? haversineKm(here, { lat: e.merchant.address.lat, lng: e.merchant.address.lng }) : null,
      }))
      .sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not load map';
  } finally { loading.value = false; }
});

const pins = computed(() => merchants.value.map((e) => ({
  id: e.id, lat: e.merchant.address.lat, lng: e.merchant.address.lng,
  icon: e.icon, kind: e.bags > 0 ? 'surprise_bag' : 'member_perk',
})));
const selected = computed(() => merchants.value.find((e) => e.id === selectedId.value) || null);

function selectMerchant(e) {
  selectedId.value = e.id;
  if (mapRef.value) mapRef.value.focus(e.merchant.address.lat, e.merchant.address.lng);
}
function onPin(p) {
  const e = merchants.value.find((x) => x.id === p.id);
  if (e) selectMerchant(e);
}
function onMapReady() { if (mapRef.value) mapRef.value.fitToPins(); }
function recenter() { if (mapRef.value) mapRef.value.recenter(14); }
function directions(m) {
  const url = directionsUrl({ lat: m.address.lat, lng: m.address.lng, label: m.name });
  if (url) window.open(url, '_blank');
}
function goMerchant(m) { router.push(`/merchant-detail/${m._id}`); }
</script>

<template>
  <div class="fixed inset-0 bg-[#e8eaed]">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center z-[1100] bg-cream-100">
      <div class="text-center">
        <div class="text-3xl mb-2 animate-pulse">📍</div>
        <div class="text-ink-500 text-sm">Finding places near you…</div>
      </div>
    </div>

    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center px-6 bg-cream-100">
      <div class="text-center">
        <div class="text-4xl mb-3">🗺️</div>
        <div class="font-bold">{{ error }}</div>
        <p class="text-sm text-ink-500 mt-1">Ask the admin to enable Maps.</p>
        <button @click="router.back()" class="mt-4 ios-button-primary">Go back</button>
      </div>
    </div>

    <template v-else>
      <LeafletMap ref="mapRef" :pins="pins" :user-location="userLoc" :center="mapCenter"
        :selected-id="selectedId" :zoom="12" :dark="false" @pin-click="onPin" @map-ready="onMapReady" />

      <!-- Top bar -->
      <header class="absolute top-0 inset-x-0 z-[1000] safe-top p-3 flex items-center gap-2 pointer-events-none">
        <button @click="router.back()" class="w-11 h-11 rounded-full bg-white shadow-lift flex items-center justify-center active:scale-95 pointer-events-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="bg-white rounded-full shadow-lift px-4 py-2.5 flex-1 pointer-events-auto flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-teal-600 flex-shrink-0"></span>
          <div class="text-sm font-bold truncate">{{ merchants.length }} places near you</div>
        </div>
      </header>

      <!-- Recenter FAB (hidden while a card is open) -->
      <button v-if="!selected" @click="recenter"
        class="absolute right-3 z-[1000] w-12 h-12 rounded-full bg-white shadow-lift flex items-center justify-center active:scale-95"
        :style="{ bottom: 'calc(' + sheetHeight + ' + 14px)' }" aria-label="Recenter">
        <svg class="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path stroke-linecap="round" d="M12 2v3M12 19v3M22 12h-3M5 12H2"/></svg>
      </button>

      <!-- Selected place card -->
      <div v-if="selected" class="absolute left-3 right-3 z-[1002] animate-slide-up"
        :style="{ bottom: 'calc(' + sheetHeight + ' + 14px)' }">
        <div class="bg-white rounded-2xl shadow-lift p-4 relative">
          <button @click="selectedId = null" class="absolute top-2.5 right-3 text-ink-300 active:opacity-50">✕</button>
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-2xl bg-cream-200 flex items-center justify-center text-2xl flex-shrink-0">{{ selected.icon }}</div>
            <div class="flex-1 min-w-0 pr-4">
              <div class="font-bold truncate">{{ selected.merchant.name }}</div>
              <div class="text-xs text-ink-500 truncate">{{ selected.merchant.address?.street }}, {{ selected.merchant.address?.city }}</div>
              <div class="flex gap-2 mt-1.5 items-center flex-wrap">
                <span v-if="selected.distanceKm != null" class="text-xs font-semibold text-teal-700">{{ distanceLabel(selected.distanceKm) }} away</span>
                <span v-if="selected.perks" class="chip bg-teal-50 text-teal-700 text-[10px]">{{ selected.perks }} deals</span>
                <span v-if="selected.bags" class="chip bg-coral-500/10 text-coral-600 text-[10px]">🔥 {{ selected.bags }} bags</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2 mt-3">
            <button @click="goMerchant(selected.merchant)" class="ios-button-primary flex-1 py-2.5 text-sm">View deals</button>
            <button @click="directions(selected.merchant)" class="ios-button-secondary py-2.5 px-4 text-sm">Directions</button>
          </div>
        </div>
      </div>

      <!-- Bottom sheet -->
      <div class="absolute inset-x-0 bottom-0 z-[1001] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,.15)] transition-[height] duration-200"
        :style="{ height: sheetHeight }">
        <button @click="sheetOpen = !sheetOpen" class="w-full pt-2.5 pb-1 flex justify-center">
          <div class="w-10 h-1.5 bg-ink-300/40 rounded-full"></div>
        </button>
        <div class="px-5 pb-2 flex items-center justify-between">
          <div class="font-bold">Nearby deals</div>
          <div class="text-xs text-ink-500">{{ merchants.length }} spots</div>
        </div>
        <div class="overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),16px)]"
          :style="{ height: 'calc(' + sheetHeight + ' - 74px)' }">
          <button v-for="e in merchants" :key="e.id" @click="selectMerchant(e)"
            class="w-full text-left px-3 py-2.5 rounded-2xl flex items-center gap-3 active:bg-cream-100"
            :class="selectedId === e.id ? 'bg-cream-100 ring-1 ring-teal-600/30' : ''">
            <div class="w-11 h-11 rounded-2xl bg-cream-200 flex items-center justify-center text-xl flex-shrink-0">{{ e.icon }}</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ e.merchant.name }}</div>
              <div class="text-xs text-ink-500 truncate">
                {{ e.merchant.subCategory || e.merchant.category }} · {{ e.merchant.address?.city }}
                <span v-if="e.distanceKm != null"> · {{ distanceLabel(e.distanceKm) }}</span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span v-if="e.bags" class="chip bg-coral-500/10 text-coral-600 text-[10px]">🔥 {{ e.bags }}</span>
              <span v-if="e.perks" class="chip bg-teal-50 text-teal-700 text-[10px]">{{ e.perks }} {{ e.perks === 1 ? 'deal' : 'deals' }}</span>
            </div>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
