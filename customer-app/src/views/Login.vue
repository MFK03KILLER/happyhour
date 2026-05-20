<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('customer1@happyhour.demo');
const password = ref('Customer@123');
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col safe-top px-6 pb-10">
    <div class="pt-10 flex flex-col items-center text-center">
      <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 shadow-lift flex items-center justify-center">
        <svg class="w-10 h-10 text-cream-50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
      </div>
      <h1 class="mt-5 text-3xl font-bold tracking-tight">Welcome to Happy Hour</h1>
      <p class="mt-1.5 text-ink-500">Save more, every time you go out.</p>
    </div>

    <form @submit.prevent="submit" class="mt-10 space-y-3 max-w-sm mx-auto w-full">
      <input v-model="email" type="email" class="input" placeholder="Email address" required />
      <input v-model="password" type="password" class="input" placeholder="Password" required />
      <div v-if="error" class="text-coral-600 text-sm pl-2">{{ error }}</div>
      <button type="submit" class="ios-button-primary w-full" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
      <router-link to="/register" class="block text-center text-sm text-ink-500 pt-2">
        Don't have an account? <span class="font-semibold text-teal-700">Create one</span>
      </router-link>
    </form>

    <div class="mt-auto text-center text-[11px] text-ink-300">
      Demo creds prefilled · admin@happyhour.demo · pizza.staff@happyhour.demo
    </div>
  </div>
</template>
