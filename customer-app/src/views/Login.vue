<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Capacitor } from '@capacitor/core';
import client from '../api/client';
import TermsModal from '../components/TermsModal.vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showTerms = ref(false);
const termsVersion = ref(null);

const isWeb = Capacitor.getPlatform() === 'web';
// Google's web sign-in cannot run inside the app: it hands off to the system
// browser and the token never comes back (App Review 4.0 rejected exactly that).
// Web only until a native Google Sign-In plugin is added.
const GOOGLE_CLIENT_ID = isWeb ? (import.meta.env.VITE_GOOGLE_CLIENT_ID || '') : '';
// Native iOS signs in with Apple through the Capacitor plugin; the web uses Apple's JS popup.
const appleAvailable = ref(Capacitor.getPlatform() === 'ios');
const appleWebReady = ref(false);
const APPLE_WEB_CLIENT_ID = 'com.merchanthappyhourz.web';
const hasSocial = computed(() => !!GOOGLE_CLIENT_ID || appleAvailable.value || appleWebReady.value);

// Return to where the sign-in was asked for. Internal paths only - never an
// absolute or protocol-relative URL, which would be an open redirect.
function goAfterLogin() {
  const r = typeof route.query.redirect === 'string' ? route.query.redirect : '';
  router.push(r.startsWith('/') && !r.startsWith('//') ? r : '/');
}

onMounted(async () => {
  initGoogle();
  if (isWeb) initAppleWeb();
  try {
    const { data } = await client.get('/public/terms');
    termsVersion.value = data.version;
  } catch {}
});

function initGoogle() {
  if (!GOOGLE_CLIENT_ID) return;
  // Loaded on demand, only on the web - the native apps never contact Google.
  if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
    const sc = document.createElement('script');
    sc.src = 'https://accounts.google.com/gsi/client';
    sc.async = true;
    document.head.appendChild(sc);
  }
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

async function handleGoogleCredential(response) {
  loading.value = true;
  error.value = '';
  try {
    const user = await auth.loginWithGoogle(response.credential, termsVersion.value);
    if (user.role !== 'customer') {
      error.value = 'This app is for customers.';
      await auth.logout();
      return;
    }
    goAfterLogin();
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Google sign-in failed';
  } finally {
    loading.value = false;
  }
}

function initAppleWeb() {
  const boot = () => {
    if (!window.AppleID?.auth) return setTimeout(boot, 300);
    try {
      window.AppleID.auth.init({
        clientId: APPLE_WEB_CLIENT_ID,
        scope: 'name email',
        redirectURI: 'https://happyhourz.org/login',
        usePopup: true,
      });
      appleWebReady.value = true;
    } catch (e) { /* leave the button hidden if Apple JS fails to init */ }
  };
  if (window.AppleID?.auth) return boot();
  const sc = document.createElement('script');
  sc.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
  sc.async = true;
  sc.onload = boot;
  document.head.appendChild(sc);
}

async function signInAppleWeb() {
  loading.value = true;
  error.value = '';
  try {
    const data = await window.AppleID.auth.signIn();
    const idToken = data?.authorization?.id_token;
    if (!idToken) throw new Error('No Apple token');
    const nm = data?.user?.name || {};
    const fullName = [nm.firstName, nm.lastName].filter(Boolean).join(' ');
    const user = await auth.loginWithApple(idToken, fullName, termsVersion.value);
    if (user.role !== 'customer') {
      error.value = 'This app is for customers.';
      await auth.logout();
      return;
    }
    goAfterLogin();
  } catch (e) {
    // popup_closed_by_user / user cancels — stay silent
    const msg = (e && (e.error || e.message)) || '';
    if (/popup_closed|cancel|user_cancel|1001|1000/i.test(String(msg))) {
      // cancelled
    } else {
      error.value = e.response?.data?.error?.message || 'Apple sign-in failed';
    }
  } finally {
    loading.value = false;
  }
}

async function signInApple() {
  loading.value = true;
  error.value = '';
  try {
    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
    const res = await SignInWithApple.authorize({
      clientId: 'app.happyhour.customer',
      redirectURI: 'https://happyhourz.org/login',
      scopes: 'email name',
    });
    const r = res.response || {};
    const fullName = [r.givenName, r.familyName].filter(Boolean).join(' ');
    const user = await auth.loginWithApple(r.identityToken, fullName, termsVersion.value);
    if (user.role !== 'customer') {
      error.value = 'This app is for customers.';
      await auth.logout();
      return;
    }
    goAfterLogin();
  } catch (e) {
    // 1000/1001 are the user-cancelled codes; stay silent on those.
    const code = String(e && e.code || '');
    if (code === '1000' || code === '1001' || /cancel/i.test(e && e.message || '')) {
      // cancelled — no error shown
    } else {
      error.value = e.response?.data?.error?.message || 'Apple sign-in failed';
    }
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
    goAfterLogin();
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

    <div v-if="hasSocial" class="mt-8 space-y-2.5 max-w-sm mx-auto w-full">
      <div v-if="GOOGLE_CLIENT_ID" id="google-signin-btn" class="w-full flex justify-center"></div>
      <button v-if="appleAvailable" type="button" @click="signInApple" :disabled="loading" class="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-black text-white font-semibold active:scale-[.99] transition">
        <i class="fa-brands fa-apple text-lg"></i> Continue with Apple
      </button>
      <button v-else-if="appleWebReady" type="button" @click="signInAppleWeb" :disabled="loading" class="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-black text-white font-semibold active:scale-[.99] transition">
        <i class="fa-brands fa-apple text-lg"></i> Continue with Apple
      </button>
    </div>

    <div v-if="hasSocial" class="my-5 max-w-sm mx-auto w-full flex items-center gap-3 text-[11px] uppercase tracking-wider text-ink-300">
      <div class="flex-1 h-px bg-cream-200"></div>
      <span>or with email</span>
      <div class="flex-1 h-px bg-cream-200"></div>
    </div>

    <form @submit.prevent="submit" class="space-y-3 max-w-sm mx-auto w-full" :class="hasSocial ? '' : 'mt-8'">
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

    <div class="mt-6 max-w-sm mx-auto w-full text-center text-[11px] text-ink-500">
      By continuing you accept our
      <button type="button" @click="showTerms = true" class="text-teal-700 font-semibold underline">Terms of Service</button>.
    </div>

    <div class="mt-auto pt-8 text-center">
      <router-link :to="isWeb ? '/browse' : '/'" class="text-sm font-semibold text-teal-700">
        Browse deals without an account
      </router-link>
    </div>

    <TermsModal :show="showTerms" @close="showTerms = false" />
  </div>
</template>
