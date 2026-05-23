<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import ApplePaySheet from '../components/ApplePaySheet.vue';
import { useToastStore } from '../stores/toast';

const router = useRouter();
const toast = useToastStore();
const plan = ref('monthly');
const sub = ref(null);
const showPay = ref(false);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/customer/subscription');
    sub.value = data.subscription;
  } finally { loading.value = false; }
});

async function onConfirm(paymentMethod) {
  try {
    const { data } = await client.post('/customer/subscription/subscribe', { plan: plan.value, paymentMethod });
    sub.value = data.subscription;
    showPay.value = false;
    toast.success('Welcome to Happy Hour! You can now claim 3 coupons per day.', { title: 'Membership active 🎉' });
    router.push('/');
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Subscription failed', { title: 'Payment failed' });
  }
}

async function cancelSub() {
  if (!confirm('Cancel at end of period?')) return;
  const { data } = await client.post('/customer/subscription/cancel');
  sub.value = data;
}
async function resumeSub() {
  const { data } = await client.post('/customer/subscription/resume');
  sub.value = data;
}

const monthlyPrice = 4.99;
const yearlyPrice = 41.99;
</script>

<template>
  <div class="min-h-screen pb-12 safe-top">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Membership</div>
    </header>

    <div v-if="loading" class="px-5 mt-10"><div class="h-64 bg-cream-200 rounded-3xl animate-pulse"></div></div>

    <div v-else-if="sub && sub.status === 'active' && new Date(sub.currentPeriodEnd) > new Date()" class="px-5 mt-6 space-y-5">
      <div class="rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 text-white p-6 shadow-lift relative overflow-hidden">
        <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10"></div>
        <span class="chip bg-white/15 text-white">Active</span>
        <div class="mt-3 text-3xl font-bold">All Access</div>
        <div class="opacity-90 mt-1 capitalize">{{ sub.plan }} plan — ${{ sub.amountUSD.toFixed(2) }}</div>
        <div class="mt-4 text-sm opacity-90">
          Next billing: <span class="font-semibold">{{ new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) }}</span>
        </div>
        <div v-if="sub.cancelAtPeriodEnd" class="mt-2 text-sm bg-coral-500/30 rounded-xl px-3 py-2">
          Cancelling on {{ new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month:'short', day:'numeric' }) }}
        </div>
      </div>

      <button v-if="!sub.cancelAtPeriodEnd" @click="cancelSub" class="ios-card w-full p-4 text-coral-600 font-semibold active:bg-cream-100 text-center">
        Cancel subscription
      </button>
      <button v-else @click="resumeSub" class="ios-button-primary w-full">Resume subscription</button>
    </div>

    <div v-else class="px-5 mt-4">
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight">One subscription. <br/>Every offer.</h1>
        <p class="text-ink-500 mt-2">Unlock unlimited claims at 200+ local spots.</p>
      </div>

      <div class="mt-6 flex justify-center">
        <div class="inline-flex bg-cream-200 rounded-full p-1">
          <button @click="plan='monthly'" class="px-5 py-2 rounded-full text-sm font-semibold transition" :class="plan==='monthly' ? 'bg-white shadow-soft' : 'text-ink-500'">Monthly</button>
          <button @click="plan='yearly'" class="px-5 py-2 rounded-full text-sm font-semibold transition" :class="plan==='yearly' ? 'bg-white shadow-soft' : 'text-ink-500'">Yearly · save 30%</button>
        </div>
      </div>

      <div class="mt-6 ios-card p-6 relative overflow-hidden">
        <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-coral-500/10"></div>
        <div class="relative">
          <div class="flex items-center justify-between">
            <span class="chip bg-coral-500 text-white">Most popular</span>
            <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">All access</span>
          </div>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-5xl font-bold tracking-tight">${{ plan==='monthly' ? monthlyPrice.toFixed(2) : yearlyPrice.toFixed(2) }}</span>
            <span class="text-ink-500">/ {{ plan==='monthly' ? 'mo' : 'yr' }}</span>
          </div>
          <ul class="mt-6 space-y-2.5 text-sm">
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Unlimited coupon claims</li>
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> 200+ local merchants</li>
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Apple Pay, Google Pay, card</li>
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Cancel anytime</li>
          </ul>
          <button @click="showPay = true" class="ios-button-primary w-full mt-6">
            Subscribe for ${{ plan==='monthly' ? monthlyPrice.toFixed(2) : yearlyPrice.toFixed(2) }}
          </button>
          <div class="text-center text-xs text-ink-300 mt-2">7-day money-back guarantee</div>
        </div>
      </div>
    </div>

    <ApplePaySheet
      v-if="showPay"
      :amount="plan==='monthly' ? monthlyPrice : yearlyPrice"
      merchant-name="Happy Hour"
      :item-name="`${plan === 'monthly' ? 'Monthly' : 'Yearly'} membership`"
      @confirm="onConfirm"
      @close="showPay = false"
    />
  </div>
</template>
