<script setup>
// Instant-redeem bottom sheet. Pops up right after a claim so the customer can
// hand their phone to the counter immediately — no trip through the Wallet.
// Reuses the same QR issue/rotate/poll flow as the full Redeem screen.
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';

const props = defineProps({
  purchasedId: { type: String, required: true },
  couponTitle: { type: String, default: '' },
  vendorName: { type: String, default: '' },
  activeWindow: { type: Object, default: null },  // { days, start, end } | null
  activeNow: { type: Boolean, default: true },
});
const emit = defineEmits(['close', 'completed']);

const router = useRouter();
const redemption = ref(null);
const qrImage = ref('');
const expiresIn = ref(60);
const error = ref('');
const completed = ref(false);
let timer = null;
let polling = null;

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_LABEL = { sun:'Sun', mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat' };

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2,'0')}${ampm}`;
}

const windowLabel = computed(() => {
  const w = props.activeWindow;
  if (!w || !w.start || !w.end) return '';
  const days = w.days || ['daily'];
  const dayText = (days.includes('daily') || days.length === 7)
    ? 'Every day'
    : DAYS.filter((d) => days.includes(d)).map((d) => DAY_LABEL[d]).join(', ');
  return `${dayText} · ${fmtTime(w.start)}–${fmtTime(w.end)}`;
});

async function issue() {
  error.value = '';
  try {
    const { data } = await client.post(`/customer/wallet/${props.purchasedId}/redeem`);
    redemption.value = data.redemption;
    qrImage.value = data.qrImage;
    expiresIn.value = data.expiresIn || 60;
    startCountdown();
    startPolling();
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not generate the QR code';
  }
}

async function rotate() {
  if (!redemption.value) return;
  try {
    const { data } = await client.post(`/customer/wallet/${props.purchasedId}/redeem/${redemption.value._id}/rotate`);
    redemption.value = data.redemption;
    qrImage.value = data.qrImage;
    expiresIn.value = data.expiresIn || 60;
  } catch {}
}

function startCountdown() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    expiresIn.value -= 1;
    if (expiresIn.value <= 0) { expiresIn.value = 60; rotate(); }
  }, 1000);
}

function startPolling() {
  if (polling) clearInterval(polling);
  polling = setInterval(async () => {
    if (!redemption.value || completed.value) return;
    try {
      const { data } = await client.get(`/customer/wallet/${props.purchasedId}/redeem/${redemption.value._id}/status`);
      if (data.status === 'completed') {
        stopAll();
        completed.value = true;
        if (window.navigator?.vibrate) window.navigator.vibrate([20, 60, 20]);
        setTimeout(() => {
          emit('completed', data);
          router.push(`/orders/${data._id}`);
        }, 1600);
      }
    } catch {}
  }, 2500);
}

function stopAll() {
  if (timer) clearInterval(timer);
  if (polling) clearInterval(polling);
}

function close() {
  stopAll();
  emit('close');
}

onMounted(issue);
onUnmounted(stopAll);
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center">
    <div class="absolute inset-0 bg-black/60" @click="close"></div>

    <div class="relative w-full max-w-md rounded-t-[2rem] bg-gradient-to-b from-teal-700 to-ink-900 text-white shadow-lift overflow-hidden">
      <div class="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/30"></div>

      <!-- Success state -->
      <div v-if="completed" class="px-6 pt-10 pb-14 text-center">
        <div class="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-pulse-soft">
          <i class="fa-solid fa-check text-4xl"></i>
        </div>
        <div class="mt-5 text-2xl font-bold">Redeemed! 🎉</div>
        <p class="mt-1 text-sm opacity-80">Enjoy — taking you to your receipt…</p>
      </div>

      <template v-else>
        <div class="px-6 pt-4 pb-2 text-center">
          <div class="text-xl font-bold">Claimed! 🎉 Show this now</div>
          <p class="text-xs opacity-75 mt-1">Have the counter scan this code to use your coupon right away.</p>
        </div>

        <!-- Active-hours banner -->
        <div v-if="activeWindow" class="mx-5 mt-2">
          <div class="rounded-2xl p-3 flex items-center gap-2.5 text-sm" :class="activeNow ? 'bg-green-500/20 border border-green-400/40' : 'bg-amber-500/20 border border-amber-400/40'">
            <i class="fa-solid" :class="activeNow ? 'fa-circle-check text-green-300' : 'fa-hourglass-half text-amber-300'"></i>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-xs">{{ activeNow ? 'Usable right now' : 'Outside happy hour — merchant can accept it only during:' }}</div>
              <div class="text-[11px] opacity-90">{{ windowLabel }}</div>
            </div>
          </div>
        </div>

        <div class="px-6 py-5 flex flex-col items-center">
          <div v-if="error" class="w-full bg-coral-500/20 border border-coral-400/40 text-coral-100 rounded-2xl p-4 text-center text-sm">
            {{ error }}
            <button @click="issue" class="block mx-auto mt-2 font-bold underline">Try again</button>
          </div>

          <template v-else-if="qrImage">
            <div class="bg-white p-4 rounded-3xl shadow-lift" :class="activeNow ? 'animate-pulse-soft' : 'opacity-70'">
              <img :src="qrImage" class="w-52 h-52 object-contain" alt="Redemption QR" />
            </div>
            <div class="mt-3 flex items-center gap-2 text-xs opacity-80">
              <i class="fa-solid fa-rotate"></i>
              Refreshes in <span class="font-bold tabular-nums text-sm">{{ expiresIn }}s</span>
            </div>
            <div v-if="couponTitle" class="mt-2 text-sm font-bold text-center">{{ couponTitle }}</div>
            <div v-if="vendorName" class="text-xs opacity-70">{{ vendorName }}</div>
          </template>

          <div v-else class="py-10 text-center">
            <div class="mx-auto w-14 h-14 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
            <div class="mt-3 text-sm opacity-80">Generating your QR…</div>
          </div>
        </div>

        <div class="px-6 pb-[max(env(safe-area-inset-bottom),20px)]">
          <button @click="close" class="w-full py-3 rounded-full bg-white/15 font-semibold text-sm active:scale-[0.99]">
            Save for later
          </button>
          <p class="text-center text-[11px] opacity-60 mt-2">
            <i class="fa-solid fa-wallet mr-1"></i>Always available in your Wallet too
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
