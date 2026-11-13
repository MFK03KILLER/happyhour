<script setup>
// Shown once after signing up with Apple or Google. Step 1: optional phone and
// marketing consent. Step 2: a password, so the same account also signs in on
// the website, where Sign in with Apple / Google may not be available.
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const step = ref(1);
const phone = ref(auth.user?.phone || '');
const marketingEmail = ref(false);
const marketingSms = ref(false);
const password = ref('');
const confirm = ref('');
const showPw = ref(false);
const saving = ref(false);
const error = ref('');

const phoneOk = computed(() => !phone.value.trim() || phone.value.replace(/\D/g, '').length >= 10);

function next() {
  error.value = '';
  if (!phoneOk.value) { error.value = 'Enter a 10-digit US phone number, or leave it empty.'; return; }
  step.value = 2;
}

function done() {
  const r = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
  router.replace(r.startsWith('/') && !r.startsWith('//') && r !== '/complete-account' ? r : '/');
}

async function save(withPassword) {
  error.value = '';
  if (withPassword) {
    if (password.value.length < 8) { error.value = 'Your password needs at least 8 characters.'; return; }
    if (password.value !== confirm.value) { error.value = "The passwords don't match."; return; }
  }
  saving.value = true;
  try {
    const { data } = await client.post('/auth/complete-profile', {
      phone: phone.value.trim() || undefined,
      marketingEmail: marketingEmail.value,
      marketingSms: marketingSms.value && !!phone.value.trim(),
      ...(withPassword ? { password: password.value } : {}),
    });
    auth.user = data.user;
    done();
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not save. Check your connection and try again.';
  } finally {
    saving.value = false;
  }
}

function later() {
  sessionStorage.setItem('hh_profile_later', '1');
  done();
}
</script>

<template>
  <div class="min-h-screen safe-top px-6 pb-10 flex flex-col bg-cream-100">
    <div class="pt-8 flex items-center gap-2 text-xs font-semibold text-ink-500">
      <span class="w-6 h-6 rounded-full flex items-center justify-center" :class="step === 1 ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-700'">1</span>
      <span>Contact</span>
      <span class="flex-1 h-px bg-ink-300/30"></span>
      <span class="w-6 h-6 rounded-full flex items-center justify-center" :class="step === 2 ? 'bg-teal-700 text-white' : 'bg-cream-200 text-ink-500'">2</span>
      <span>Password</span>
    </div>

    <template v-if="step === 1">
      <h1 class="mt-8 text-3xl font-bold tracking-tight">Finish your account</h1>
      <p class="mt-2 text-ink-500">Add a phone number if you'd like deals by text. It's optional.</p>

      <label class="block mt-6">
        <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Phone (optional)</span>
        <input v-model="phone" type="tel" inputmode="tel" autocomplete="tel" class="input mt-1" placeholder="(415) 555-0123" />
      </label>

      <div class="mt-5 space-y-3">
        <label class="flex items-start gap-3 ios-card p-4 cursor-pointer">
          <input v-model="marketingEmail" type="checkbox" class="mt-1 w-5 h-5 accent-teal-700" />
          <span class="text-sm"><b>Email me deals and discounts</b><br><span class="text-ink-500">New offers near you and member-only promotions.</span></span>
        </label>
        <label class="flex items-start gap-3 ios-card p-4 cursor-pointer" :class="!phone.trim() && 'opacity-50'">
          <input v-model="marketingSms" type="checkbox" :disabled="!phone.trim()" class="mt-1 w-5 h-5 accent-teal-700" />
          <span class="text-sm"><b>Text me promotions</b><br><span class="text-ink-500">Occasional texts about deals. Message &amp; data rates may apply. Reply STOP to opt out.</span></span>
        </label>
      </div>

      <div v-if="error" class="mt-4 rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ error }}</div>
      <button class="ios-button-primary w-full mt-6" @click="next">Continue</button>
    </template>

    <template v-else>
      <h1 class="mt-8 text-3xl font-bold tracking-tight">Create a password</h1>
      <p class="mt-2 text-ink-500">
        So you can also sign in on our website or any device with
        <b class="text-ink-900">{{ auth.user?.email }}</b>.
      </p>

      <div class="mt-6 space-y-3">
        <input v-model="password" :type="showPw ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="Password (8+ characters)" />
        <input v-model="confirm" :type="showPw ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="Confirm password" />
        <label class="flex items-center gap-2 text-sm text-ink-500"><input v-model="showPw" type="checkbox" class="accent-teal-700" /> Show password</label>
      </div>

      <div v-if="error" class="mt-4 rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ error }}</div>
      <button class="ios-button-primary w-full mt-6 disabled:opacity-60" :disabled="saving" @click="save(true)">{{ saving ? 'Saving…' : 'Save and continue' }}</button>
      <button class="w-full mt-2 py-3 text-sm font-semibold text-ink-500" :disabled="saving" @click="save(false)">Skip the password for now</button>
      <button class="w-full py-2 text-xs text-ink-300" @click="step = 1">← Back</button>
    </template>

    <button v-if="step === 1" class="mt-auto pt-6 text-sm text-ink-500" @click="later">Not now</button>
  </div>
</template>
