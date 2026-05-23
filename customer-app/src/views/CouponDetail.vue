<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import { useFlagsStore } from '../stores/flags';
import { directionsUrl } from '../composables/useMapLink';
import { useToastStore } from '../stores/toast';

const flags = useFlagsStore();
const toast = useToastStore();
function openDirections(m) {
  if (!m?.address) return;
  const url = directionsUrl({ lat: m.address.lat, lng: m.address.lng, label: m.name });
  if (url) window.open(url, '_blank');
}

const route = useRoute();
const router = useRouter();
const coupon = ref(null);
const loading = ref(true);
const claiming = ref(false);
const subscription = ref(null);

onMounted(async () => {
  try {
    const [c, s] = await Promise.all([
      client.get(`/customer/coupons/${route.params.id}`),
      client.get('/customer/subscription').catch(() => ({ data: { subscription: null } })),
    ]);
    coupon.value = c.data;
    subscription.value = s.data.subscription;
  } finally {
    loading.value = false;
  }
});

function isSubscribed() {
  const s = subscription.value;
  return s && s.status === 'active' && new Date(s.currentPeriodEnd) > new Date();
}

async function claim() {
  if (!isSubscribed()) {
    router.push('/subscribe');
    return;
  }
  claiming.value = true;
  try {
    const { data } = await client.post(`/customer/coupons/${coupon.value._id}/claim`);
    if (data.activeNow !== false) {
      toast.success('Saved to your wallet — show it at the counter to redeem.', { title: 'Coupon claimed! 🎉' });
    } else {
      toast.warning('Claimed, but only redeemable during happy hour.', { title: 'Outside active hours', ttl: 7000 });
    }
    router.push('/wallet');
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Could not claim', { title: 'Claim failed' });
  } finally {
    claiming.value = false;
  }
}

function vendorName() { return coupon.value?.vendorId?.name || ''; }
function locations() { const ms = coupon.value?.merchantIds || []; return ms.slice(0, 4); }
</script>

<template>
  <div v-if="loading" class="p-6"><div class="h-72 bg-cream-200 rounded-3xl animate-pulse"></div></div>
  <div v-else-if="coupon" class="pb-32">
    <div class="relative">
      <img :src="coupon.heroImageUrl" :alt="coupon.title" class="w-full h-80 object-cover" />
      <div class="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent"></div>
      <button @click="router.back()" class="absolute top-[max(env(safe-area-inset-top),16px)] left-4 w-11 h-11 rounded-full glass flex items-center justify-center active:scale-95">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="absolute -bottom-6 left-5 right-5">
        <div class="ios-card p-5">
          <div class="flex items-center gap-3">
            <img :src="coupon.vendorId?.logoUrl" class="w-12 h-12 rounded-full object-cover bg-cream-200" />
            <div>
              <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">{{ vendorName() }}</div>
              <div class="text-xl font-bold leading-tight">{{ coupon.title }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-5 mt-12 space-y-5">
      <div class="flex gap-2 flex-wrap">
        <span class="chip bg-teal-50 text-teal-700">{{ coupon.offerType.replace('_', ' ') }}</span>
        <span class="chip bg-coral-500/10 text-coral-600">{{ coupon.maxUsesPerCustomer }} uses</span>
        <span class="chip bg-cream-200 text-ink-700">Valid until {{ new Date(coupon.validUntil).toLocaleDateString('en-US', { month:'short', day:'numeric'}) }}</span>
      </div>

      <p class="text-ink-700 leading-relaxed">{{ coupon.description || coupon.subtitle }}</p>

      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Locations</div>
        <div class="mt-3 space-y-3">
          <div v-for="m in locations()" :key="m._id" class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 mt-0.5">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 9c0 5.5 7 13 7 13s7-7.5 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold">{{ m.name }}</div>
              <div class="text-sm text-ink-500 truncate">{{ m.address?.street }}, {{ m.address?.city }}, {{ m.address?.state }}</div>
            </div>
            <button v-if="flags.isOn('maps') && m.address?.lat" @click="openDirections(m)"
              class="bg-teal-50 text-teal-700 rounded-full px-3 py-1.5 text-xs font-bold flex-shrink-0 active:scale-95">
              Directions
            </button>
          </div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">Terms</div>
        <p class="mt-2 text-sm text-ink-700">{{ coupon.termsAndConditions || 'Valid at participating locations. Cannot be combined with other offers.' }}</p>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 z-30 glass border-t border-white/40 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
      <div v-if="isSubscribed()" class="flex items-center justify-between mb-2">
        <div>
          <div class="text-xs text-ink-500">Member price</div>
          <div class="text-2xl font-bold text-teal-700">Free</div>
        </div>
        <div class="text-xs text-ink-500 text-right">
          <span class="chip bg-teal-50 text-teal-700">All access</span>
        </div>
      </div>
      <div v-else class="flex items-center justify-between mb-2">
        <div>
          <div class="text-xs text-ink-500">Member-only</div>
          <div class="text-base font-bold">Subscribe to unlock</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-ink-300">From</div>
          <div class="text-lg font-bold text-teal-700">$4.99/mo</div>
        </div>
      </div>
      <button @click="claim" class="ios-button-primary w-full text-base" :disabled="claiming">
        <span v-if="claiming">Claiming…</span>
        <span v-else-if="isSubscribed()">Claim coupon</span>
        <span v-else>Become a member</span>
      </button>
    </div>
  </div>
</template>
