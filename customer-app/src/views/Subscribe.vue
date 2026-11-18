<script setup>
// Membership: three monthly plans (Basic / Gold / Premium), each buying a number
// of coupon redemptions per restaurant per month. Paid by Stripe as a monthly
// auto-renewing subscription; members can switch plans or cancel here.
import { goBack } from '../utils/goBack';
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import client from '../api/client';
import CheckoutSheet from '../components/CheckoutSheet.vue';
import { useToastStore } from '../stores/toast';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const toast = useToastStore();
const auth = useAuthStore();
const confirming = ref(false);
const sub = ref(null);
const currentPlan = ref(null);
const availablePlans = ref([]);
const showPay = ref(false);
const selectedTier = ref('gold');
const loading = ref(true);
const paymentsProvider = ref('mock');

const promoInput = ref('');
const promo = ref(null);        // { code, discountUSD, finalUSD }
const promoError = ref('');
const applyingPromo = ref(false);
const checkingOut = ref(false);
const activating = ref(false);
const busy = ref(false);

// No payment processor configured: membership is free during launch.
const freeLaunch = computed(() => paymentsProvider.value !== 'stripe');

async function loadSub() {
  const { data } = await client.get('/customer/subscription');
  sub.value = data.subscription;
  currentPlan.value = data.plan;
  availablePlans.value = (data.available || []).filter((p) => p.tier !== 'free');
  paymentsProvider.value = data.paymentsProvider || 'mock';
  if (isActive.value && availablePlans.value.some((p) => p.tier === sub.value.tier)) {
    selectedTier.value = nextTierUp(sub.value.tier) || sub.value.tier;
  }
  return data;
}

// Stripe sends the customer back here after checkout; the webhook may land a
// moment later, so poll briefly.
async function handleCheckoutReturn() {
  const status = route.query.checkout;
  if (!status) return;
  router.replace({ path: '/subscribe' });
  if (status === 'cancel') {
    toast.info('Checkout cancelled — you have not been charged.', { title: 'Cancelled' });
    return;
  }
  if (status !== 'success') return;
  if (!(await waitForMembership())) {
    toast.info('Payment received — your membership will activate in a moment.', { title: 'Almost there', ttl: 8000 });
  }
}

async function waitForMembership(since = null, tries = 10) {
  confirming.value = true;
  try {
    for (let i = 0; i < tries; i++) {
      const data = await loadSub();
      const s = data.subscription;
      const fresh = !since || new Date(s?.updatedAt || s?.currentPeriodStart) >= since;
      if (s && s.status === 'active' && new Date(s.currentPeriodEnd) > new Date() && fresh) {
        await auth.fetchMe();
        toast.success(`You're on ${data.plan?.label || 'your new plan'}!`, { title: 'Payment received 🎉' });
        return true;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return false;
  } finally { confirming.value = false; }
}

onMounted(async () => {
  try { await loadSub(); } finally { loading.value = false; }
  await handleCheckoutReturn();
});

const isActive = computed(() => !!sub.value && sub.value.status === 'active' && new Date(sub.value.currentPeriodEnd) > new Date());
const currentTier = computed(() => (isActive.value ? sub.value.tier : 'free'));
const autoRenews = computed(() => isActive.value && !!sub.value.stripeSubscriptionId);
const selected = computed(() => availablePlans.value.find((p) => p.tier === selectedTier.value));
const listPrice = computed(() => selected.value?.price?.monthly || 0);
const finalPrice = computed(() => (promo.value && promo.value.finalUSD != null ? promo.value.finalUSD : listPrice.value));
const RANK = { free: 0, basic: 1, gold: 2, premium: 3 };
function nextTierUp(t) { return { basic: 'gold', gold: 'premium' }[t] || null; }
const changing = computed(() => isActive.value && selectedTier.value !== currentTier.value);
const upgrade = computed(() => RANK[selectedTier.value] > RANK[currentTier.value]);
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const perRestaurant = (p) => p?.limits?.redemptionsPerRestaurantMonthly || 0;

watch(selectedTier, () => { promo.value = null; promoError.value = ''; });

async function applyPromo() {
  promoError.value = '';
  if (!promoInput.value.trim()) return;
  applyingPromo.value = true;
  try {
    const { data } = await client.post('/customer/subscription/validate-promo', {
      code: promoInput.value.trim(), tier: selectedTier.value, plan: 'monthly', audience: 'customer',
    });
    if (data.valid) {
      promo.value = { code: data.code, discountUSD: data.discountUSD, finalUSD: data.finalUSD };
      toast.success(`Code ${data.code} applied — first month ${money(data.finalUSD)}`, { title: 'Promo applied 🎟️' });
    } else {
      promoError.value = 'Invalid promo code';
    }
  } catch (e) {
    promoError.value = e.response?.data?.error?.message || 'Invalid promo code';
  } finally { applyingPromo.value = false; }
}

const inAppBrowser = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Browser');
const platform = Capacitor.getPlatform();
// Never mention the other platform's wallet inside an app (App Store 2.3.10).
const walletLine = platform === 'ios' ? 'Apple Pay or card' : platform === 'android' ? 'Google Pay or card' : 'Apple Pay, Google Pay or card';

async function startPurchase() {
  if (changing.value && autoRenews.value) return changePlan();
  if (paymentsProvider.value === 'stripe') return startStripeCheckout();
  showPay.value = true;
}

async function startStripeCheckout() {
  checkingOut.value = true;
  try {
    const { data } = await client.post('/customer/subscription/checkout', {
      tier: selectedTier.value, plan: 'monthly', promoCode: promo.value?.code, audience: 'customer',
      returnTo: inAppBrowser ? 'app' : 'web',
    });
    if (data.activated) {
      sub.value = data.subscription;
      currentPlan.value = data.plan;
      await auth.fetchMe();
      toast.success(`Your ${data.plan.label} membership is active.`, { title: 'Welcome aboard 🎉' });
      router.push('/');
      return;
    }
    if (!data.url) return;
    if (!inAppBrowser) { window.location.href = data.url; return; }
    const since = new Date(Date.now() - 5000);
    const { Browser } = await import('@capacitor/browser');
    const listener = await Browser.addListener('browserFinished', async () => {
      listener.remove();
      if (!(await waitForMembership(since, 6))) {
        toast.info('No payment was completed. If you did pay, your membership will show up in a minute.', { title: 'Checkout closed', ttl: 8000 });
      }
    });
    await Browser.open({ url: data.url });
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Could not start checkout', { title: 'Checkout failed' });
  } finally { checkingOut.value = false; }
}

async function changePlan() {
  const target = selected.value;
  const msg = upgrade.value
    ? `Switch to ${target.label} for ${money(target.price.monthly)}/month?\n\nYou'll be charged the difference for the rest of this month now, and ${money(target.price.monthly)} each month after.`
    : `Switch to ${target.label} for ${money(target.price.monthly)}/month?\n\nThe unused part of this month is credited to your next bill.`;
  if (!window.confirm(msg)) return;
  busy.value = true;
  try {
    const { data } = await client.post('/customer/subscription/change', { tier: selectedTier.value });
    sub.value = data.subscription;
    currentPlan.value = data.plan;
    await auth.fetchMe();
    toast.success(`You're now on ${data.plan.label}.`, { title: 'Plan changed' });
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Could not change your plan', { title: 'Something went wrong' });
  } finally { busy.value = false; }
}

async function setCancel(cancel) {
  if (cancel && !window.confirm(`Cancel your membership? You keep it until ${fmtDate(sub.value.currentPeriodEnd)} and won't be charged again.`)) return;
  busy.value = true;
  try {
    const { data } = await client.post(cancel ? '/customer/subscription/cancel' : '/customer/subscription/resume');
    sub.value = data;
    toast.success(cancel ? `Cancelled. Your membership stays active until ${fmtDate(data.currentPeriodEnd)}.` : 'Your membership will renew as usual.', { title: cancel ? 'Membership cancelled' : 'Membership resumed' });
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Something went wrong');
  } finally { busy.value = false; }
}

// Free launch activation (no payment processor configured - nothing charged).
async function onConfirm() {
  activating.value = true;
  try {
    const { data } = await client.post('/customer/subscription/subscribe', { tier: selectedTier.value, audience: 'customer' });
    sub.value = data.subscription;
    currentPlan.value = data.plan;
    await auth.fetchMe();
    showPay.value = false;
    toast.success(`Your ${data.plan.label} membership is active.`, { title: 'Welcome aboard 🎉' });
    router.push('/');
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Could not start your membership', { title: 'Something went wrong' });
  } finally { activating.value = false; }
}

function tierBg(tier) {
  if (tier === 'gold') return 'from-coral-500 to-coral-600';
  if (tier === 'premium') return 'from-purple-600 to-fuchsia-700';
  return 'from-teal-600 to-teal-800';
}
const ctaLabel = computed(() => {
  if (!selected.value) return '';
  if (checkingOut.value) return 'Redirecting…';
  if (busy.value) return 'One moment…';
  if (freeLaunch.value) return `Start ${selected.value.label} free`;
  if (changing.value && autoRenews.value) return `${upgrade.value ? 'Upgrade' : 'Switch'} to ${selected.value.label} — ${money(listPrice.value)}/mo`;
  return `Get ${selected.value.label} — ${money(finalPrice.value)}${promo.value ? ' first month' : '/mo'}`;
});
const showCta = computed(() => selected.value && (!isActive.value || (changing.value && (autoRenews.value || freeLaunch.value))));
</script>

<template>
  <div class="min-h-screen pb-12 safe-top bg-cream-100">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <button aria-label="Back" @click="goBack(router)" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Membership</div>
    </header>

    <div v-if="confirming" class="mx-5 mt-4 ios-card p-4 flex items-center gap-3 bg-teal-50 border border-teal-600/20">
      <div class="w-8 h-8 rounded-full border-[3px] border-teal-600/25 border-t-teal-700 animate-spin flex-shrink-0"></div>
      <div class="text-sm">
        <div class="font-bold text-teal-800">Confirming your payment…</div>
        <div class="text-xs text-ink-500 mt-0.5">This only takes a moment. Don't close the app.</div>
      </div>
    </div>

    <div v-if="loading" class="px-5 mt-6"><div class="h-64 bg-cream-200 rounded-3xl animate-pulse"></div></div>

    <template v-else>
      <!-- Current membership -->
      <div v-if="isActive" class="px-5 mt-5">
        <div class="rounded-3xl bg-gradient-to-br text-white p-6 shadow-lift relative overflow-hidden" :class="tierBg(currentTier)">
          <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10"></div>
          <span class="chip bg-white/15 text-white">Your plan</span>
          <div class="mt-3 text-3xl font-bold">{{ currentPlan?.label }}</div>
          <div class="opacity-90 mt-1">{{ perRestaurant(currentPlan) }} coupon{{ perRestaurant(currentPlan) === 1 ? '' : 's' }} per restaurant every month</div>
          <div class="mt-3 text-sm opacity-90">
            <template v-if="autoRenews && !sub.cancelAtPeriodEnd">Renews {{ fmtDate(sub.currentPeriodEnd) }} · {{ money(sub.amountUSD) }}/month</template>
            <template v-else-if="autoRenews">Cancelled · active until {{ fmtDate(sub.currentPeriodEnd) }}</template>
            <template v-else>Active until {{ fmtDate(sub.currentPeriodEnd) }}</template>
          </div>
        </div>
        <div v-if="autoRenews" class="mt-3">
          <button v-if="!sub.cancelAtPeriodEnd" :disabled="busy" class="ios-card w-full p-3 text-coral-600 font-semibold text-center disabled:opacity-60" @click="setCancel(true)">Cancel membership</button>
          <button v-else :disabled="busy" class="ios-button-primary w-full disabled:opacity-60" @click="setCancel(false)">Keep my membership</button>
        </div>
      </div>

      <div class="px-5 mt-6">
        <div class="text-center">
          <h1 class="text-2xl font-bold tracking-tight">{{ isActive ? 'Change plan' : 'Pick your plan' }}</h1>
          <p class="text-ink-500 mt-1 text-sm">Each plan gives you coupons at every participating restaurant, every month.</p>
        </div>

        <div class="mt-5 space-y-3">
          <button
            v-for="p in availablePlans"
            :key="p.tier"
            type="button"
            class="ios-card w-full text-left p-5 transition relative"
            :class="selectedTier === p.tier ? 'ring-2 ring-teal-600' : 'opacity-90'"
            @click="selectedTier = p.tier"
          >
            <div v-if="p.badge" class="absolute -top-2 right-4 chip text-white text-[10px]" :class="p.tier === 'gold' ? 'bg-coral-500' : p.tier === 'premium' ? 'bg-purple-600' : 'bg-ink-500'">{{ p.badge }}</div>
            <div v-if="currentTier === p.tier" class="absolute -top-2 left-4 chip bg-teal-600 text-white text-[10px]">Current</div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xl font-bold">{{ p.label }}</div>
                <div class="text-sm font-semibold text-teal-700 mt-0.5">{{ perRestaurant(p) }} coupon{{ perRestaurant(p) === 1 ? '' : 's' }} per restaurant / month</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-2xl font-bold">{{ money(p.price.monthly) }}</div>
                <div class="text-[10px] uppercase tracking-wider text-ink-500">/ month</div>
                <div v-if="freeLaunch" class="chip bg-teal-50 text-teal-700 text-[10px] mt-1">Free during launch</div>
              </div>
            </div>
            <ul class="mt-4 space-y-1.5 text-sm">
              <li v-for="b in p.bullets" :key="b" class="flex gap-2">
                <span class="w-4 h-4 mt-0.5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 text-[10px]">✓</span>
                <span>{{ b }}</span>
              </li>
            </ul>
          </button>
        </div>

        <div class="mt-5 ios-card p-4 text-sm text-ink-700">
          <div class="font-semibold">How the coupon limit works</div>
          <p class="mt-1 text-ink-500">Visiting the same restaurant? Basic gives you 1 coupon there each month, Gold 2 and Premium 4. Every restaurant has its own allowance, and it resets on the 1st of each month.</p>
        </div>

        <!-- Promo code (new memberships only) -->
        <div v-if="!freeLaunch && !isActive" class="mt-5">
          <div v-if="!promo" class="flex gap-2">
            <input v-model="promoInput" class="input flex-1 uppercase" placeholder="Promo code" @keyup.enter="applyPromo" />
            <button :disabled="applyingPromo || !promoInput.trim()" class="ios-card px-4 font-semibold text-teal-700 active:scale-95 disabled:opacity-50" @click="applyPromo">{{ applyingPromo ? '…' : 'Apply' }}</button>
          </div>
          <div v-else class="ios-card p-3 flex items-center justify-between bg-green-50 border border-green-200">
            <div class="text-sm"><span class="font-bold font-mono text-green-700">{{ promo.code }}</span><span class="text-green-800"> — first month {{ money(promo.finalUSD) }}</span></div>
            <button class="text-xs text-ink-500 font-semibold" @click="promo = null">Remove</button>
          </div>
          <div v-if="promoError" class="text-coral-600 text-xs pl-2 mt-1">{{ promoError }}</div>
        </div>

        <button v-if="showCta" :disabled="checkingOut || busy" class="ios-button-primary w-full mt-5 disabled:opacity-60" @click="startPurchase">{{ ctaLabel }}</button>
        <p v-if="isActive && changing && !autoRenews && !freeLaunch" class="mt-4 text-center text-sm text-ink-500">To change this membership, contact support.</p>
        <div class="text-center text-xs text-ink-300 mt-3">
          {{ freeLaunch ? 'Free during launch · Nothing to pay' : `Secure payment by Stripe · ${walletLine} · Renews monthly · Cancel anytime` }}
        </div>
      </div>
    </template>

    <CheckoutSheet
      v-if="showPay && selected"
      :title="`${selected.label} membership`"
      amount-label="Free"
      :item-name="`30 days · normally ${money(selected.price?.monthly)}/mo`"
      note="Online payment isn't open yet, so membership is free during our launch. You won't be charged, and nothing renews automatically."
      :confirm-label="`Start ${selected.label} free`"
      :busy="activating"
      @confirm="onConfirm"
      @close="showPay = false"
    />
  </div>
</template>
