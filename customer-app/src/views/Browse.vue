<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import { useGeolocation, distanceLabel } from '../composables/useGeolocation';

const route = useRoute();
const router = useRouter();
const { coords, status: geoStatus, request: requestGeo } = useGeolocation();

const search = ref('');
const category = ref(route.query.category || '');
const sort = ref('distance');
const order = ref('asc');
const priceMin = ref(null);
const priceMax = ref(null);
const ratingMin = ref(null);
const showFilters = ref(false);
const merchants = ref([]);
const categories = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const params = {
      sort: sort.value, order: order.value, limit: 50,
      category: category.value || undefined,
      search: search.value || undefined,
    };
    if (coords.value) { params.lat = coords.value.lat; params.lng = coords.value.lng; }
    if (priceMin.value != null) params.priceMin = priceMin.value;
    if (priceMax.value != null) params.priceMax = priceMax.value;
    if (ratingMin.value != null) params.ratingMin = ratingMin.value;
    const { data } = await client.get('/customer/discover', { params });
    merchants.value = data.items;
  } finally { loading.value = false; }
}

onMounted(async () => {
  if (!coords.value && geoStatus.value === 'idle') await requestGeo();
  const cats = await client.get('/public/categories');
  categories.value = cats.data.items;
  await load();
});

watch(() => route.query.category, (v) => { category.value = v || ''; load(); });

function setCat(slug) {
  category.value = category.value === slug ? '' : slug;
  router.replace({ query: { ...route.query, category: category.value || undefined } });
  load();
}

function setSort(s) {
  if (sort.value === s) order.value = order.value === 'asc' ? 'desc' : 'asc';
  else { sort.value = s; order.value = s === 'rating' ? 'desc' : 'asc'; }
  load();
}

function applyFilters() {
  showFilters.value = false;
  load();
}

function clearFilters() {
  priceMin.value = null;
  priceMax.value = null;
  ratingMin.value = null;
  load();
}

const activeFilterCount = computed(() => {
  let n = 0;
  if (priceMin.value != null || priceMax.value != null) n++;
  if (ratingMin.value != null) n++;
  return n;
});

function sortLabel(s) {
  const base = { distance: 'Distance', rating: 'Rating', price: 'Price' }[s];
  if (sort.value !== s) return base;
  return `${base} ${order.value === 'asc' ? '↑' : '↓'}`;
}
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">Browse</h1>
      <div class="mt-4 relative">
        <i class="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-ink-300"></i>
        <input v-model="search" @keyup.enter="load" class="input pr-11" placeholder="Search merchants, cuisines..." />
      </div>
    </header>

    <div class="mt-4 flex gap-2 px-5 overflow-x-auto scroll-no-bar">
      <button @click="setCat('')" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition" :class="!category ? 'bg-ink-900 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">All</button>
      <button v-for="c in categories" :key="c._id" @click="setCat(c.slug)" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-1.5" :class="category===c.slug ? 'bg-ink-900 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">
        <i class="fa-solid" :class="c.iconUrl"></i>
        {{ c.name }}
      </button>
    </div>

    <div class="mt-4 px-5 flex gap-2 flex-wrap items-center">
      <button @click="setSort('distance')" class="chip transition" :class="sort==='distance' ? 'bg-teal-600 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">
        <i class="fa-solid fa-location-arrow text-[9px]"></i>
        {{ sortLabel('distance') }}
      </button>
      <button @click="setSort('rating')" class="chip transition" :class="sort==='rating' ? 'bg-teal-600 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">
        <i class="fa-solid fa-star text-[9px]"></i>
        {{ sortLabel('rating') }}
      </button>
      <button @click="setSort('price')" class="chip transition" :class="sort==='price' ? 'bg-teal-600 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">
        <i class="fa-solid fa-dollar-sign text-[9px]"></i>
        {{ sortLabel('price') }}
      </button>
      <button @click="showFilters = true" class="chip transition relative" :class="activeFilterCount ? 'bg-teal-600 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">
        <i class="fa-solid fa-sliders text-[9px]"></i>
        Filters
        <span v-if="activeFilterCount" class="absolute -top-1 -right-1 bg-coral-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{{ activeFilterCount }}</span>
      </button>
    </div>

    <section class="mt-6 px-5 space-y-3">
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="ios-card h-28 animate-pulse"></div>
      </div>
      <div v-else-if="merchants.length === 0" class="text-center py-12 text-ink-500">
        <div class="text-4xl mb-2">🔍</div>
        <div>No results — try different filters.</div>
      </div>
      <button v-else v-for="m in merchants" :key="m._id" @click="router.push(`/merchant-detail/${m._id}`)" class="block w-full text-left active:scale-[.985] transition">
        <div class="ios-card flex overflow-hidden">
          <img :src="m.coverImageUrl || m.logoUrl" class="w-28 h-28 object-cover bg-cream-200 flex-shrink-0" />
          <div class="flex-1 p-4 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="font-bold leading-tight truncate">{{ m.name.split(' — ')[0] }}</div>
                <div class="text-xs text-ink-500 truncate mt-0.5">{{ m.subCategory }} · {{ '$'.repeat(m.priceLevel || 2) }}</div>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <i class="fa-solid fa-star text-yellow-500 text-xs"></i>
                <span class="font-bold text-sm">{{ (m.rating || 0).toFixed(1) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 mt-2 text-xs text-ink-500">
              <i class="fa-solid fa-location-dot"></i>
              <span class="truncate">{{ m.address?.city }}</span>
              <span v-if="m.distanceKm != null">· {{ distanceLabel(m.distanceKm) }}</span>
            </div>
          </div>
        </div>
      </button>
    </section>

    <div v-if="showFilters" class="fixed inset-0 z-50 bg-black/40 flex items-end" @click="showFilters = false">
      <div class="w-full bg-white rounded-t-3xl p-6 pb-[max(env(safe-area-inset-bottom),24px)] animate-slide-up" @click.stop>
        <div class="w-10 h-1.5 bg-ink-300/30 rounded-full mx-auto mb-4"></div>
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">Filters</div>
          <button @click="clearFilters" class="text-sm text-teal-700 font-semibold">Clear</button>
        </div>

        <div class="space-y-5">
          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 mb-2">Price range</div>
            <div class="grid grid-cols-4 gap-2">
              <button v-for="n in 4" :key="n" @click="priceMax = (priceMax === n ? null : n)" class="py-2.5 rounded-2xl border-2 transition active:scale-95" :class="priceMax === n ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20 text-ink-700'">
                <span class="font-bold">{{ '$'.repeat(n) }}</span>
              </button>
            </div>
          </div>

          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 mb-2">Minimum rating</div>
            <div class="grid grid-cols-5 gap-2">
              <button v-for="r in [3, 3.5, 4, 4.5, 5]" :key="r" @click="ratingMin = (ratingMin === r ? null : r)" class="py-2.5 rounded-2xl border-2 transition active:scale-95 flex items-center justify-center gap-1 text-sm" :class="ratingMin === r ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20 text-ink-700'">
                <i class="fa-solid fa-star text-yellow-500 text-[10px]"></i>
                <span class="font-bold">{{ r }}+</span>
              </button>
            </div>
          </div>
        </div>

        <button @click="applyFilters" class="ios-button-primary w-full mt-6">Apply filters</button>
      </div>
    </div>
  </div>
</template>
