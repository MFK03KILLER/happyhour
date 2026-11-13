<script setup>
// Opened from the reset email (any role). Partner accounts sign in again in the
// merchant app afterwards.
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import client from '../api/client';

const route = useRoute();
const token = typeof route.query.token === 'string' ? route.query.token : '';
const password = ref('');
const confirm = ref('');
const show = ref(false);
const saving = ref(false);
const error = ref('');
const doneRole = ref('');

async function save() {
  error.value = '';
  if (password.value.length < 8) { error.value = 'Your password needs at least 8 characters.'; return; }
  if (password.value !== confirm.value) { error.value = "The passwords don't match."; return; }
  saving.value = true;
  try {
    const { data } = await client.post('/auth/reset-password', { token, password: password.value });
    doneRole.value = data.role || 'customer';
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not reset the password. Try again.';
  } finally { saving.value = false; }
}
</script>

<template>
  <div class="min-h-screen safe-top px-6 pb-10 bg-cream-100">
    <template v-if="!doneRole">
      <h1 class="mt-10 text-3xl font-bold tracking-tight">Choose a new password</h1>
      <p v-if="!token" class="mt-3 text-coral-700">This link is incomplete. Open the link from the email again, or <router-link to="/forgot-password" class="underline font-semibold">ask for a new one</router-link>.</p>
      <form v-else novalidate class="mt-6 space-y-3" @submit.prevent="save">
        <input v-model="password" :type="show ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="New password (8+ characters)" />
        <input v-model="confirm" :type="show ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="Confirm new password" />
        <label class="flex items-center gap-2 text-sm text-ink-500"><input v-model="show" type="checkbox" class="accent-teal-700" /> Show password</label>
        <div v-if="error" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ error }}</div>
        <button type="submit" :disabled="saving" class="ios-button-primary w-full disabled:opacity-60">{{ saving ? 'Saving…' : 'Save new password' }}</button>
      </form>
    </template>
    <template v-else>
      <div class="mt-12 w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><i class="fa-solid fa-check text-2xl"></i></div>
      <h1 class="mt-5 text-3xl font-bold tracking-tight">Password changed</h1>
      <p v-if="doneRole === 'customer'" class="mt-2 text-ink-500">You've been signed out everywhere. Sign in with your new password.</p>
      <p v-else class="mt-2 text-ink-500">Open the Happy Hour Merchant app and sign in with your new password.</p>
      <router-link v-if="doneRole === 'customer'" to="/login" class="ios-button-primary w-full mt-8 block text-center">Sign in</router-link>
    </template>
  </div>
</template>
