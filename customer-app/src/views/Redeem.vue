<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';

const route = useRoute();
const router = useRouter();
const purchasedId = route.params.purchasedId;

const redemption = ref(null);
const qrImage = ref('');
const expiresIn = ref(60);
const polling = ref(null);
const timer = ref(null);
const error = ref('');
const purchased = ref(null);
const now = ref(new Date());
let clockTick = null;

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_LABEL = { sun:'Sun', mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat' };

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2,'0')}${ampm}`;
}

const activeWindow = computed(() => purchased.value?.couponId?.activeWindow || null);

const usable = computed(() => {
  const w = activeWindow.value;
  if (!w || !w.start || !w.end) return true;
  const days = w.days || ['daily'];
  const dayName = DAYS[now.value.getDay()];
  if (!days.includes('daily') && !days.includes(dayName)) return false;
  const [sh, sm] = w.start.split(':').map(Number);
  const [eh, em] = w.end.split(':').map(Number);
  const cur = now.value.getHours() * 60 + now.value.getMinutes();
  return cur >= sh * 60 + sm && cur <= eh * 60 + em;
});

const windowDaysLabel = computed(() => {
  const w = activeWindow.value;
  if (!w) return '';
  const days = w.days || ['daily'];
  if (days.includes('daily') || days.length === 7) return 'Every day';
  return DAYS.filter((d) => days.includes(d)).map((d) => DAY_LABEL[d]).join(', ');
});

const nextOpenLabel = computed(() => {
  const w = activeWindow.value;
  if (!w) return null;
  const days = w.days || ['daily'];
  const todayName = DAYS[now.value.getDay()];
  const [sh, sm] = w.start.split(':').map(Number);
  const minStart = sh * 60 + sm;
  const cur = now.value.getHours() * 60 + now.value.getMinutes();
  if ((days.includes('daily') || days.includes(todayName)) && cur < minStart) {
    return `Opens today at ${fmtTime(w.start)}`;
  }
  for (let i = 1; i <= 7; i++) {
    const d = DAYS[(now.value.getDay() + i) % 7];
    if (days.includes('daily') || days.includes(d)) {
      return `Opens ${i === 1 ? 'tomorrow' : DAY_LABEL[d]} at ${fmtTime(w.start)}`;
    }
  }
  return null;
});

const minutesUntilClose = computed(() => {
  const w = activeWindow.value;
  if (!w || !usable.value) return null;
  const [eh, em] = w.end.split(':').map(Number);
  const cur = now.value.getHours() * 60 + now.value.getMinutes();
  return (eh * 60 + em) - cur;
});

async function loadCoupon() {
  try {
    const { data } = await client.get('/customer/wallet');
    purchased.value = data.items.find((x) => x._id === purchasedId) || null;
  } catch {}
}

async function issue() {
  try {
    const { data } = await client.post(`/customer/wallet/${purchasedId}/redeem`);
    redemption.value = data.redemption;
    qrImage.value = data.qrImage;
    expiresIn.value = data.expiresIn || 60;
    startCountdown();
    startPolling();
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not generate QR';
  }
}

async function rotate() {
  if (!redemption.value) return;
  try {
    const { data } = await client.post(`/customer/wallet/${purchasedId}/redeem/${redemption.value._id}/rotate`);
    redemption.value = data.redemption;
    qrImage.value = data.qrImage;
    expiresIn.value = data.expiresIn || 60;
  } catch {}
}

function startCountdown() {
  if (timer.value) clearInterval(timer.value);
  timer.value = setInterval(() => {
    expiresIn.value -= 1;
    if (expiresIn.value <= 0) { expiresIn.value = 0; rotate(); expiresIn.value = 60; }
  }, 1000);
}

function startPolling() {
  if (polling.value) clearInterval(polling.value);
  polling.value = setInterval(async () => {
    if (!redemption.value) return;
    try {
      const { data } = await client.get(`/customer/wallet/${purchasedId}/redeem/${redemption.value._id}/status`);
      if (data.status === 'completed') {
        stopAll();
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([20, 60, 20]);
        router.replace(`/orders/${data._id}`);
      }
    } catch {}
  }, 2500);
}

function stopAll() {
  if (timer.value) clearInterval(timer.value);
  if (polling.value) clearInterval(polling.value);
  if (clockTick) clearInterval(clockTick);
}

onMounted(async () => {
  await loadCoupon();
  issue();
  clockTick = setInterval(() => { now.value = new Date(); }, 30000);
});
onUnmounted(stopAll);
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-teal-700 via-teal-800 to-ink-900 text-white safe-top">
    <header class="px-5 pt-4 flex items-center justify-between">
      <button @click="router.back()" class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="font-semibold">Show to merchant</div>
      <div class="w-10"></div>
    </header>

    <div v-if="purchased && activeWindow" class="mx-5 mt-3">
      <div class="rounded-2xl p-3 flex items-center gap-3" :class="usable ? 'bg-green-500/20 border border-green-400/40' : 'bg-amber-500/20 border border-amber-400/40'">
        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" :class="usable ? 'bg-green-500' : 'bg-amber-500'">
          <i class="fa-solid text-base" :class="usable ? 'fa-circle-check' : 'fa-hourglass-half'"></i>
        </div>
        <div class="flex-1 min-w-0 text-sm">
          <div class="font-bold">
            <span v-if="usable && minutesUntilClose && minutesUntilClose < 30">⚠️ Hurry — closes in {{ minutesUntilClose }} min</span>
            <span v-else-if="usable">Redeem now — merchant will accept this</span>
            <span v-else>{{ nextOpenLabel }}</span>
          </div>
          <div class="text-xs opacity-90 mt-0.5">Active {{ windowDaysLabel }} · {{ fmtTime(activeWindow.start) }}–{{ fmtTime(activeWindow.end) }}</div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col items-center justify-center px-6">
      <div v-if="error" class="bg-coral-500/20 border border-coral-400/40 text-coral-100 rounded-2xl p-4 text-center">{{ error }}</div>

      <div v-else-if="qrImage" class="text-center w-full" :class="usable === false ? 'opacity-60' : ''">
        <div class="mx-auto bg-white p-5 rounded-3xl shadow-lift inline-block" :class="usable ? 'animate-pulse-soft' : ''">
          <img :src="qrImage" class="w-64 h-64 object-contain" alt="QR code" />
        </div>
        <div class="mt-6 text-xs uppercase tracking-wider opacity-70 font-semibold">Refreshes in</div>
        <div class="text-4xl font-bold mt-1 tabular-nums">{{ expiresIn }}s</div>
        <div v-if="purchased?.couponId" class="mt-3 text-sm font-bold">{{ purchased.couponId.title }}</div>
        <div v-if="purchased?.couponId?.vendorId" class="text-xs opacity-70">{{ purchased.couponId.vendorId.name }}</div>
      </div>
      <div v-else class="text-center">
        <div class="mx-auto w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
        <div class="mt-4 opacity-80">Generating your QR…</div>
      </div>
    </div>

    <div class="px-6 pb-[max(env(safe-area-inset-bottom),16px)] text-center text-xs opacity-70">
      <i class="fa-solid fa-circle-info"></i>
      Keep this screen open · waiting for merchant scan
    </div>
  </div>
</template>
