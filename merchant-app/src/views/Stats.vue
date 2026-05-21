<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../api/client';
import { toman, persianNumber } from '../composables/useFormat';

const stats = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/merchant/stats');
    stats.value = data;
  } finally { loading.value = false; }
});

const trendMax = computed(() => {
  if (!stats.value || !stats.value.dailyTrend) return 1;
  return Math.max(1, ...stats.value.dailyTrend.map((d) => d.count));
});
</script>

<template>
  <div class="min-h-screen bg-cream-100 pb-28">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white safe-top px-5 pb-8 rounded-b-3xl">
      <div class="pt-2">
        <div class="text-xs opacity-80 font-semibold uppercase tracking-wider">عملکرد شعبه</div>
        <h1 class="text-2xl font-bold mt-0.5">آمار</h1>
      </div>
    </header>

    <div v-if="loading" class="px-5 -mt-6 space-y-4">
      <div class="ios-card h-28 animate-pulse"></div>
      <div class="ios-card h-48 animate-pulse"></div>
    </div>
    <div v-else-if="stats" class="px-5 -mt-6 space-y-5">
      <div class="grid grid-cols-3 gap-3">
        <div class="ios-card p-4 text-center">
          <div class="text-[11px] uppercase font-semibold text-ink-500 tracking-wider">امروز</div>
          <div class="text-2xl font-bold mt-1">{{ persianNumber(stats.today) }}</div>
        </div>
        <div class="ios-card p-4 text-center">
          <div class="text-[11px] uppercase font-semibold text-ink-500 tracking-wider">هفته</div>
          <div class="text-2xl font-bold mt-1">{{ persianNumber(stats.week) }}</div>
        </div>
        <div class="ios-card p-4 text-center">
          <div class="text-[11px] uppercase font-semibold text-ink-500 tracking-wider">ماه</div>
          <div class="text-2xl font-bold mt-1">{{ persianNumber(stats.month) }}</div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">روند روزانه</div>
          <div class="text-xs text-ink-300">{{ persianNumber(stats.uniqueCustomers) }} مشتری منحصربه‌فرد</div>
        </div>
        <div class="mt-4 flex items-end gap-1.5 h-32">
          <div v-for="d in stats.dailyTrend" :key="d._id" class="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t" :style="{ height: `${(d.count / trendMax) * 100}%` }" :title="`${d._id}: ${d.count}`"></div>
          <div v-if="!stats.dailyTrend.length" class="text-ink-300 text-sm">داده‌ای وجود ندارد.</div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">پیشنهادهای پرطرفدار</div>
        <div v-if="!stats.topCoupons.length" class="text-ink-300 text-sm mt-2">هنوز استفاده‌ای ثبت نشده.</div>
        <div v-else class="mt-3 space-y-3">
          <div v-for="t in stats.topCoupons" :key="t._id" class="flex items-center gap-3">
            <img :src="t.coupon?.heroImageUrl" class="w-12 h-12 rounded-xl object-cover bg-cream-200" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ t.coupon?.title }}</div>
              <div class="text-xs text-ink-500">{{ persianNumber(t.count) }} استفاده · {{ toman(t.savings || 0) }} صرفه‌جویی</div>
            </div>
          </div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">تاثیر مالی (تخمینی)</div>
        <div class="text-2xl font-bold mt-1 text-teal-700">{{ toman(stats.revenueImpact || 0) }}</div>
        <p class="text-xs text-ink-500 mt-1">مجموع صرفه‌جویی مشتریان از کوپن‌های استفاده شده در این شعبه.</p>
      </div>
    </div>
  </div>
</template>
