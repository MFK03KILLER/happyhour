<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import { goBack } from '../utils/goBack';

const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();
const hasPassword = computed(() => auth.user?.hasPassword !== false);
const current = ref('');
const next = ref('');
const confirm = ref('');
const show = ref(false);
const saving = ref(false);
const error = ref('');

async function save() {
  error.value = '';
  if (hasPassword.value && !current.value) { error.value = 'Enter your current password.'; return; }
  if (next.value.length < 8) { error.value = 'Your new password needs at least 8 characters.'; return; }
  if (next.value !== confirm.value) { error.value = "The new passwords don't match."; return; }
  saving.value = true;
  try {
    await client.post('/auth/change-password', { currentPassword: current.value, newPassword: next.value });
    await auth.fetchMe().catch(() => {});
    toast.success('Your password was changed.', { title: 'Saved' });
    goBack(router, '/profile');
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not change the password. Try again.';
  } finally { saving.value = false; }
}
</script>

<template>
  <div class="min-h-screen pb-12 safe-top bg-cream-100">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <button aria-label="Back" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200" @click="goBack(router, '/profile')">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">{{ hasPassword ? 'Change password' : 'Set a password' }}</div>
    </header>
    <form novalidate class="px-5 mt-6 space-y-3" @submit.prevent="save">
      <p class="text-sm text-ink-500">Signed in as <b class="text-ink-900">{{ auth.user?.email }}</b></p>
      <input v-if="hasPassword" v-model="current" :type="show ? 'text' : 'password'" autocomplete="current-password" class="input" placeholder="Current password" />
      <input v-model="next" :type="show ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="New password (8+ characters)" />
      <input v-model="confirm" :type="show ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="Confirm new password" />
      <label class="flex items-center gap-2 text-sm text-ink-500"><input v-model="show" type="checkbox" class="accent-teal-700" /> Show passwords</label>
      <div v-if="error" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ error }}</div>
      <button type="submit" :disabled="saving" class="ios-button-primary w-full disabled:opacity-60">{{ saving ? 'Saving…' : 'Save password' }}</button>
      <router-link v-if="hasPassword" :to="{ path: '/forgot-password', query: { email: auth.user?.email } }" class="block text-center text-sm font-semibold text-teal-700 pt-2">Forgot your current password?</router-link>
    </form>
  </div>
</template>
