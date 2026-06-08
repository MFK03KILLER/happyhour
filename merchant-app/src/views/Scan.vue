<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import CameraScanner from '../components/CameraScanner.vue';
import { toman } from '../composables/useFormat';

const router = useRouter();
async function signOut() { await auth.logout(); router.push('/login'); }

const auth = useAuthStore();
const stage = ref('idle');
const scannerOpen = ref(false);
const result = ref(null);
const errorText = ref('');
const lastScanned = ref('');

const errorCode = ref('');
async function onDetected(text) {
  if (text === lastScanned.value) return;
  lastScanned.value = text;
  scannerOpen.value = false;
  stage.value = 'processing';
  try {
    const { data } = await client.post('/merchant/scan', { qrPayload: text });
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([20, 60, 20]);
    result.value = data;
    stage.value = 'success';
  } catch (e) {
    errorText.value = e.response?.data?.error?.message || 'Scan failed';
    errorCode.value = e.response?.data?.error?.code || '';
    stage.value = 'error';
  }
}

function onError(msg) { errorText.value = msg; stage.value = 'error'; scannerOpen.value = false; }
function reset() { stage.value = 'idle'; result.value = null; errorText.value = ''; lastScanned.value = ''; }
</script>

<template>
  <div class="min-h-screen bg-cream-100 pb-28">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white safe-top px-5 pb-8 rounded-b-3xl shadow-lift">
      <div class="pt-2 flex items-center justify-between">
        <div>
          <div class="text-xs opacity-80 font-semibold uppercase tracking-wider">پنل پرسنل</div>
          <div class="text-2xl font-bold mt-0.5">{{ auth.user?.fullName }}</div>
        </div>
        <button @click="signOut" class="text-xs opacity-80 active:opacity-50">Sign out</button>
      </div>
    </header>

    <div v-if="stage === 'idle'" class="px-5 -mt-6 space-y-4">
      <button @click="scannerOpen = true" class="w-full bg-coral-500 text-white rounded-3xl py-8 flex flex-col items-center gap-3 shadow-lift active:scale-[.98] transition">
        <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
          <svg class="w-9 h-9" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M3 12h18"/></svg>
        </div>
        <div class="text-xl font-bold">اسکن کد QR مشتری</div>
        <div class="text-sm opacity-80">برای باز کردن دوربین لمس کنید</div>
      </button>

      <div class="ios-card p-5">
        <div class="text-sm font-semibold text-ink-500 uppercase tracking-wider">نحوه کار</div>
        <ol class="mt-3 space-y-2.5 text-sm text-ink-700">
          <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center flex-shrink-0">۱</span>مشتری کد QR را از اپلیکیشن نشان می‌دهد.</li>
          <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center flex-shrink-0">۲</span>شما با این اپلیکیشن آن را اسکن می‌کنید.</li>
          <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center flex-shrink-0">۳</span>کوپن استفاده می‌شود، مشخصات مشتری ذخیره می‌شود.</li>
        </ol>
      </div>
    </div>

    <div v-if="scannerOpen" class="fixed inset-0 z-50 bg-black animate-fade-in">
      <CameraScanner @detected="onDetected" @error="onError" />
      <button @click="scannerOpen = false" class="absolute top-[max(env(safe-area-inset-top),16px)] left-5 w-11 h-11 rounded-full glass flex items-center justify-center active:scale-95">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18 18 6M6 6l12 12"/></svg>
      </button>
      <div class="absolute bottom-[max(env(safe-area-inset-bottom),24px)] inset-x-0 text-center text-white text-sm font-semibold">دوربین را روی کد QR مشتری بگیرید</div>
    </div>

    <div v-if="stage==='processing'" class="px-5 mt-10 text-center">
      <div class="mx-auto w-16 h-16 rounded-full border-4 border-teal-600/20 border-t-teal-600 animate-spin"></div>
      <div class="mt-4 font-semibold">در حال بررسی...</div>
    </div>

    <div v-if="stage==='success' && result" class="px-5 mt-6 space-y-4 animate-fade-in">
      <div class="ios-card p-6 text-center">
        <div class="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-pop-in">
          <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4 10-10"/></svg>
        </div>
        <div class="mt-4 text-xl font-bold">کوپن با موفقیت استفاده شد</div>
        <div class="text-ink-500 text-sm mt-1">تخفیف اعمال شد.</div>
      </div>

      <div class="ios-card p-5 space-y-4">
        <div>
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">مشتری</div>
          <div class="font-bold mt-0.5">{{ result.customer?.fullName }}</div>
          <div class="text-sm text-ink-500" dir="ltr">{{ result.customer?.phone || result.customer?.email }}</div>
        </div>
        <div class="border-t border-cream-200 pt-4">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">پیشنهاد</div>
          <div class="font-bold mt-0.5">{{ result.coupon?.title }}</div>
          <div class="text-sm text-ink-500">{{ result.coupon?.subtitle }}</div>
        </div>
        <div class="border-t border-cream-200 pt-4 flex items-center justify-between">
          <div>
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">باقی‌مانده</div>
            <div class="font-bold mt-0.5">{{ result.usesRemaining }} از {{ result.maxUses }}</div>
          </div>
          <div class="text-left">
            <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">صرفه‌جویی</div>
            <div class="font-bold text-teal-700 mt-0.5">{{ toman(result.coupon?.priceUSD || 0) }}</div>
          </div>
        </div>
      </div>

      <button @click="reset" class="ios-button-primary w-full">اسکن مشتری بعدی</button>
    </div>

    <div v-if="stage==='error'" class="px-5 mt-6 animate-fade-in">
      <div v-if="errorCode === 'OUTSIDE_ACTIVE_HOURS'" class="ios-card p-6 text-center border-2 border-amber-300 bg-amber-50">
        <div class="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center animate-pop-in">
          <i class="fa-solid fa-hourglass-half text-3xl text-amber-600"></i>
        </div>
        <div class="mt-4 text-xl font-bold">Outside Happy Hour</div>
        <p class="text-ink-700 text-sm mt-2 leading-relaxed">{{ errorText }}</p>
        <div class="mt-4 ios-card p-3 bg-white text-left">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">What to tell the customer</div>
          <p class="text-sm text-ink-700 mt-1">
            This coupon is only valid during the merchant's happy hour window. Ask them to come back during the times shown on their coupon, and you'll be able to scan it then.
          </p>
        </div>
        <button @click="reset" class="ios-button-primary mt-5">OK, got it</button>
      </div>
      <div v-else class="ios-card p-6 text-center">
        <div class="mx-auto w-20 h-20 rounded-full bg-coral-100 flex items-center justify-center animate-pop-in">
          <i class="fa-solid fa-circle-xmark text-3xl text-coral-600"></i>
        </div>
        <div class="mt-4 text-xl font-bold">اسکن ناموفق</div>
        <div class="text-ink-500 text-sm mt-1">{{ errorText }}</div>
        <button @click="reset" class="ios-button-primary mt-5">تلاش مجدد</button>
      </div>
    </div>
  </div>
</template>
