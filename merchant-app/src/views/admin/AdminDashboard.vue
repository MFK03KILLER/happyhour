<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { toman, persianNumber, logoFor } from '../../composables/useFormat';

const stats = ref(null);
const recentPayments = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([
      client.get('/admin/stats/overview'),
      client.get('/admin/payments?limit=5'),
    ]);
    stats.value = s.data;
    recentPayments.value = p.data.items;
  } finally { loading.value = false; }
});

function timeAgo(d) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'همین الان';
  if (m < 60) return `${persianNumber(m)} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${persianNumber(h)} ساعت پیش`;
  return `${persianNumber(Math.floor(h / 24))} روز پیش`;
}

function kindLabel(k) { return { subscription: 'عضویت', coupon_purchase: 'خرید کوپن', other: 'سایر' }[k] || k; }
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold">داشبورد</h1>
    <p class="text-ink-500 mt-1">نمای کلی پلتفرم</p>

    <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="ios-card h-28 animate-pulse"></div>
    </div>

    <template v-else-if="stats">
      <div class="mt-6">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3">درآمد</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="ios-card p-5 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
            <div class="text-xs uppercase tracking-wider font-semibold opacity-80">امروز</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ toman(stats.revenue?.today?.total) }}</div>
            <div class="text-xs opacity-80 mt-1">{{ persianNumber(stats.revenue?.today?.count || 0) }} پرداخت</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">این هفته</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ toman(stats.revenue?.week?.total) }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ persianNumber(stats.revenue?.week?.count || 0) }} پرداخت</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">این ماه</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ toman(stats.revenue?.month?.total) }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ persianNumber(stats.revenue?.month?.count || 0) }} پرداخت</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">کل دوران</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ toman(stats.revenue?.allTime?.total) }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ persianNumber(stats.revenue?.allTime?.count || 0) }} پرداخت</div>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3">فعالیت</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">امروز</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.todayRedemptions) }}</div>
            <div class="text-xs text-ink-300 mt-1">استفاده کوپن</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">کل</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.totalRedemptions) }}</div>
            <div class="text-xs text-ink-300 mt-1">استفاده کوپن</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">مشتریان</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.totalCustomers) }}</div>
            <div class="text-xs text-ink-300 mt-1">ثبت شده</div>
          </div>
          <div class="ios-card p-5">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">شعب</div>
            <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(stats.totalMerchants) }}</div>
            <div class="text-xs text-ink-300 mt-1">{{ persianNumber(stats.totalVendors) }} بیزنس</div>
          </div>
        </div>
      </div>

      <div class="mt-8 grid md:grid-cols-2 gap-4">
        <div v-if="stats.topMerchant" class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">بهترین شعبه</div>
          <div class="flex items-center gap-3 mt-3">
            <img :src="stats.topMerchant.merchant.logoUrl || logoFor(stats.topMerchant.merchant.name)" class="w-12 h-12 rounded-xl object-cover bg-cream-200" />
            <div>
              <div class="font-bold">{{ stats.topMerchant.merchant.name }}</div>
              <div class="text-sm text-ink-500">{{ persianNumber(stats.topMerchant.count) }} استفاده</div>
            </div>
          </div>
        </div>

        <div class="ios-card p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">پرداخت‌های اخیر</div>
            <router-link to="/admin/payments" class="text-sm font-semibold text-teal-700">دیدن همه ←</router-link>
          </div>
          <div v-if="!recentPayments.length" class="text-sm text-ink-300">هنوز پرداختی ثبت نشده.</div>
          <div v-else class="space-y-3">
            <div v-for="p in recentPayments" :key="p._id" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
                {{ (p.customerId?.fullName || '?').charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">{{ p.customerId?.fullName }}</div>
                <div class="text-xs text-ink-500 truncate">{{ kindLabel(p.context?.kind) }} · {{ p.context?.label }}</div>
              </div>
              <div class="text-left flex-shrink-0">
                <div class="font-bold text-teal-700 text-sm">{{ toman(p.amountUSD) }}</div>
                <div class="text-[10px] text-ink-300">{{ timeAgo(p.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
