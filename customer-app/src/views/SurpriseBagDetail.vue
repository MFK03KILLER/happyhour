<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import ApplePaySheet from '../components/ApplePaySheet.vue';
import { useToastStore } from '../stores/toast';
import { useFlagsStore } from '../stores/flags';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const flags = useFlagsStore();
const bag = ref(null);
const loading = ref(true);
const showPay = ref(false);
const fulfillment = ref('pickup');

// Delivery state (only used when the `delivery` feature flag is ON)
const addresses = ref([]);
const selectedAddressId = ref('');
const deliveryQuote = ref(null);   // { feeUSD, distanceKm, etaMinutes, freeDelivery }
const quoteError = ref('');
const quoting = ref(false);
const deliveryNotes = ref('');

const deliveryOn = computed(() => flags.isOn('delivery'));

onMounted(async () => {
  flags.load();
  try {
    const { data } = await client.get(`/customer/coupons/${route.params.id}`);
    bag.value = data;
  } finally { loading.value = false; }
});

async function loadAddresses() {
  try {
    const { data } = await client.get('/customer/addresses');
    addresses.value = data.items || [];
    const def = addresses.value.find((a) => a.isDefault) || addresses.value[0];
    if (def && !selectedAddressId.value) selectedAddressId.value = def._id;
  } catch { addresses.value = []; }
}

function merchant() { return (bag.value?.merchantIds || [])[0]; }

async function fetchQuote() {
  deliveryQuote.value = null;
  quoteError.value = '';
  const m = merchant();
  if (!selectedAddressId.value || !m) return;
  quoting.value = true;
  try {
    const { data } = await client.post('/customer/delivery/quote', {
      merchantId: m._id,
      addressId: selectedAddressId.value,
      subtotalUSD: bag.value?.priceUSD || 0,
    });
    deliveryQuote.value = data;
  } catch (e) {
    quoteError.value = e.response?.data?.error?.message || 'Delivery not available for this address';
  } finally { quoting.value = false; }
}

watch(fulfillment, async (v) => {
  if (v === 'delivery' && deliveryOn.value) {
    if (!addresses.value.length) await loadAddresses();
    await fetchQuote();
  }
});
watch(selectedAddressId, () => { if (fulfillment.value === 'delivery') fetchQuote(); });

const total = computed(() => {
  if (!bag.value) return 0;
  const fee = fulfillment.value === 'delivery' && deliveryQuote.value ? deliveryQuote.value.feeUSD : 0;
  return (bag.value.priceUSD || 0) + fee;
});

const canBuy = computed(() => {
  if (fulfillment.value !== 'delivery') return true;
  return !!(deliveryOn.value && selectedAddressId.value && deliveryQuote.value && !quoteError.value);
});

function pickupWindow() {
  if (!bag.value?.pickupWindowStart || !bag.value?.pickupWindowEnd) return null;
  const s = new Date(bag.value.pickupWindowStart);
  const e = new Date(bag.value.pickupWindowEnd);
  const fmt = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${fmt(s)} – ${fmt(e)}`;
}

async function onConfirm(paymentMethod) {
  try {
    const payload = { paymentMethod, fulfillment: fulfillment.value };
    if (fulfillment.value === 'delivery') {
      payload.addressId = selectedAddressId.value;
      if (deliveryNotes.value) payload.deliveryNotes = deliveryNotes.value;
    }
    const { data } = await client.post(`/customer/surprise-bags/${bag.value._id}/buy`, payload);
    showPay.value = false;
    if (data.deliveryOrder) {
      toast.success('Order placed! Track your delivery live.', { title: 'On its way soon 🚚' });
      router.push(`/deliveries/${data.deliveryOrder._id}`);
    } else {
      toast.success('Reserved! Pick up during the window shown on the bag.', { title: 'Bag reserved 🛍️' });
      router.push('/wallet');
    }
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Purchase failed', { title: 'Payment failed' });
  }
}

function vendor() { return bag.value?.vendorId?.name || ''; }
function savings() {
  if (!bag.value?.originalValueUSD || !bag.value?.priceUSD) return null;
  return Math.round(100 - (bag.value.priceUSD / bag.value.originalValueUSD) * 100);
}
</script>

<template>
  <div v-if="loading" class="p-6"><div class="h-72 bg-cream-200 rounded-3xl animate-pulse"></div></div>
  <div v-else-if="bag" class="pb-32">
    <div class="relative">
      <img :src="bag.heroImageUrl" :alt="bag.title" class="w-full h-72 object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <button @click="router.back()" class="absolute top-[max(env(safe-area-inset-top),16px)] left-4 w-11 h-11 rounded-full glass flex items-center justify-center active:scale-95">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="absolute top-[max(env(safe-area-inset-top),16px)] right-4 flex gap-2">
        <span v-if="savings()" class="chip bg-coral-500 text-white">-{{ savings() }}%</span>
        <span v-if="bag.inventoryRemaining != null" class="chip bg-white/95 text-ink-900">{{ bag.inventoryRemaining }} left</span>
      </div>
      <div class="absolute bottom-4 left-5 right-5 text-white drop-shadow">
        <div class="text-xs uppercase tracking-wider font-semibold opacity-90">{{ vendor() }}</div>
        <div class="text-2xl font-bold leading-tight">{{ bag.title }}</div>
        <div v-if="merchant()" class="text-sm opacity-90 mt-0.5">{{ merchant().address?.street }}, {{ merchant().address?.city }}</div>
      </div>
    </div>

    <div class="px-5 mt-5 space-y-4">
      <p class="text-ink-700 leading-relaxed">{{ bag.description || bag.subtitle }}</p>

      <div v-if="pickupWindow()" class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Pickup window</div>
        <div class="font-bold text-lg mt-1">{{ pickupWindow() }}</div>
        <div class="text-sm text-ink-500 mt-1">Arrive within this window to collect your bag.</div>
      </div>

      <!-- Fulfillment picker -->
      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-3">Get it</div>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="fulfillment = 'pickup'"
            class="rounded-2xl p-4 border-2 transition active:scale-95 text-left"
            :class="fulfillment === 'pickup' ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'"
          >
            <div class="font-bold">Pickup</div>
            <div class="text-xs text-ink-500 mt-1">Free</div>
          </button>

          <!-- Delivery: coming soon when the flag is off -->
          <button
            v-if="!deliveryOn"
            disabled
            class="rounded-2xl p-4 border-2 border-ink-300/20 bg-cream-100 text-left relative overflow-hidden opacity-80"
          >
            <div class="font-bold text-ink-500">Delivery</div>
            <div class="text-xs text-ink-300 mt-1">Not available yet</div>
            <span class="absolute top-2 right-2 chip bg-coral-500 text-white text-[9px] font-bold">
              <i class="fa-solid fa-truck-fast text-[8px]"></i> Coming soon
            </span>
          </button>
          <button
            v-else-if="!bag.deliveryAvailable"
            disabled
            class="rounded-2xl p-4 border-2 border-ink-300/20 bg-cream-100 text-left opacity-70"
          >
            <div class="font-bold text-ink-500">Delivery</div>
            <div class="text-xs text-ink-300 mt-1">Not offered by this store</div>
          </button>
          <button
            v-else
            @click="fulfillment = 'delivery'"
            class="rounded-2xl p-4 border-2 transition active:scale-95 text-left"
            :class="fulfillment === 'delivery' ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'"
          >
            <div class="font-bold">Delivery</div>
            <div class="text-xs text-ink-500 mt-1">
              <span v-if="deliveryQuote && fulfillment === 'delivery'">
                <span v-if="deliveryQuote.freeDelivery" class="text-green-700 font-semibold">Free</span>
                <span v-else>+${{ deliveryQuote.feeUSD.toFixed(2) }}</span>
              </span>
              <span v-else>To your door</span>
            </div>
          </button>
        </div>

        <!-- Delivery details (flag on + selected) -->
        <div v-if="deliveryOn && fulfillment === 'delivery'" class="mt-4 space-y-3">
          <div v-if="addresses.length === 0" class="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-sm text-amber-900">
            <div class="font-bold"><i class="fa-solid fa-location-dot mr-1"></i> No saved address</div>
            <p class="text-xs mt-1">Add a delivery address to continue.</p>
            <router-link to="/profile/addresses" class="inline-block mt-2 text-xs font-bold text-teal-700 underline">Add address →</router-link>
          </div>
          <template v-else>
            <select v-model="selectedAddressId" class="input">
              <option v-for="a in addresses" :key="a._id" :value="a._id">
                {{ a.label }} — {{ a.street }}{{ a.city ? `, ${a.city}` : '' }}
              </option>
            </select>
            <input v-model="deliveryNotes" class="input" placeholder="Notes for the courier (optional)" maxlength="300" />

            <div v-if="quoting" class="text-sm text-ink-500"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Checking delivery…</div>
            <div v-else-if="quoteError" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 p-3 text-sm text-coral-700">{{ quoteError }}</div>
            <div v-else-if="deliveryQuote" class="rounded-2xl bg-teal-50 border border-teal-600/20 p-3.5 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-ink-700"><i class="fa-solid fa-truck-fast text-teal-700 mr-1.5"></i>Delivery fee</span>
                <span v-if="deliveryQuote.freeDelivery" class="font-bold text-green-700">Free 🎉</span>
                <span v-else class="font-bold text-teal-800">${{ deliveryQuote.feeUSD.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between mt-1 text-xs text-ink-500">
                <span>Estimated time</span>
                <span>~{{ deliveryQuote.etaMinutes }} min<span v-if="deliveryQuote.distanceKm != null"> · {{ deliveryQuote.distanceKm.toFixed(1) }} km</span></span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Terms</div>
        <p class="mt-2 text-sm text-ink-700">{{ bag.termsAndConditions || 'Surprise contents — limited quantity. No refunds once picked up.' }}</p>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 z-30 glass border-t border-white/40 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="text-xs text-ink-500">Total</div>
          <div class="text-2xl font-bold text-teal-700">${{ total.toFixed(2) }}</div>
        </div>
        <div v-if="bag.originalValueUSD" class="text-right">
          <div class="text-xs text-ink-500">Worth</div>
          <div class="text-sm text-ink-300 line-through">${{ bag.originalValueUSD.toFixed(2) }}</div>
        </div>
      </div>
      <button @click="showPay = true" :disabled="!canBuy" class="ios-button-primary w-full text-base disabled:opacity-50">
        {{ fulfillment === 'delivery' ? 'Order delivery' : 'Reserve' }} for ${{ total.toFixed(2) }}
      </button>
    </div>

    <ApplePaySheet
      v-if="showPay"
      :amount="total"
      :merchant-name="vendor()"
      :item-name="bag.title"
      @confirm="onConfirm"
      @close="showPay = false"
    />
  </div>
</template>
