<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';
import { useFlagsStore } from '../../stores/flags';

const flags = useFlagsStore();
const items = ref([]);
const stats = ref({});
const total = ref(0);
const loading = ref(true);
const filterStatus = ref('');
const page = ref(1);
const limit = 30;

// Settings
const settings = ref(null);
const savingSettings = ref(false);
const settingsSaved = ref(false);

// Flag
const flagOn = ref(false);
const toggling = ref(false);

const STATUS_META = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Confirmed', color: 'bg-teal-50 text-teal-700' },
  preparing: { label: 'Preparing', color: 'bg-teal-50 text-teal-700' },
  out_for_delivery: { label: 'On the way', color: 'bg-purple-50 text-purple-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-cream-200 text-ink-500' },
};
const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const pages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

async function load() {
  loading.value = true;
  try {
    const [d, s, f] = await Promise.all([
      client.get('/admin/deliveries', { params: { status: filterStatus.value || undefined, page: page.value, limit } }),
      settings.value ? Promise.resolve(null) : client.get('/admin/delivery-settings'),
      client.get('/admin/features'),
    ]);
    items.value = d.data.items || [];
    total.value = d.data.total || 0;
    stats.value = d.data.stats?.byStatus || {};
    if (s) settings.value = s.data;
    const flag = (f.data.items || []).find((x) => x.key === 'delivery');
    flagOn.value = !!flag?.enabled;
  } finally { loading.value = false; }
}

async function toggleFlag() {
  if (!confirm(flagOn.value
    ? 'Turn delivery OFF? Customers will see "Coming soon" again.'
    : 'Launch delivery? Customers will immediately be able to order delivery.')) return;
  toggling.value = true;
  try {
    await client.patch('/admin/features/delivery', { enabled: !flagOn.value });
    flagOn.value = !flagOn.value;
    flags.reload();
  } finally { toggling.value = false; }
}

async function saveSettings() {
  savingSettings.value = true;
  settingsSaved.value = false;
  try {
    const { data } = await client.put('/admin/delivery-settings', settings.value);
    settings.value = data;
    settingsSaved.value = true;
    setTimeout(() => { settingsSaved.value = false; }, 2500);
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Could not save settings');
  } finally { savingSettings.value = false; }
}

async function setStatus(d, status) {
  let cancelReason;
  if (status === 'cancelled') {
    cancelReason = prompt('Cancel reason (shown to customer):', 'Cancelled by support');
    if (cancelReason == null) return;
  }
  try {
    await client.post(`/admin/deliveries/${d._id}/status`, { status, cancelReason });
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Update failed');
  }
}

function changeFilter() { page.value = 1; load(); }

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Deliveries</h1>
        <p class="text-ink-500 mt-1">Orders, courier flow, fees & the launch switch.</p>
      </div>
    </div>

    <!-- Launch switch -->
    <div class="mt-4 ios-card p-5 flex items-center gap-4" :class="flagOn ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0" :class="flagOn ? 'bg-green-600' : 'bg-amber-500'">
        <i class="fa-solid fa-truck-fast text-xl"></i>
      </div>
      <div class="flex-1">
        <div class="font-bold">{{ flagOn ? 'Delivery is LIVE' : 'Delivery is in "Coming soon" mode' }}</div>
        <p class="text-sm text-ink-700 mt-0.5">
          {{ flagOn
            ? 'Customers can order delivery and merchants see incoming orders.'
            : 'Everything is built & ready. Customers see a "Coming soon" teaser until you launch.' }}
        </p>
      </div>
      <button @click="toggleFlag" :disabled="toggling" class="flex-shrink-0 font-bold rounded-full px-5 py-2.5 text-sm text-white active:scale-95 transition"
        :class="flagOn ? 'bg-coral-500' : 'bg-green-600'">
        {{ toggling ? '…' : (flagOn ? 'Turn off' : '🚀 Launch') }}
      </button>
    </div>

    <!-- Stats -->
    <div class="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
      <div v-for="s in ALL_STATUSES" :key="s" class="ios-card p-3 text-center">
        <div class="text-lg font-bold">{{ stats[s]?.count || 0 }}</div>
        <div class="text-[10px] uppercase tracking-wider text-ink-500">{{ STATUS_META[s].label }}</div>
      </div>
    </div>

    <!-- Settings -->
    <div v-if="settings" class="mt-4 ios-card p-5">
      <div class="flex items-center justify-between">
        <div class="font-bold"><i class="fa-solid fa-sliders mr-2 text-teal-700"></i>Delivery settings</div>
        <span v-if="settingsSaved" class="chip bg-green-100 text-green-700 text-[10px]">Saved ✓</span>
      </div>
      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label class="text-xs text-ink-500">Base fee ($)</label>
          <input v-model.number="settings.baseFeeUSD" type="number" min="0" step="0.01" class="input" />
        </div>
        <div>
          <label class="text-xs text-ink-500">Per km ($)</label>
          <input v-model.number="settings.perKmUSD" type="number" min="0" step="0.01" class="input" />
        </div>
        <div>
          <label class="text-xs text-ink-500">Free over ($, 0 = never)</label>
          <input v-model.number="settings.freeOverUSD" type="number" min="0" step="0.01" class="input" />
        </div>
        <div>
          <label class="text-xs text-ink-500">Min order ($)</label>
          <input v-model.number="settings.minOrderUSD" type="number" min="0" step="0.01" class="input" />
        </div>
        <div>
          <label class="text-xs text-ink-500">Max radius (km)</label>
          <input v-model.number="settings.maxRadiusKm" type="number" min="0" step="0.5" class="input" />
        </div>
        <div>
          <label class="text-xs text-ink-500">Prep time (min)</label>
          <input v-model.number="settings.prepMinutes" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="text-xs text-ink-500">Minutes per km</label>
          <input v-model.number="settings.minutesPerKm" type="number" min="0" class="input" />
        </div>
        <div class="flex items-end">
          <button @click="saveSettings" :disabled="savingSettings" class="ios-button-primary w-full">{{ savingSettings ? 'Saving…' : 'Save settings' }}</button>
        </div>
      </div>
    </div>

    <!-- Orders -->
    <div class="mt-6 flex items-center justify-between flex-wrap gap-2">
      <h2 class="font-bold text-lg">Orders <span class="text-ink-300 font-normal">({{ total }})</span></h2>
      <select v-model="filterStatus" @change="changeFilter" class="input md:max-w-[180px]">
        <option value="">All statuses</option>
        <option v-for="s in ALL_STATUSES" :key="s" :value="s">{{ STATUS_META[s].label }}</option>
      </select>
    </div>

    <div v-if="loading" class="mt-4 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-10 text-center text-ink-500">
      <i class="fa-solid fa-truck-fast text-4xl text-ink-300"></i>
      <div class="mt-3">No delivery orders{{ filterStatus ? ' with this status' : ' yet' }}.</div>
    </div>
    <div v-else class="mt-4 ios-card divide-y divide-cream-200">
      <div v-for="d in items" :key="d._id" class="p-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="chip text-[10px]" :class="STATUS_META[d.status]?.color">{{ STATUS_META[d.status]?.label }}</span>
          <span class="font-mono text-xs text-ink-500">{{ d.trackingCode }}</span>
          <span class="text-xs text-ink-300">{{ new Date(d.createdAt).toLocaleString() }}</span>
          <span class="ml-auto font-bold">${{ (d.totalUSD || 0).toFixed(2) }}</span>
        </div>
        <div class="mt-1.5 text-sm">
          <span class="font-semibold">{{ d.itemLabel }}</span>
          <span class="text-ink-500"> · {{ d.merchantId?.name }} → {{ d.customerId?.fullName }}</span>
        </div>
        <div class="text-xs text-ink-500 mt-0.5">{{ d.address?.street }}{{ d.address?.city ? `, ${d.address.city}` : '' }}<span v-if="d.courier?.name"> · courier: {{ d.courier.name }}</span></div>
        <div class="mt-2 flex gap-1.5 flex-wrap">
          <button v-for="s in ALL_STATUSES.filter((x) => x !== d.status)" :key="s" @click="setStatus(d, s)"
            class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cream-100 text-ink-700 hover:bg-cream-200 active:scale-95">
            → {{ STATUS_META[s].label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="pages > 1" class="mt-4 flex items-center justify-center gap-3">
      <button @click="page > 1 && (page--, load())" :disabled="page <= 1" class="ios-card px-4 py-2 text-sm font-semibold disabled:opacity-40">← Prev</button>
      <span class="text-sm text-ink-500">{{ page }} / {{ pages }}</span>
      <button @click="page < pages && (page++, load())" :disabled="page >= pages" class="ios-card px-4 py-2 text-sm font-semibold disabled:opacity-40">Next →</button>
    </div>
  </div>
</template>
