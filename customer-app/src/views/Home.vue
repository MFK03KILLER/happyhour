<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useDailyStore } from '../stores/daily';
import { useGeolocation, distanceLabel } from '../composables/useGeolocation';

const router = useRouter();
const auth = useAuthStore();
const daily = useDailyStore();
const { coords } = useGeolocation();

const categories = ref([]);
const nearbyMerchants = ref([]);
const trendingOffers = ref([]);
const loading = ref(true);

onMounted(async () => {
  daily.refresh();
  await loadData();
});

watch(coords, (v) => { if (v) loadData(); });

async function loadData() {
  loading.value = true;
  try {
    const params = { sort: 'distance', limit: 6 };
    if (coords.value) { params.lat = coords.value.lat; params.lng = coords.value.lng; }
    const [cats, near, trending] = await Promise.all([
      client.get('/public/categories'),
      client.get('/customer/discover', { params }),
      client.get('/customer/coupons/browse', { params: { ...params, limit: 5 } }).catch(() => ({ data: { items: [] } })),
    ]);
    categories.value = cats.data.items;
    nearbyMerchants.value = near.data.items;
    trendingOffers.value = trending.data.items;
  } finally { loading.value = false; }
}

function goCategory(slug) {
  router.push(`/browse?category=${slug}`);
}
function goMerchant(m) {
  router.push(`/merchant-detail/${m._id}`);
}
function goCoupon(c) {
  const m = (c.merchantIds || [])[0];
  if (m) router.push(`/merchant-detail/${m._id || m}`);
  else router.push(`/coupons/${c._id}`);
}

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const firstName = computed(() => (auth.user?.fullName || 'there').split(' ')[0]);
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6 flex items-center justify-between">
      <div>
        <div class="text-xs text-ink-500 font-medium">{{ today }}</div>
        <div class="text-2xl font-bold mt-0.5">Hi {{ firstName }} 👋</div>
      </div>
      <button @click="router.push('/profile')" class="w-11 h-11 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-bold shadow-soft active:scale-95">
        {{ firstName.charAt(0) }}
      </button>
    </header>

    <div v-if="!daily.loading && daily.remaining < daily.limit" class="mx-5 mt-4 ios-card p-3 flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
        <i class="fa-solid fa-ticket"></i>
      </div>
      <div class="flex-1">
        <div class="text-xs uppercase tracking-wider font-semibold text-ink-500">Today's quota</div>
        <div class="font-bold">{{ daily.remaining }} of {{ daily.limit }} coupons remaining</div>
      </div>
    </div>

    <section class="mx-5 mt-4">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral-500 via-coral-600 to-coral-600 text-white shadow-lift">
        <div class="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10"></div>
        <div class="absolute right-12 bottom-2 w-32 h-32 rounded-full bg-white/10"></div>
        <div class="relative p-6">
          <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">Happy Hour Members</div>
          <div class="text-3xl font-bold mt-1">3 deals every day</div>
          <div class="mt-1 text-white/90 text-sm">Eat, drink, play for less at 100+ Bay Area spots.</div>
          <button @click="router.push('/subscribe')" class="mt-4 bg-white text-coral-600 font-semibold rounded-full px-5 py-2.5 text-sm active:scale-95 transition">
            $4.99/mo · Get started →
          </button>
        </div>
      </div>
    </section>

    <section class="mt-7">
      <div class="flex items-center justify-between px-5 mb-3">
        <h2 class="text-lg font-bold">Categories</h2>
      </div>
      <div class="grid grid-cols-4 gap-3 px-5">
        <button v-for="c in categories" :key="c._id" @click="goCategory(c.slug)" class="flex flex-col items-center gap-2 active:scale-95 transition">
          <div class="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center">
            <i class="text-2xl text-teal-600 fa-solid" :class="c.iconUrl || 'fa-location-dot'"></i>
          </div>
          <div class="text-xs font-semibold text-ink-700 text-center leading-tight">{{ c.name }}</div>
        </button>
      </div>
    </section>

    <section class="mt-7">
      <div class="flex items-center justify-between px-5 mb-3">
        <div>
          <h2 class="text-lg font-bold">Nearby</h2>
          <div v-if="!coords" class="text-xs text-ink-500">Enable location for accurate results</div>
        </div>
        <button @click="router.push('/browse')" class="text-sm font-semibold text-teal-700">See all</button>
      </div>
      <div v-if="loading" class="flex gap-3 px-5 overflow-x-auto scroll-no-bar">
        <div v-for="i in 3" :key="i" class="flex-shrink-0 w-56 h-48 bg-cream-200 animate-pulse rounded-2xl"></div>
      </div>
      <div v-else class="flex gap-3 px-5 overflow-x-auto scroll-no-bar pb-1">
        <button v-for="m in nearbyMerchants" :key="m._id" @click="goMerchant(m)" class="flex-shrink-0 w-56 rounded-2xl overflow-hidden bg-white shadow-soft active:scale-95 transition text-left">
          <div class="relative aspect-[16/10] bg-cream-200">
            <img :src="m.coverImageUrl || m.logoUrl" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div class="absolute top-2 right-2 chip bg-white/95 text-ink-900 text-[10px]">
              <i class="fa-solid fa-star text-yellow-500 text-[9px]"></i>
              {{ (m.rating || 0).toFixed(1) }}
            </div>
            <div v-if="m.distanceKm != null" class="absolute bottom-2 left-2 chip bg-white/95 text-ink-900 text-[10px]">
              <i class="fa-solid fa-location-dot text-[9px]"></i>
              {{ distanceLabel(m.distanceKm) }}
            </div>
          </div>
          <div class="p-3">
            <div class="font-bold text-sm leading-tight truncate">{{ m.name.split(' — ')[0] }}</div>
            <div class="text-[11px] text-ink-500 truncate mt-0.5">
              {{ m.subCategory }} · {{ '$'.repeat(m.priceLevel || 2) }}
            </div>
          </div>
        </button>
      </div>
    </section>

    <section class="mt-7 px-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold">Trending offers</h2>
      </div>
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="ios-card h-32 animate-pulse"></div>
      </div>
      <div v-else class="space-y-3">
        <button v-for="c in trendingOffers" :key="c._id" @click="goCoupon(c)" class="block w-full text-left active:scale-[.985] transition">
          <div class="ios-card flex overflow-hidden">
            <img :src="c.heroImageUrl" class="w-28 h-28 object-cover bg-cream-200 flex-shrink-0" />
            <div class="flex-1 p-4 min-w-0">
              <div class="text-[10px] uppercase tracking-wider font-semibold text-ink-500 truncate">{{ c.vendorId?.name }}</div>
              <div class="font-bold mt-0.5 truncate">{{ c.title }}</div>
              <div class="text-xs text-ink-500 truncate mt-0.5">{{ c.subtitle }}</div>
              <div class="mt-2 flex items-center gap-1.5">
                <span class="chip bg-coral-500/10 text-coral-600 text-[10px]"><i class="fa-solid fa-fire text-[9px]"></i> {{ c.todaysOffer ? "Today" : "Featured" }}</span>
                <span v-if="c.distanceKm != null" class="chip bg-cream-200 text-ink-700 text-[10px]">{{ distanceLabel(c.distanceKm) }}</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>
