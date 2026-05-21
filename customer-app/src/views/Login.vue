<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const stage = ref('phone');
const phone = ref('');
const code = ref('');
const fullName = ref('');
const mockCode = ref('');
const expiresIn = ref(0);
const loading = ref(false);
const error = ref('');
const needsName = ref(false);

let countdownTimer = null;
function startCountdown(s) {
  expiresIn.value = s;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    expiresIn.value -= 1;
    if (expiresIn.value <= 0) clearInterval(countdownTimer);
  }, 1000);
}

async function sendOtp() {
  loading.value = true; error.value = '';
  try {
    const { data } = await client.post('/auth/otp/request', { phone: phone.value });
    mockCode.value = data.mockCode;
    startCountdown(data.expiresInSeconds || 120);
    stage.value = 'code';
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'ارسال کد ناموفق بود';
  } finally { loading.value = false; }
}

async function verifyOtp() {
  loading.value = true; error.value = '';
  try {
    const { data } = await client.post('/auth/otp/verify', {
      phone: phone.value,
      code: code.value,
      fullName: needsName.value ? fullName.value : undefined,
    });
    auth.setSession(data);
    router.push('/');
  } catch (e) {
    const msg = e.response?.data?.error?.message || '';
    if (msg.includes('نام کامل')) {
      needsName.value = true;
      error.value = 'برای ثبت‌نام، نام کامل خود را وارد کنید';
    } else {
      error.value = msg || 'تایید کد ناموفق بود';
    }
  } finally { loading.value = false; }
}
</script>

<template>
  <div class="min-h-screen flex flex-col safe-top px-6 pb-10">
    <button v-if="stage === 'code'" @click="stage = 'phone'; code = ''" class="mt-3 w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-cream-200 self-end">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
    </button>

    <div class="pt-8 flex flex-col items-center text-center">
      <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 shadow-lift flex items-center justify-center">
        <svg class="w-10 h-10 text-cream-50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
      </div>
      <h1 class="mt-5 text-3xl font-bold">به هپی‌اَور خوش آمدید</h1>
      <p class="mt-1.5 text-ink-500">هر بار که بیرون می‌روید، صرفه‌جویی کنید.</p>
    </div>

    <form v-if="stage === 'phone'" @submit.prevent="sendOtp" class="mt-10 space-y-3 max-w-sm mx-auto w-full">
      <label class="text-sm font-semibold text-ink-700 block mb-1">شماره موبایل</label>
      <input v-model="phone" type="tel" dir="ltr" class="input text-left" placeholder="09xx xxx xxxx" required />
      <div v-if="error" class="text-coral-600 text-sm">{{ error }}</div>
      <button type="submit" class="ios-button-primary w-full" :disabled="loading">
        {{ loading ? 'در حال ارسال…' : 'دریافت کد تایید' }}
      </button>
      <p class="text-xs text-ink-500 text-center pt-2">
        با ورود، با <a class="text-teal-700 font-semibold">قوانین</a> هپی‌اَور موافقت می‌کنید.
      </p>
    </form>

    <form v-else @submit.prevent="verifyOtp" class="mt-10 space-y-3 max-w-sm mx-auto w-full">
      <div class="text-center">
        <div class="text-sm text-ink-500">کد ۶ رقمی به شماره</div>
        <div class="font-bold text-lg" dir="ltr">{{ phone }}</div>
        <div class="text-xs text-ink-300 mt-1">پیامک شد</div>
      </div>

      <input v-model="code" type="tel" maxlength="6" dir="ltr" class="input text-center text-2xl tracking-widest font-bold" placeholder="------" required />

      <input v-if="needsName" v-model="fullName" type="text" class="input" placeholder="نام و نام خانوادگی" required />

      <div v-if="mockCode" class="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center text-sm">
        <div class="text-xs uppercase tracking-wider text-amber-700 font-semibold">حالت دمو</div>
        <div class="font-mono text-lg" dir="ltr">کد: {{ mockCode }}</div>
      </div>

      <div v-if="error" class="text-coral-600 text-sm text-center">{{ error }}</div>

      <button type="submit" class="ios-button-primary w-full" :disabled="loading">
        {{ loading ? 'در حال بررسی…' : 'تایید و ورود' }}
      </button>

      <div class="text-center text-xs text-ink-500 pt-2">
        <span v-if="expiresIn > 0">کد تا {{ expiresIn }} ثانیه دیگر معتبر است</span>
        <button v-else type="button" @click="sendOtp" class="text-teal-700 font-semibold">ارسال مجدد کد</button>
      </div>
    </form>

    <div class="mt-auto text-center text-[11px] text-ink-300">
      دمو · شماره‌های آماده تست: ۰۹۱۲۱۱۱۱۱۱۱ / ۰۹۱۲۲۲۲۲۲۲۲ / ۰۹۱۲۳۳۳۳۳۳۳
    </div>
  </div>
</template>
