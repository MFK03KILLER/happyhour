<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import client from '../api/client';
import { useFlagsStore } from '../stores/flags';

const flags = useFlagsStore();
const items = ref([]);
const loading = ref(true);
const error = ref('');
const busy = ref(null); // order id currently being updated
let poll = null;

// Courier prompt state (for out_for_delivery)
const courierFor = ref(null);
const courierName = ref('');
const courierPhone = ref('');

const STATUS_META = {
  pending: { label: 'New', color: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Confirmed', color: 'bg-teal-50 text-teal-700' },
  preparing: { label: 'Preparing', color: 'bg-teal-50 text-teal-700' },
  out_for_delivery: { label: 'On the way', color: 'bg-purple-50 text-purple-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-cream-200 text-ink-500' },
};

// Next action per status
const NEXT = {
  pending: { status: 'confirmed', label: 'Confirm', icon: 'fa-circle-check' },
  confirmed: { status: 'preparing', label: 'Start preparing', icon: 'fa-fire-burner' },
  preparing: { status: 'out_for_delivery', label: 'Out for delivery', icon: 'fa-motorcycle' },
  out_for_delivery: { status: 'delivered', label: 'Mark delivered', icon: 'fa-box-open' },
};

const active = computed(() => items.value.filter((d) => !['delivered', 'cancelled'].includes(d.status)));
const done = computed(() => items.value.filter((d) => ['delivered', 'cancelled'].includes(d.status)).slice(0, 20));

async function load() {
  try {
    const { data } = await client.get('/merchant/deliveries');
    items.value = data.items || [];
    error.value = '';
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not load deliveries';
  } finally { loading.value = false; }
}

async function advance(d) {
  const next = NEXT[d.status];
  if (!next) return;
  // Going out for delivery → ask for courier info first.
  if (next.status === 'out_for_delivery' && courierFor.value !== d._id) {
    courierFor.value = d._id;
    courierName.value = d.courier?.name || '';
    courierPhone.value = d.courier?.phone || '';
    return;
  }
  busy.value = d._id;
  try {
    const payload = { status: next.status };
    if (next.status === 'out_for_delivery') {
      payload.courierName = courierName.value;
      payload.courierPhone = courierPhone.value;
    }
    await client.post(`/merchant/deliveries/${d._id}/status`, payload);
    courierFor.value = null;
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Update failed');
  } finally { busy.value = null; }
}

async function cancel(d) {
  const reason = prompt('Reason for cancelling (shown to the customer):', 'Out of stock');
  if (reason == null) return;
  busy.value = d._id;
  try {
    await client.post(`/merchant/deliveries/${d._id}/status`, { status: 'cancelled', cancelReason: reason });
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Cancel failed');
  } finally { busy.value = null; }
}

function ago(d) {
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ${min % 60}m ago`;
}

onMounted(async () => {
  await flags.load();
  if (flags.isOn('delivery')) await load();
  else loading.value = false;
  poll = setInterval(() => { if (flags.isOn('delivery')) load(); }, 20000);
});
onUnmounted(() => { if (poll) clearInterval(poll); });
</script>

<template>
  <div class="min-h-screen pb-28 safe-top bg-cream-100">
    <header class="px-5 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">Deliveries</h1>
      <p class="text-ink-500 mt-1">Incoming delivery orders for your location.</p>
    </header>

    <!-- Flag off -->
    <div v-if="!flags.isOn('delivery')" class="px-5 mt-16 text-center">
      <div class="mx-auto w-20 h-20 rounded-3xl bg-cream-200 flex items-center justify-center">
        <i class="fa-solid fa-truck-fast text-3xl text-ink-300"></i>
      </div>
      <div class="mt-4 font-semibold">Delivery isn't live yet</div>
      <p class="text-ink-500 text-sm mt-1 max-w-xs mx-auto">The platform admin hasn't enabled delivery. Orders will appear here once it launches.</p>
    </div>

    <template v-else>
      <div v-if="loading" class="px-5 mt-6 space-y-3">
        <div v-for="i in 3" :key="i" class="ios-card h-32 animate-pulse"></div>
      </div>
      <div v-else-if="error" class="mx-5 mt-6 ios-card p-4 text-coral-600 text-sm">{{ error }}</div>
      <template v-else>
        <div v-if="active.length === 0" class="px-5 mt-12 text-center text-ink-500">
          <i class="fa-solid fa-mug-hot text-4xl text-ink-300"></i>
          <div class="mt-3 font-semibold">No active orders</div>
          <p class="text-sm mt-1">New delivery orders will pop up here automatically.</p>
        </div>

        <!-- Active orders -->
        <div v-else class="px-5 mt-4 space-y-3">
          <div v-for="d in active" :key="d._id" class="ios-card p-4">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="chip text-[10px]" :class="STATUS_META[d.status]?.color">{{ STATUS_META[d.status]?.label }}</span>
                <span class="font-mono text-xs text-ink-500">{{ d.trackingCode }}</span>
              </div>
              <span class="text-[10px] text-ink-300 flex-shrink-0">{{ ago(d.createdAt) }}</span>
            </div>
            <div class="mt-2 font-bold">{{ d.itemLabel }}</div>
            <div class="text-sm text-ink-700 mt-0.5">
              <i class="fa-solid fa-user text-[10px] text-ink-300 mr-1"></i>{{ d.customerId?.fullName }}
              <a v-if="d.address?.phone" :href="`tel:${d.address.phone}`" class="ml-2 text-teal-700 font-semibold text-xs"><i class="fa-solid fa-phone text-[9px]"></i> {{ d.address.phone }}</a>
            </div>
            <div class="text-sm text-ink-500 mt-1">
              <i class="fa-solid fa-location-dot text-[10px] text-ink-300 mr-1"></i>{{ d.address?.street }}{{ d.address?.city ? `, ${d.address.city}` : '' }}
              <span v-if="d.distanceKm != null" class="text-ink-300"> · {{ d.distanceKm.toFixed(1) }} km</span>
            </div>
            <div v-if="d.address?.notes || d.customerNotes" class="mt-1.5 text-xs text-amber-800 bg-amber-50 rounded-xl px-2.5 py-1.5">
              <i class="fa-solid fa-circle-info text-[10px] mr-1"></i>{{ [d.address?.notes, d.customerNotes].filter(Boolean).join(' · ') }}
            </div>
            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-ink-500">Total <span class="font-bold text-ink-900">${{ (d.totalUSD || 0).toFixed(2) }}</span></span>
              <span class="text-ink-500">Fee <span class="font-bold" :class="d.deliveryFeeUSD > 0 ? 'text-ink-900' : 'text-green-700'">{{ d.deliveryFeeUSD > 0 ? `$${d.deliveryFeeUSD.toFixed(2)}` : 'Free' }}</span></span>
            </div>

            <!-- Courier inline prompt -->
            <div v-if="courierFor === d._id" class="mt-3 space-y-2 bg-cream-100 rounded-2xl p-3">
              <div class="text-xs font-semibold text-ink-500 uppercase">Courier details</div>
              <input v-model="courierName" class="input" placeholder="Courier name" />
              <input v-model="courierPhone" type="tel" class="input" placeholder="Courier phone (optional)" />
            </div>

            <div class="mt-3 flex gap-2">
              <button
                v-if="NEXT[d.status]"
                @click="advance(d)"
                :disabled="busy === d._id"
                class="ios-button-primary flex-1 text-sm py-2.5"
              >
                <i class="fa-solid mr-1" :class="NEXT[d.status].icon"></i>
                {{ busy === d._id ? '…' : (courierFor === d._id ? 'Confirm courier & go' : NEXT[d.status].label) }}
              </button>
              <button
                v-if="d.status !== 'out_for_delivery'"
                @click="cancel(d)"
                :disabled="busy === d._id"
                class="ios-card px-4 text-coral-600 font-semibold text-sm active:scale-95"
              >Cancel</button>
            </div>
          </div>
        </div>

        <!-- Recent finished -->
        <div v-if="done.length" class="px-5 mt-7">
          <h2 class="text-sm font-bold text-ink-500 uppercase tracking-wider mb-2">Recent</h2>
          <div class="ios-card divide-y divide-cream-200">
            <div v-for="d in done" :key="d._id" class="p-3.5 flex items-center gap-3">
              <span class="chip text-[10px] flex-shrink-0" :class="STATUS_META[d.status]?.color">{{ STATUS_META[d.status]?.label }}</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold truncate">{{ d.itemLabel }}</div>
                <div class="text-xs text-ink-500 truncate">{{ d.customerId?.fullName }} · {{ d.trackingCode }}</div>
              </div>
              <span class="text-sm font-bold flex-shrink-0">${{ (d.totalUSD || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-5 text-center text-xs text-ink-300"><i class="fa-solid fa-rotate mr-1"></i> Refreshes every 20s</div>
      </template>
    </template>
  </div>
</template>
