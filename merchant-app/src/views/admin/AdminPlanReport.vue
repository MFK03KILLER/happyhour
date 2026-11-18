<script setup>
// Redemptions per restaurant by member plan - the basis for paying restaurants
// back. Month = Pacific-time calendar month; each scan records the plan the
// member was on at that moment.
import { computed, onMounted, ref, watch } from 'vue';
import client from '../../api/client';
import { planStyle } from '../../lib/plans';

function ym(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
const month = ref(ym(new Date()));
const data = ref(null);
const loading = ref(true);
const error = ref('');
const TIERS = ['basic', 'gold', 'premium'];

const months = computed(() => {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 12; i++) {
    out.push({ value: ym(d), label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) });
    d.setMonth(d.getMonth() - 1);
  }
  return out;
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    data.value = (await client.get('/admin/reports/redemptions-by-plan', { params: { month: month.value } })).data;
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not load the report.';
  } finally { loading.value = false; }
}
watch(month, load);
onMounted(load);

const count = (v, t) => v.tiers?.[t]?.count || 0;

async function downloadCsv() {
  const res = await client.get('/admin/reports/redemptions.csv', { params: { month: month.value }, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `redemptions-${month.value}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
</script>

<template>
  <div class="p-5 md:p-8 max-w-5xl">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Plan payouts</h1>
    <p class="text-ink-500 mt-1">Redemptions at each restaurant, split by the plan the member was on when staff scanned the code.</p>

    <div class="mt-5 flex flex-wrap items-center gap-2">
      <select v-model="month" class="input w-auto">
        <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
      <button class="ios-card px-4 py-2.5 text-sm font-semibold text-teal-700" @click="downloadCsv"><i class="fa-solid fa-file-csv mr-1.5"></i>Download CSV</button>
    </div>

    <div v-if="loading" class="mt-6 ios-card h-40 animate-pulse"></div>
    <div v-else-if="error" class="mt-6 ios-card p-5 text-coral-600">{{ error }}</div>
    <template v-else-if="data">
      <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="ios-card p-4 text-center">
          <div class="text-[11px] uppercase font-semibold text-ink-500 tracking-wider">All redemptions</div>
          <div class="text-2xl font-bold mt-1">{{ data.totals.total }}</div>
        </div>
        <div v-for="t in TIERS" :key="t" class="rounded-3xl border p-4 text-center" :class="planStyle(t).cls">
          <div class="text-[11px] uppercase font-bold tracking-wider">{{ planStyle(t).label }}</div>
          <div class="text-2xl font-bold mt-1">{{ data.totals.tiers[t] || 0 }}</div>
        </div>
      </div>

      <div v-if="!data.vendors.length" class="mt-6 ios-card p-6 text-center text-ink-500">No redemptions this month.</div>
      <div v-else class="mt-6 ios-card overflow-x-auto">
        <table class="w-full text-sm min-w-[560px]">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wider text-ink-500 border-b border-cream-200">
              <th class="p-4">Restaurant</th>
              <th v-for="t in TIERS" :key="t" class="p-4 text-right">{{ planStyle(t).label }}</th>
              <th class="p-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cream-200">
            <tr v-for="v in data.vendors" :key="String(v.vendorId)">
              <td class="p-4 font-semibold">{{ v.name }}<div v-if="count(v, 'unknown')" class="text-xs text-ink-300 font-normal">{{ count(v, 'unknown') }} from before plans were recorded</div></td>
              <td v-for="t in TIERS" :key="t" class="p-4 text-right tabular-nums">{{ count(v, t) }}</td>
              <td class="p-4 text-right font-bold tabular-nums">{{ v.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-ink-500">The CSV has every scan: time, restaurant, location, offer, the member's plan and plan price.</p>
    </template>
  </div>
</template>
