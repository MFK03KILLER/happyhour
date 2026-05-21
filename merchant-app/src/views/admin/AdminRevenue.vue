<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import client from '../../api/client';
import { toman, persianNumber, methodLabel } from '../../composables/useFormat';

const range = ref('month');
const data = ref(null);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const { data: r } = await client.get('/admin/revenue', { params: { range: range.value } });
    data.value = r;
  } finally { loading.value = false; }
}

onMounted(load);
watch(range, load);

const trendMax = computed(() => {
  if (!data.value?.daily?.length) return 1;
  return Math.max(1, ...data.value.daily.map((d) => d.total));
});

const avgPerPayment = computed(() => {
  if (!data.value || !data.value.paymentsCount) return 0;
  return data.value.totalUSD / data.value.paymentsCount;
});

const methodPercentages = computed(() => {
  if (!data.value?.byMethod?.length) return [];
  const tot = data.value.byMethod.reduce((s, x) => s + x.total, 0) || 1;
  return data.value.byMethod.map((x) => ({ ...x, pct: (x.total / tot) * 100 }));
});

function kindLabel(k) { return { subscription: 'عضویت‌ها', coupon_purchase: 'خرید کوپن', other: 'سایر' }[k] || k || 'سایر'; }
function rangeLabel() { return { today: 'امروز', week: '۷ روز اخیر', month: '۳۰ روز اخیر', year: '۱۲ ماه اخیر' }[range.value]; }
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">درآمد</h1>
        <p class="text-ink-500 mt-1">آمار درآمد {{ rangeLabel() }}</p>
      </div>
      <div class="inline-flex bg-cream-200 rounded-full p-1">
        <button v-for="r in ['today','week','month','year']" :key="r" @click="range = r"
          class="px-4 py-1.5 rounded-full text-sm font-semibold transition"
          :class="range === r ? 'bg-white shadow-soft' : 'text-ink-500'">
          {{ {today:'امروز', week:'هفته', month:'ماه', year:'سال'}[r] }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-32 animate-pulse"></div>
    </div>

    <template v-else-if="data">
      <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="ios-card p-5 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div class="text-xs uppercase tracking-wider font-semibold opacity-80">درآمد کل</div>
          <div class="text-xl md:text-2xl font-bold mt-2">{{ toman(data.totalUSD) }}</div>
          <div class="text-xs opacity-80 mt-1">{{ persianNumber(data.paymentsCount) }} پرداخت</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">میانگین هر پرداخت</div>
          <div class="text-xl md:text-2xl font-bold mt-2">{{ toman(avgPerPayment) }}</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">پرداخت‌کنندگان فعال</div>
          <div class="text-2xl md:text-3xl font-bold mt-2">{{ persianNumber(data.topCustomers?.length || 0) }}+</div>
          <div class="text-xs text-ink-300 mt-1">در ۱۰ نفر برتر</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">درگاه برتر</div>
          <div class="text-lg md:text-xl font-bold mt-2">{{ data.byMethod[0] ? methodLabel(data.byMethod[0]._id) : '—' }}</div>
          <div class="text-xs text-ink-300 mt-1" v-if="data.byMethod[0]">{{ toman(data.byMethod[0].total) }}</div>
        </div>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">روند روزانه</div>
        </div>
        <div v-if="!data.daily?.length" class="text-sm text-ink-300 py-8 text-center">داده‌ای وجود ندارد.</div>
        <div v-else class="flex items-end gap-1.5 h-48">
          <div v-for="d in data.daily" :key="d._id"
            class="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-md relative group min-w-[8px]"
            :style="{ height: `${Math.max(2, (d.total / trendMax) * 100)}%` }">
            <div class="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap transition pointer-events-none z-10">
              <div class="font-bold">{{ toman(d.total) }}</div>
              <div dir="ltr">{{ d._id }} · {{ d.count }}</div>
            </div>
          </div>
        </div>
        <div v-if="data.daily?.length" class="flex justify-between mt-2 text-[10px] text-ink-300" dir="ltr">
          <span>{{ data.daily[0]._id }}</span>
          <span>{{ data.daily[data.daily.length-1]._id }}</span>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-2 gap-4">
        <div class="ios-card p-5">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">بر اساس درگاه پرداخت</div>
          <div v-if="!methodPercentages.length" class="text-sm text-ink-300">داده‌ای نیست.</div>
          <div v-else class="space-y-3">
            <div v-for="m in methodPercentages" :key="m._id">
              <div class="flex justify-between items-baseline mb-1">
                <div class="font-semibold text-sm">{{ methodLabel(m._id) }}</div>
                <div class="text-sm"><span class="font-bold">{{ toman(m.total) }}</span> <span class="text-ink-300">· {{ persianNumber(m.count) }}</span></div>
              </div>
              <div class="h-2 bg-cream-200 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-l from-teal-500 to-teal-700" :style="{ width: m.pct + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="ios-card p-5">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">بر اساس نوع</div>
          <div v-if="!data.byKind?.length" class="text-sm text-ink-300">داده‌ای نیست.</div>
          <div v-else class="space-y-3">
            <div v-for="k in data.byKind" :key="k._id" class="flex justify-between items-center p-3 rounded-2xl bg-cream-100">
              <div>
                <div class="font-semibold">{{ kindLabel(k._id) }}</div>
                <div class="text-xs text-ink-500">{{ persianNumber(k.count) }} پرداخت</div>
              </div>
              <div class="font-bold text-teal-700">{{ toman(k.total) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">مشتریان برتر</div>
        <div v-if="!data.topCustomers?.length" class="text-sm text-ink-300">داده‌ای نیست.</div>
        <div v-else class="space-y-2">
          <div v-for="(t, idx) in data.topCustomers" :key="idx" class="flex items-center gap-3 p-2 rounded-xl hover:bg-cream-100">
            <div class="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-bold">{{ persianNumber(idx + 1) }}</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ t.customer.fullName }}</div>
              <div class="text-xs text-ink-500 truncate" dir="ltr">{{ t.customer.phone || t.customer.email }} · {{ persianNumber(t.count) }} پرداخت</div>
            </div>
            <div class="font-bold text-teal-700 flex-shrink-0">{{ toman(t.total) }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
