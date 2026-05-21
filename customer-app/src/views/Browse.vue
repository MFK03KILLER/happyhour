<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import CouponCard from '../components/CouponCard.vue';

const route = useRoute();
const router = useRouter();
const search = ref('');
const category = ref(route.query.category || '');
const items = ref([]);
const loading = ref(false);
const categories = ref([]);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/customer/coupons/browse', {
      params: { search: search.value || undefined, category: category.value || undefined, limit: 30 },
    });
    items.value = data.items;
  } finally { loading.value = false; }
}

onMounted(async () => {
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
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">تخفیف‌ها</h1>
      <div class="mt-4 relative">
        <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-3.5-3.5"/></svg>
        <input v-model="search" @keyup.enter="load" class="input pr-11" placeholder="جستجوی رستوران، کافه، تخفیف..." />
      </div>
    </header>

    <div class="mt-4 flex gap-2 px-5 overflow-x-auto scroll-no-bar">
      <button @click="setCat('')" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition" :class="!category ? 'bg-ink-900 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">همه</button>
      <button v-for="c in categories" :key="c._id" @click="setCat(c.slug)" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition" :class="category===c.slug ? 'bg-ink-900 text-white' : 'bg-white border border-ink-300/30 text-ink-700'">
        {{ c.name }}
      </button>
    </div>

    <section class="mt-6 px-5 space-y-4">
      <div v-if="loading">
        <div class="ios-card h-56 animate-pulse mb-4" v-for="i in 3" :key="i"></div>
      </div>
      <div v-else-if="items.length === 0" class="text-center py-12 text-ink-500">
        <div class="text-4xl mb-2">🔍</div>
        <div>نتیجه‌ای پیدا نشد — جستجوی دیگری امتحان کنید.</div>
      </div>
      <CouponCard v-for="c in items" :key="c._id" :coupon="c" @click="(c) => router.push(`/coupons/${c._id}`)" />
    </section>
  </div>
</template>
