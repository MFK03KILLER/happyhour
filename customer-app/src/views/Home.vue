<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useFlagsStore } from '../stores/flags';
import CouponCard from '../components/CouponCard.vue';
import { toman } from '../composables/useFormat';

const router = useRouter();
const auth = useAuthStore();
const flags = useFlagsStore();
const featured = ref([]);
const surpriseBags = ref([]);
const categories = ref([]);
const loading = ref(true);

onMounted(async () => {
  await flags.load();
  const calls = [
    client.get('/customer/coupons/browse?limit=8'),
    client.get('/public/categories'),
  ];
  if (flags.isOn('surprise_bag')) {
    calls.push(client.get('/customer/surprise-bags?limit=6').catch(() => ({ data: { items: [] } })));
  }
  try {
    const [c, cats, bags] = await Promise.all(calls);
    featured.value = c.data.items;
    categories.value = cats.data.items;
    if (bags) surpriseBags.value = bags.data.items;
  } finally { loading.value = false; }
});

function go(c) { router.push(`/coupons/${c._id}`); }
function goBag(c) { router.push(`/surprise-bag/${c._id}`); }
function browseCategory(slug) { router.push(`/browse?category=${slug}`); }
function savings(c) { if (!c.originalValueUSD || !c.priceUSD) return null; return Math.round(100 - (c.priceUSD / c.originalValueUSD) * 100); }

const today = new Date().toLocaleDateString('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6 flex items-center justify-between">
      <div>
        <div class="text-xs text-ink-500 font-medium">{{ today }}</div>
        <div class="text-2xl font-bold mt-0.5">سلام {{ (auth.user && auth.user.fullName) ? auth.user.fullName.split(' ')[0] : '' }} 👋</div>
      </div>
      <button @click="router.push('/profile')" class="w-11 h-11 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-bold shadow-soft active:scale-95">
        {{ (auth.user && auth.user.fullName) ? auth.user.fullName.charAt(0) : 'ه' }}
      </button>
    </header>

    <section class="mx-5 mt-6">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white shadow-lift">
        <div class="absolute -left-8 -top-8 w-48 h-48 rounded-full bg-white/10"></div>
        <div class="absolute left-12 bottom-2 w-32 h-32 rounded-full bg-coral-500/20"></div>
        <div class="relative p-6">
          <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">تا</div>
          <div class="text-4xl font-bold mt-1">۷۰٪ تخفیف</div>
          <div class="mt-1 text-cream-50/90">در رستوران‌ها و کافه‌های مورد علاقه‌تان.</div>
          <button @click="router.push('/browse')" class="mt-5 bg-white text-teal-700 font-semibold rounded-full px-5 py-2.5 text-sm active:scale-95 transition">
            مشاهده تخفیف‌ها ←
          </button>
        </div>
      </div>
    </section>

    <section v-if="flags.isOn('surprise_bag') && surpriseBags.length" class="mt-8">
      <div class="flex items-center justify-between px-5 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🔥</span>
          <h2 class="text-lg font-bold">پاکت‌های امشب</h2>
        </div>
        <button @click="router.push('/tonight')" class="text-sm font-semibold text-coral-600">دیدن همه</button>
      </div>
      <div class="flex gap-3 px-5 overflow-x-auto scroll-no-bar pb-1">
        <button v-for="c in surpriseBags" :key="c._id" @click="goBag(c)" class="flex-shrink-0 w-56 rounded-2xl overflow-hidden bg-white shadow-soft active:scale-95 transition text-right">
          <div class="relative aspect-[16/10] bg-cream-200">
            <img v-if="c.heroImageUrl" :src="c.heroImageUrl" class="w-full h-full object-cover" :alt="c.title" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"></div>
            <div class="absolute top-2 right-2 flex gap-1">
              <span v-if="savings(c)" class="chip bg-coral-500 text-white text-[10px]">٪{{ savings(c) }}-</span>
              <span v-if="c.inventoryRemaining != null" class="chip bg-white/95 text-ink-900 text-[10px]">{{ c.inventoryRemaining }} مانده</span>
            </div>
          </div>
          <div class="p-3">
            <div class="text-[10px] uppercase font-semibold text-ink-500 tracking-wider truncate">{{ c.vendorId?.name }}</div>
            <div class="font-bold text-sm leading-tight truncate">{{ c.title }}</div>
            <div class="flex items-baseline justify-between mt-2">
              <div class="text-base font-bold text-teal-700">{{ toman(c.priceUSD) }}</div>
              <div v-if="c.originalValueUSD" class="text-[10px] text-ink-300 line-through">{{ toman(c.originalValueUSD) }}</div>
            </div>
          </div>
        </button>
      </div>
    </section>

    <section class="mt-8">
      <div class="flex items-center justify-between px-5 mb-3">
        <h2 class="text-lg font-bold">دسته‌بندی‌ها</h2>
      </div>
      <div class="flex gap-3 px-5 overflow-x-auto scroll-no-bar pb-1">
        <button v-for="c in categories" :key="c._id" @click="browseCategory(c.slug)" class="flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden relative shadow-soft active:scale-95 transition">
          <img :src="c.imageUrl" :alt="c.name" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10"></div>
          <div class="absolute bottom-2 right-2.5 left-2.5 text-white text-sm font-semibold drop-shadow text-right">{{ c.name }}</div>
        </button>
      </div>
    </section>

    <section class="mt-8 px-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold">پیشنهادهای ویژه</h2>
        <button @click="router.push('/browse')" class="text-sm font-semibold text-teal-700">دیدن همه</button>
      </div>
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="ios-card h-56 animate-pulse"></div>
      </div>
      <div v-else class="space-y-4">
        <CouponCard v-for="c in featured" :key="c._id" :coupon="c" @click="go" />
      </div>
    </section>
  </div>
</template>
