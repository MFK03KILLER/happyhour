<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import { useToastStore } from '../stores/toast';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const order = ref(null);
const loading = ref(true);
let poll = null;

const STEPS = [
  { key: 'pending', label: 'Order placed', icon: 'fa-receipt', stamp: 'placedAt' },
  { key: 'confirmed', label: 'Store confirmed', icon: 'fa-circle-check', stamp: 'confirmedAt' },
  { key: 'preparing', label: 'Preparing your bag', icon: 'fa-fire-burner', stamp: 'preparingAt' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: 'fa-motorcycle', stamp: 'outForDeliveryAt' },
  { key: 'delivered', label: 'Delivered', icon: 'fa-box-open', stamp: 'deliveredAt' },
];
const ORDER_OF = { pending: 0, confirmed: 1, preparing: 2, out_for_delivery: 3, delivered: 4 };

const currentStep = computed(() => (order.value ? ORDER_OF[order.value.status] ?? -1 : -1));
const isCancelled = computed(() => order.value?.status === 'cancelled');
const isActive = computed(() => order.value && !['delivered', 'cancelled'].includes(order.value.status));

async function load() {
  try {
    const { data } = await client.get(`/customer/deliveries/${route.params.id}`);
    order.value = data;
  } finally { loading.value = false; }
}

async function cancelOrder() {
  if (!confirm('Cancel this delivery order?')) return;
  try {
    const { data } = await client.post(`/customer/deliveries/${order.value._id}/cancel`);
    order.value = data;
    toast.success('Order cancelled.', { title: 'Cancelled' });
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Could not cancel', { title: 'Cancel failed' });
  }
}

function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
}

onMounted(async () => {
  await load();
  poll = setInterval(() => { if (isActive.value) load(); }, 10000);
});
onUnmounted(() => { if (poll) clearInterval(poll); });
</script>

<template>
  <div class="min-h-screen pb-12 safe-top bg-cream-100">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Track delivery</div>
    </header>

    <div v-if="loading" class="px-5 mt-6"><div class="h-64 bg-cream-200 rounded-3xl animate-pulse"></div></div>

    <template v-else-if="order">
      <!-- Status hero -->
      <div class="px-5 mt-5">
        <div class="rounded-3xl p-6 text-white shadow-lift relative overflow-hidden"
          :class="isCancelled ? 'bg-gradient-to-br from-ink-500 to-ink-700' : 'bg-gradient-to-br from-teal-600 to-teal-800'">
          <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10"></div>
          <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">{{ order.merchantId?.name }}</div>
          <div class="text-2xl font-bold mt-1">{{ order.itemLabel }}</div>
          <div class="mt-2 flex items-center gap-2 flex-wrap">
            <span class="chip bg-white/15 text-white font-mono">{{ order.trackingCode }}</span>
            <span v-if="isActive && order.etaMinutes" class="chip bg-white/15 text-white">
              <i class="fa-regular fa-clock text-[10px]"></i> ~{{ order.etaMinutes }} min
            </span>
          </div>
          <div v-if="isCancelled" class="mt-3 text-sm bg-black/20 rounded-xl px-3 py-2">
            Cancelled{{ order.cancelReason ? ` — ${order.cancelReason}` : '' }}
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div v-if="!isCancelled" class="px-5 mt-4">
        <div class="ios-card p-5">
          <div v-for="(s, i) in STEPS" :key="s.key" class="flex gap-3.5" :class="i < STEPS.length - 1 ? 'pb-5' : ''">
            <div class="flex flex-col items-center">
              <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition"
                :class="i <= currentStep ? 'bg-teal-600 text-white' : 'bg-cream-200 text-ink-300'">
                <i class="fa-solid text-sm" :class="[s.icon, i === currentStep && isActive ? 'animate-pulse' : '']"></i>
              </div>
              <div v-if="i < STEPS.length - 1" class="w-0.5 flex-1 mt-1" :class="i < currentStep ? 'bg-teal-600' : 'bg-cream-200'"></div>
            </div>
            <div class="pt-1.5">
              <div class="font-semibold text-sm" :class="i <= currentStep ? 'text-ink-900' : 'text-ink-300'">{{ s.label }}</div>
              <div v-if="order[s.stamp]" class="text-xs text-ink-500 mt-0.5">{{ fmtTime(order[s.stamp]) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Courier -->
      <div v-if="order.courier?.name && order.status === 'out_for_delivery'" class="px-5 mt-4">
        <div class="ios-card p-4 flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
            <i class="fa-solid fa-motorcycle"></i>
          </div>
          <div class="flex-1">
            <div class="font-bold text-sm">{{ order.courier.name }} is on the way</div>
            <div class="text-xs text-ink-500">Your courier</div>
          </div>
          <a v-if="order.courier.phone" :href="`tel:${order.courier.phone}`" class="ios-card px-4 py-2 text-teal-700 font-semibold text-sm active:scale-95">
            <i class="fa-solid fa-phone mr-1"></i> Call
          </a>
        </div>
      </div>

      <!-- Details -->
      <div class="px-5 mt-4 space-y-3">
        <div class="ios-card p-4">
          <div class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Deliver to</div>
          <div class="mt-1.5 font-semibold text-sm">{{ order.address?.label }} · {{ order.address?.street }}</div>
          <div class="text-xs text-ink-500">{{ [order.address?.city, order.address?.state, order.address?.zip].filter(Boolean).join(', ') }}</div>
          <div v-if="order.address?.notes" class="text-xs text-ink-300 italic mt-1">{{ order.address.notes }}</div>
        </div>
        <div class="ios-card p-4">
          <div class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Payment</div>
          <div class="mt-2 space-y-1 text-sm">
            <div class="flex justify-between"><span class="text-ink-500">Bag</span><span>${{ (order.bagPriceUSD || 0).toFixed(2) }}</span></div>
            <div class="flex justify-between">
              <span class="text-ink-500">Delivery fee</span>
              <span v-if="order.deliveryFeeUSD > 0">${{ order.deliveryFeeUSD.toFixed(2) }}</span>
              <span v-else class="text-green-700 font-semibold">Free</span>
            </div>
            <div class="flex justify-between font-bold pt-1 border-t border-cream-200"><span>Total</span><span class="text-teal-700">${{ (order.totalUSD || 0).toFixed(2) }}</span></div>
          </div>
        </div>
      </div>

      <div v-if="order.status === 'pending'" class="px-5 mt-4">
        <button @click="cancelOrder" class="ios-card w-full p-3.5 text-coral-600 font-semibold text-center active:scale-[0.99]">
          Cancel order
        </button>
      </div>

      <div v-if="isActive" class="mt-5 text-center text-xs text-ink-300">
        <i class="fa-solid fa-rotate mr-1"></i> Updates automatically
      </div>
    </template>
  </div>
</template>
