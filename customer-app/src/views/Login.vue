<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('customer1@happyhour.demo');
const password = ref('Customer@123');
const loading = ref(false);
const error = ref('');

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_SERVICE_ID = import.meta.env.VITE_APPLE_SERVICE_ID || '';
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin + '/login' : '');

onMounted(() => {
  initGoogle();
  initApple();
});

function initGoogle() {
  if (!GOOGLE_CLIENT_ID) return;
  const tryInit = () => {
    if (!window.google?.accounts?.id) return setTimeout(tryInit, 300);
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      ux_mode: 'popup',
    });
    const el = document.getElementById('google-signin-btn');
    if (el) {
      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: el.clientWidth || 320,
      });
    }
  };
  tryInit();
}

function initApple() {
  if (!APPLE_SERVICE_ID) return;
  const tryInit = () => {
    if (!window.AppleID?.auth) return setTimeout(tryInit, 300);
    window.AppleID.auth.init({
      clientId: APPLE_SERVICE_ID,
      scope: 'name email',
      redirectURI: APPLE_REDIRECT_URI,
      usePopup: true,
    });
  };
  tryInit();
}

async function handleGoogleCredential(response) {
  loading.value = true;
  error.value = '';
  try {
    const user = await auth.loginWithGoogle(response.credential);
    if (user.role !== 'customer') {
      error.value = 'This app is for customers.';
      await auth.logout();
      return;
    }
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Google sign-in failed';
  } finally {
    loading.value = false;
  }
}

async function signInWithApple() {
  if (!window.AppleID?.auth) {
    error.value = 'Apple sign-in is not available yet — try again in a moment.';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const data = await window.AppleID.auth.signIn();
    const idToken = data?.authorization?.id_token;
    const fullName = data?.user?.name ? `${data.user.name.firstName || ''} ${data.user.name.lastName || ''}`.trim() : undefined;
    if (!idToken) throw new Error('Apple did not return an ID token');
    const user = await auth.loginWithApple({ idToken, fullName });
    if (user.role !== 'customer') {
      error.value = 'This app is for customers.';
      await auth.logout();
      return;
    }
    router.push('/');
  } catch (e) {
    if (e?.error === 'popup_closed_by_user') return;
    error.value = e.response?.data?.error?.message || e.message || 'Apple sign-in failed';
  } finally {
    loading.value = false;
  }
}

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const user = await auth.login(email.value, password.value);
    if (user.role !== 'customer') {
      error.value = 'This app is for customers. Use the merchant console instead.';
      await auth.logout();
      return;
    }
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

    <div class="mt-8 space-y-2.5 max-w-sm mx-auto w-full">
      <div v-if="GOOGLE_CLIENT_ID" id="google-signin-btn" class="w-full flex justify-center"></div>
      <button v-else type="button" disabled class="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-ink-300/20 text-ink-300 font-semibold">
        <i class="fa-brands fa-google"></i> Google (not configured)
      </button>

      <button
        v-if="APPLE_SERVICE_ID"
        type="button"
        @click="signInWithApple"
        :disabled="loading"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-black text-white font-semibold active:scale-[0.99]"
      >
        <i class="fa-brands fa-apple text-lg"></i> Continue with Apple
      </button>
      <button v-else type="button" disabled class="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-ink-300/20 text-ink-300 font-semibold">
        <i class="fa-brands fa-apple"></i> Apple (not configured)
      </button>
    </div>

    <div class="my-5 max-w-sm mx-auto w-full flex items-center gap-3 text-[11px] uppercase tracking-wider text-ink-300">
      <div class="flex-1 h-px bg-cream-200"></div>
      <span>or with email</span>
      <div class="flex-1 h-px bg-cream-200"></div>
    </div>

    <form @submit.prevent="submit" class="space-y-3 max-w-sm mx-auto w-full">
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
