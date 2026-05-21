<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import client from '../../api/client';

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

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); }
function methodLabel(m) {
  return { apple_pay: 'Apple Pay', google_pay: 'Google Pay', card: 'Card', paypal: 'PayPal' }[m] || m;
}
function kindLabel(k) {
  return { subscription: 'Subscriptions', coupon_purchase: 'Coupon purchases', other: 'Other' }[k] || k;
}

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

function rangeLabel() {
  return { today: 'today', week: 'last 7 days', month: 'last 30 days', year: 'last 12 months' }[range.value];
}
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Revenue</h1>
        <p class="text-ink-500 mt-1">Earnings across {{ rangeLabel() }}</p>
      </div>
      <div class="inline-flex bg-cream-200 rounded-full p-1">
        <button v-for="r in ['today','week','month','year']" :key="r" @click="range = r"
          class="px-4 py-1.5 rounded-full text-sm font-semibold transition capitalize"
          :class="range === r ? 'bg-white shadow-soft' : 'text-ink-500'">{{ r }}</button>
      </div>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-32 animate-pulse"></div>
    </div>

    <template v-else-if="data">
      <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="ios-card p-5 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div class="text-xs uppercase tracking-wider font-semibold opacity-80">Total revenue</div>
          <div class="text-3xl font-bold mt-2">{{ fmt(data.totalUSD) }}</div>
          <div class="text-xs opacity-80 mt-1">{{ data.paymentsCount }} payments</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Avg per payment</div>
          <div class="text-3xl font-bold mt-2">{{ fmt(avgPerPayment) }}</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Unique payers</div>
          <div class="text-3xl font-bold mt-2">{{ data.topCustomers?.length || 0 }}+</div>
          <div class="text-xs text-ink-300 mt-1">In top 10</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Top method</div>
          <div class="text-xl font-bold mt-2">{{ data.byMethod[0] ? methodLabel(data.byMethod[0]._id) : '—' }}</div>
          <div class="text-xs text-ink-300 mt-1" v-if="data.byMethod[0]">{{ fmt(data.byMethod[0].total) }}</div>
        </div>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Daily trend</div>
        </div>
        <div v-if="!data.daily?.length" class="text-sm text-ink-300 py-8 text-center">No data yet.</div>
        <div v-else class="flex items-end gap-1.5 h-48">
          <div
            v-for="d in data.daily"
            :key="d._id"
            class="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-md relative group min-w-[8px]"
            :style="{ height: `${Math.max(2, (d.total / trendMax) * 100)}%` }"
          >
            <div class="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap transition pointer-events-none z-10">
              <div class="font-bold">{{ fmt(d.total) }}</div>
              <div>{{ d._id }} · {{ d.count }}</div>
            </div>
          </div>
        </div>
        <div v-if="data.daily?.length" class="flex justify-between mt-2 text-[10px] text-ink-300">
          <span>{{ data.daily[0]._id }}</span>
          <span>{{ data.daily[data.daily.length-1]._id }}</span>
        </div>
      </div>

      <div class="mt-6 grid md:grid-cols-2 gap-4">
        <div class="ios-card p-5">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">By payment method</div>
          <div v-if="!methodPercentages.length" class="text-sm text-ink-300">No payments.</div>
          <div v-else class="space-y-3">
            <div v-for="m in methodPercentages" :key="m._id">
              <div class="flex justify-between items-baseline mb-1">
                <div class="font-semibold text-sm">{{ methodLabel(m._id) }}</div>
                <div class="text-sm"><span class="font-bold">{{ fmt(m.total) }}</span> <span class="text-ink-300">· {{ m.count }}</span></div>
              </div>
              <div class="h-2 bg-cream-200 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-teal-500 to-teal-700" :style="{ width: m.pct + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="ios-card p-5">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">By source</div>
          <div v-if="!data.byKind?.length" class="text-sm text-ink-300">No payments.</div>
          <div v-else class="space-y-3">
            <div v-for="k in data.byKind" :key="k._id" class="flex justify-between items-center p-3 rounded-2xl bg-cream-100">
              <div>
                <div class="font-semibold">{{ kindLabel(k._id) }}</div>
                <div class="text-xs text-ink-500">{{ k.count }} payments</div>
              </div>
              <div class="font-bold text-teal-700">{{ fmt(k.total) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">Top customers</div>
        <div v-if="!data.topCustomers?.length" class="text-sm text-ink-300">No payments.</div>
        <div v-else class="space-y-2">
          <div v-for="(t, idx) in data.topCustomers" :key="idx" class="flex items-center gap-3 p-2 rounded-xl hover:bg-cream-100">
            <div class="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-bold">
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ t.customer.fullName }}</div>
              <div class="text-xs text-ink-500 truncate">{{ t.customer.email }} · {{ t.count }} payments</div>
            </div>
            <div class="font-bold text-teal-700 flex-shrink-0">{{ fmt(t.total) }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
