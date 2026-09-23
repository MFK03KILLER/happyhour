<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const SUPPORT_EMAIL = 'business9776@gmail.com';

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const user = await auth.login(email.value, password.value);
    if (user.role === 'admin') router.push('/admin');
    else if (user.role === 'vendor') router.push('/vendor');
    else if (user.role === 'merchant_staff') router.push('/');
    else { error.value = 'This app is for partner venues. Customers use the Happy Hour app.'; await auth.logout(); }
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Sign-in failed';
  } finally {
    loading.value = false;
  }
}

// Legal pages open in an in-app browser sheet (SFSafariViewController on iOS),
// never by throwing the user out to Safari.
async function openPrivacy() {
  const url = 'https://happyhourz.org/privacy';
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener');
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-teal-700 via-teal-800 to-ink-900 text-white safe-top px-6 pb-10 flex flex-col">
    <div class="pt-12 flex flex-col items-center text-center">
      <div class="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur shadow-lift flex items-center justify-center border border-white/20">
        <svg class="w-10 h-10 text-cream-50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
      </div>
      <h1 class="mt-5 text-3xl font-bold tracking-tight">Happy Hour for venues</h1>
      <p class="mt-1.5 text-cream-50/80">Scan member codes, track redemptions, manage your offers.</p>
    </div>

    <form @submit.prevent="submit" class="mt-10 space-y-3 max-w-sm mx-auto w-full">
      <input v-model="email" type="email" autocomplete="username" class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="Work email" required />
      <input v-model="password" type="password" autocomplete="current-password" class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="Password" required />
      <div v-if="error" class="bg-coral-500/20 border border-coral-400/40 text-coral-100 rounded-2xl px-4 py-3 text-sm">{{ error }}</div>
      <button type="submit" class="w-full rounded-full font-semibold bg-coral-500 hover:bg-coral-600 text-white py-3.5 active:scale-[.97] transition shadow-soft" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
      <p class="text-center text-xs text-cream-50/60 pt-1">
        Trouble signing in? <a :href="`mailto:${SUPPORT_EMAIL}`" class="underline text-cream-50/80">Email us</a>
      </p>
    </form>

    <!-- The public path: any venue can learn how it works and apply -->
    <div class="mt-10 max-w-sm mx-auto w-full rounded-3xl bg-white/10 border border-white/15 p-5">
      <div class="font-semibold">Not a partner yet?</div>
      <p class="text-sm text-cream-50/75 mt-1 leading-relaxed">
        Accounts are issued to venues in the Happy Hour programme. Tell us about your place and we'll get you set up.
      </p>
      <button @click="router.push('/apply')" class="mt-4 w-full rounded-full font-semibold bg-white text-teal-800 py-3 active:scale-[.97] transition">
        Apply to become a partner
      </button>
    </div>

    <div class="mt-auto pt-8 text-center">
      <button type="button" @click="openPrivacy" class="text-xs text-white/60 underline">Privacy Policy</button>
    </div>
  </div>
</template>
