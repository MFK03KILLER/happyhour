<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const phone = ref('09120000000');
const password = ref('Admin@12345');
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true; error.value = '';
  try {
    const user = await auth.login(phone.value, password.value);
    if (user.role === 'admin') router.push('/admin');
    else if (user.role === 'vendor') router.push('/vendor');
    else if (user.role === 'merchant_staff') router.push('/');
    else { error.value = 'این پنل برای ادمین، وندور و مرچنت است.'; await auth.logout(); }
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'ورود ناموفق بود';
  } finally { loading.value = false; }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-teal-700 via-teal-800 to-ink-900 text-white safe-top px-6 pb-10 flex flex-col">
    <div class="pt-12 flex flex-col items-center text-center">
      <div class="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur shadow-lift flex items-center justify-center border border-white/20">
        <svg class="w-10 h-10 text-cream-50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
      </div>
      <h1 class="mt-5 text-3xl font-bold">پنل مدیریت</h1>
      <p class="mt-1.5 text-cream-50/80">ورود برای ادمین، وندور و فروشگاه‌ها</p>
    </div>

    <form @submit.prevent="submit" class="mt-10 space-y-3 max-w-sm mx-auto w-full">
      <input v-model="phone" type="tel" dir="ltr" class="input text-left bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="شماره موبایل" required />
      <input v-model="password" type="password" class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="رمز عبور" required />
      <div v-if="error" class="bg-coral-500/20 border border-coral-400/40 text-coral-100 rounded-2xl px-4 py-3 text-sm">{{ error }}</div>
      <button type="submit" class="w-full rounded-full font-semibold bg-coral-500 hover:bg-coral-600 text-white py-3.5 active:scale-[.97] transition shadow-soft" :disabled="loading">
        {{ loading ? 'در حال ورود…' : 'ورود' }}
      </button>
    </form>

    <div class="mt-auto text-center text-[11px] text-white/60 space-y-1">
      <div>ادمین: ۰۹۱۲۰۰۰۰۰۰۰ / Admin@12345</div>
      <div>وندور: ۰۹۱۲۱۲۳۴۵۶۷ / Vendor@123</div>
      <div>مرچنت: ۰۹۱۲۷۷۷۷۷۷۷ / Merchant@123</div>
    </div>
  </div>
</template>
