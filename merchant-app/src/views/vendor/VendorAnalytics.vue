<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import client from '../../api/client';

const router = useRouter();
const range = ref('30d');
const data = ref(null);
const suggestions = ref([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const [a, s] = await Promise.all([
      client.get('/vendor/analytics', { params: { range: range.value } }),
      client.get('/vendor/suggestions').catch(() => ({ data: { items: [] } })),
    ]);
    data.value = a.data;
    suggestions.value = s.data.items;
  } finally { loading.value = false; }
}

onMounted(load);
watch(range, load);

const hourlyMax = computed(() => Math.max(1, ...(data.value?.hourly || []).map((h) => h.count)));
const weekdayMax = computed(() => Math.max(1, ...(data.value?.weekday || []).map((d) => d.count)));
const trendMax = computed(() => Math.max(1, ...(data.value?.dailyTrend || []).map((d) => d.count)));

function fmtHour(h) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${ampm}`;
}
function weekdayName(d) { return { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' }[d] || d; }
function severityClasses(s) {
  return {
    critical: 'border-coral-300 bg-coral-50 text-coral-700',
    warn: 'border-amber-300 bg-amber-50 text-amber-700',
    info: 'border-teal-300 bg-teal-50 text-teal-700',
    success: 'border-green-300 bg-green-50 text-green-700',
    opportunity: 'border-purple-300 bg-purple-50 text-purple-700',
  }[s] || 'border-ink-300/30 bg-cream-100 text-ink-700';
}
function iconBg(s) {
  return {
    critical: 'bg-coral-500',
    warn: 'bg-amber-500',
    info: 'bg-teal-600',
    success: 'bg-green-600',
    opportunity: 'bg-purple-600',
  }[s] || 'bg-ink-700';
}
function fmtMoney(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0); }
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
        <p class="text-ink-500 mt-1">Performance insights & recommendations</p>
      </div>
      <div class="inline-flex bg-cream-200 rounded-full p-1">
        <button v-for="r in [{k:'7d',l:'7d'},{k:'30d',l:'30d'},{k:'90d',l:'90d'}]" :key="r.k" @click="range = r.k"
          class="px-4 py-1.5 rounded-full text-sm font-semibold transition"
          :class="range === r.k ? 'bg-white shadow-soft' : 'text-ink-500'">{{ r.l }}</button>
      </div>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-28 animate-pulse"></div>
    </div>

    <template v-else-if="data">
      <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="ios-card p-5 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div class="text-xs uppercase tracking-wider font-semibold opacity-80">Redemptions</div>
          <div class="text-3xl font-bold mt-2">{{ data.totalRedemptions }}</div>
          <div class="text-xs opacity-80 mt-1">Avg {{ data.avgPerDay }} / day</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Value delivered</div>
          <div class="text-3xl font-bold mt-2">{{ fmtMoney(data.totalSavings) }}</div>
          <div class="text-xs text-ink-300 mt-1">Customer savings</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Unique customers</div>
          <div class="text-3xl font-bold mt-2">{{ data.uniqueCustomers }}</div>
          <div class="text-xs text-ink-300 mt-1">{{ data.repeatCustomers }} returning ({{ data.repeatRate }}%)</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Active coupons</div>
          <div class="text-3xl font-bold mt-2">{{ data.activeCoupons }}</div>
          <div class="text-xs text-ink-300 mt-1">Live offers</div>
        </div>
      </div>

      <div v-if="suggestions.length" class="mt-6">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3 flex items-center gap-2">
          <i class="fa-solid fa-wand-magic-sparkles text-teal-600"></i>
          Recommendations
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="(s, i) in suggestions" :key="i" class="ios-card p-4 border-2" :class="severityClasses(s.severity)">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0" :class="iconBg(s.severity)">
                <i class="fa-solid" :class="s.icon"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-sm">{{ s.title }}</div>
                <div class="text-xs mt-1 leading-relaxed text-ink-700">{{ s.body }}</div>
                <button v-if="s.action" @click="router.push(s.action.to)" class="text-xs font-bold mt-2 underline underline-offset-2">
                  {{ s.action.label }} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="ios-card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Daily trend</div>
          </div>
          <div v-if="!data.dailyTrend.length" class="text-sm text-ink-300 py-8 text-center">No data yet.</div>
          <div v-else class="flex items-end gap-1 h-32">
            <div v-for="d in data.dailyTrend" :key="d._id"
              class="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t group relative min-w-[6px]"
              :style="{ height: `${Math.max(3, (d.count / trendMax) * 100)}%` }">
              <div class="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap transition pointer-events-none z-10">
                <div class="font-bold">{{ d.count }} scans</div>
                <div>{{ d._id }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ios-card p-5">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">Busiest hours</div>
          <div class="flex items-end gap-1 h-32">
            <div v-for="h in data.hourly" :key="h.hour" class="flex-1 group relative">
              <div class="bg-gradient-to-t from-coral-500 to-coral-400 rounded-t transition-all min-w-[4px]"
                :style="{ height: `${Math.max(3, (h.count / hourlyMax) * 100)}%` }"></div>
              <div class="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                <span class="font-bold">{{ fmtHour(h.hour) }}</span> · {{ h.count }}
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-[10px] text-ink-300">
            <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span><span>11PM</span>
          </div>
        </div>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">Weekday distribution</div>
        <div class="flex items-end gap-3 h-32">
          <div v-for="d in data.weekday" :key="d.day" class="flex-1 flex flex-col items-center gap-2">
            <div class="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all"
              :style="{ height: `${Math.max(3, (d.count / weekdayMax) * 100)}%` }"></div>
          </div>
        </div>
        <div class="flex justify-between mt-2 text-xs font-semibold text-ink-500">
          <div v-for="d in data.weekday" :key="d.day" class="flex-1 text-center">
            {{ weekdayName(d.day) }}
          </div>
        </div>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Top performing coupons</div>
          <router-link to="/vendor/coupons" class="text-xs font-semibold text-teal-700">Manage →</router-link>
        </div>
        <div v-if="!data.topCoupons.length" class="text-sm text-ink-300 py-6 text-center">No coupon redemptions yet.</div>
        <div v-else class="space-y-3">
          <div v-for="(t, idx) in data.topCoupons" :key="t._id" class="flex items-center gap-3 p-2 rounded-xl hover:bg-cream-100">
            <div class="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-sm font-bold">{{ idx + 1 }}</div>
            <img :src="t.coupon.heroImageUrl" class="w-12 h-12 rounded-xl object-cover bg-cream-200 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ t.coupon.title }}</div>
              <div class="text-xs text-ink-500 truncate">{{ t.coupon.subtitle }}</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-bold text-teal-700">{{ t.count }}</div>
              <div class="text-[10px] text-ink-300">redemptions</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="data.inventorySnapshot?.length" class="mt-6 ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">Inventory · Surprise Bags</div>
        <div class="space-y-2">
          <div v-for="c in data.inventorySnapshot" :key="c._id" class="flex items-center justify-between p-2 rounded-xl hover:bg-cream-100">
            <div class="font-semibold text-sm truncate">{{ c.title }}</div>
            <div class="flex items-center gap-2">
              <div class="w-32 h-2 bg-cream-200 rounded-full overflow-hidden">
                <div class="h-full" :class="(c.inventoryRemaining / c.inventoryCount) < 0.2 ? 'bg-coral-500' : 'bg-teal-500'"
                  :style="{ width: `${(c.inventoryRemaining / c.inventoryCount) * 100}%` }"></div>
              </div>
              <span class="text-xs font-bold w-12 text-right">{{ c.inventoryRemaining }}/{{ c.inventoryCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
