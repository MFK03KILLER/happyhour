<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import TermsModal from '../components/TermsModal.vue';

const router = useRouter();
const auth = useAuthStore();
const form = ref({ fullName: '', email: '', phone: '', password: '' });
const loading = ref(false);
const error = ref('');
const agreed = ref(false);
const showTerms = ref(false);
const termsVersion = ref(null);

onMounted(async () => {
  try {
    const { data } = await client.get('/public/terms');
    termsVersion.value = data.version;
  } catch {}
});

async function submit() {
  if (!agreed.value) {
    error.value = 'You must agree to the terms to create an account';
    return;
  }
  if (!termsVersion.value) {
    error.value = 'Could not load terms. Please refresh and try again.';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await auth.register({ ...form.value, acceptedTermsVersion: termsVersion.value });
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

      <label class="flex items-start gap-3 pt-2 pb-1 cursor-pointer select-none">
        <input v-model="agreed" type="checkbox" class="mt-1 w-5 h-5 accent-teal-600 flex-shrink-0" />
        <span class="text-sm text-ink-700 leading-relaxed">
          I have read and agree to the
          <button type="button" @click="showTerms = true" class="text-teal-700 font-semibold underline">Terms of Service</button>
          <span v-if="termsVersion" class="text-ink-300"> (v{{ termsVersion }})</span>
        </span>
      </label>

      <div v-if="error" class="text-coral-600 text-sm pl-2">{{ error }}</div>
      <button type="submit" class="ios-button-primary w-full" :disabled="loading || !agreed">
        {{ loading ? 'Creating…' : 'Create account' }}
      </button>
      <router-link to="/login" class="block text-center text-sm text-ink-500 pt-2">
        Already have an account? <span class="font-semibold text-teal-700">Sign in</span>
      </router-link>
    </form>

    <TermsModal :show="showTerms" @close="showTerms = false" />
  </div>
</template>
