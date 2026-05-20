<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import CouponCard from '../components/CouponCard.vue';

const router = useRouter();
const auth = useAuthStore();
const featured = ref([]);
const categories = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [c, cats] = await Promise.all([
      client.get('/customer/coupons/browse?limit=8'),
      client.get('/public/categories'),
    ]);
    featured.value = c.data.items;
    categories.value = cats.data.items;
  } finally {
    loading.value = false;
  }
});

function go(c) { router.push(`/coupons/${c._id}`); }
function browseCategory(slug) { router.push(`/browse?category=${slug}`); }
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6 flex items-center justify-between">
      <div>
        <div class="text-xs text-ink-500 font-medium">{{ new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) }}</div>
        <div class="text-2xl font-bold mt-0.5">Hi, {{ (auth.user && auth.user.fullName) ? auth.user.fullName.split(' ')[0] : 'there' }} 👋</div>
      </div>
      <button @click="$router.push('/profile')" class="w-11 h-11 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-bold shadow-soft active:scale-95">
        {{ (auth.user && auth.user.fullName) ? auth.user.fullName.charAt(0) : 'V' }}
      </button>
    </header>

    <section class="mx-5 mt-6">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white shadow-lift">
        <div class="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10"></div>
        <div class="absolute right-12 bottom-2 w-32 h-32 rounded-full bg-coral-500/20"></div>
        <div class="relative p-6">
          <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">Save up to</div>
          <div class="text-4xl font-bold mt-1">50% off</div>
          <div class="mt-1 text-cream-50/90">At your favorite places across the Bay.</div>
          <button @click="$router.push('/browse')" class="mt-5 bg-white text-teal-700 font-semibold rounded-full px-5 py-2.5 text-sm active:scale-95 transition">
            Explore offers →
          </button>
        </div>
      </div>
    </section>

    <section class="mt-8">
      <div class="flex items-center justify-between px-5 mb-3">
        <h2 class="text-lg font-bold">Categories</h2>
      </div>
      <div class="flex gap-3 px-5 overflow-x-auto scroll-no-bar pb-1">
        <button
          v-for="c in categories"
          :key="c._id"
          @click="browseCategory(c.slug)"
          class="flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden relative shadow-soft active:scale-95 transition"
        >
          <img :src="c.imageUrl" :alt="c.name" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10"></div>
          <div class="absolute bottom-2 left-2.5 right-2.5 text-white text-sm font-semibold drop-shadow text-left">{{ c.name }}</div>
        </button>
      </div>
    </section>

    <section class="mt-8 px-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold">Featured offers</h2>
        <button @click="$router.push('/browse')" class="text-sm font-semibold text-teal-700">See all</button>
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
