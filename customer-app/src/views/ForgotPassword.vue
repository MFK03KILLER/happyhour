<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import { goBack } from '../utils/goBack';

const route = useRoute();
const router = useRouter();
const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const sending = ref(false);
const sent = ref(false);
const error = ref('');

async function send() {
  error.value = '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { error.value = 'Enter the email you sign in with.'; return; }
  sending.value = true;
  try {
    await client.post('/auth/forgot-password', { email: email.value.trim() });
    sent.value = true;
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not send the email. Check your connection and try again.';
  } finally { sending.value = false; }
}
</script>

<template>
  <div class="min-h-screen safe-top px-6 pb-10 bg-cream-100">
    <button aria-label="Back" class="mt-2 w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200" @click="goBack(router, '/login')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    </button>
    <template v-if="!sent">
      <h1 class="mt-6 text-3xl font-bold tracking-tight">Forgot your password?</h1>
      <p class="mt-2 text-ink-500">Enter your email and we'll send you a link to choose a new one. Works for customer and partner accounts.</p>
      <form novalidate class="mt-6 space-y-3" @submit.prevent="send">
        <input v-model="email" type="email" autocomplete="email" class="input" placeholder="Email address" />
        <div v-if="error" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ error }}</div>
        <button type="submit" :disabled="sending" class="ios-button-primary w-full disabled:opacity-60">{{ sending ? 'Sending…' : 'Send reset link' }}</button>
      </form>
    </template>
    <template v-else>
      <div class="mt-10 w-16 h-16 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center"><i class="fa-solid fa-envelope text-2xl"></i></div>
      <h1 class="mt-5 text-3xl font-bold tracking-tight">Check your email</h1>
      <p class="mt-2 text-ink-500">If <b class="text-ink-900">{{ email }}</b> has a Happy Hour account, a reset link is on its way. It works for 30 minutes. Check your spam folder too.</p>
      <router-link to="/login" class="ios-button-primary w-full mt-8 block text-center">Back to sign in</router-link>
    </template>
  </div>
</template>
