<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const form = ref({ fullName: '', email: '', phone: '', password: '' });
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.register(form.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Registration failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col safe-top px-6 pb-10">
    <button @click="$router.back()" class="mt-3 w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
    </button>
    <h1 class="mt-6 text-3xl font-bold tracking-tight">Create your account</h1>
    <p class="mt-1.5 text-ink-500">It only takes a minute.</p>

    <form @submit.prevent="submit" class="mt-8 space-y-3">
      <input v-model="form.fullName" class="input" placeholder="Full name" required />
      <input v-model="form.email" type="email" class="input" placeholder="Email address" required />
      <input v-model="form.phone" type="tel" class="input" placeholder="Phone (optional)" />
      <input v-model="form.password" type="password" class="input" placeholder="Password (8+ chars)" required minlength="8" />
      <div v-if="error" class="text-coral-600 text-sm pl-2">{{ error }}</div>
      <button type="submit" class="ios-button-primary w-full" :disabled="loading">
        {{ loading ? 'Creating…' : 'Create account' }}
      </button>
      <router-link to="/login" class="block text-center text-sm text-ink-500 pt-2">
        Already have an account? <span class="font-semibold text-teal-700">Sign in</span>
      </router-link>
    </form>
  </div>
</template>
