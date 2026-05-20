<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
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
const showNFC = ref(false);

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
}

onMounted(() => issue());
onUnmounted(() => stopAll());
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-teal-700 via-teal-800 to-ink-900 text-white safe-top">
    <header class="px-5 pt-4 flex items-center justify-between">
      <button @click="$router.back()" class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="font-semibold">Show to merchant</div>
      <button @click="showNFC = !showNFC" class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12c2 0 4 2 4 4M5 8c4 0 7 3 7 7M5 4c6 0 10 4 10 10"/></svg>
      </button>
    </header>

    <div class="flex-1 flex flex-col items-center justify-center px-6">
      <div v-if="error" class="bg-coral-500/20 border border-coral-400/40 text-coral-100 rounded-2xl p-4 text-center">{{ error }}</div>

      <div v-else-if="qrImage" class="text-center w-full">
        <div class="mx-auto bg-white p-5 rounded-3xl shadow-lift inline-block animate-pulse-soft">
          <img :src="qrImage" class="w-64 h-64 object-contain" alt="QR code" />
        </div>
        <div class="mt-6 text-xs uppercase tracking-wider opacity-70 font-semibold">Refreshes in</div>
        <div class="text-4xl font-bold mt-1 tabular-nums">{{ expiresIn }}s</div>
        <div class="mt-2 text-sm opacity-80">Or tap your phone on the merchant's NFC reader</div>

        <div v-if="showNFC" class="mt-6 bg-white/10 rounded-2xl p-4">
          <div class="text-sm font-semibold">NFC mode</div>
          <p class="text-xs opacity-80 mt-1">Hold the back of your device against the merchant's reader. (Android Chrome only — iPhone users should keep using QR.)</p>
        </div>
      </div>
      <div v-else class="text-center">
        <div class="mx-auto w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
        <div class="mt-4 opacity-80">Generating your QR…</div>
      </div>
    </div>

    <div class="px-6 pb-[max(env(safe-area-inset-bottom),16px)] text-center text-xs opacity-70">
      Polling for merchant scan… keep this screen open.
    </div>
  </div>
</template>
