<script setup>
// Change your own password: staff, owners and admins. Partners get a password
// from us at onboarding and should change it to their own.
import { ref } from 'vue';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import { notify } from '../lib/notify';

const emit = defineEmits(['close']);
const auth = useAuthStore();
const current = ref('');
const next = ref('');
const confirm = ref('');
const show = ref(false);
const saving = ref(false);
const error = ref('');

async function save() {
  error.value = '';
  if (!current.value) { error.value = 'Enter your current password.'; return; }
  if (next.value.length < 8) { error.value = 'Your new password needs at least 8 characters.'; return; }
  if (next.value !== confirm.value) { error.value = "The new passwords don't match."; return; }
  saving.value = true;
  try {
    await client.post('/auth/change-password', { currentPassword: current.value, newPassword: next.value }, { silent: true });
    notify('Your password was changed.', 'success');
    emit('close');
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not change the password. Try again.';
  } finally { saving.value = false; }
}
</script>

<template>
  <teleport to="body">
    <div class="fixed inset-0 z-[60] bg-black/40 flex items-end md:items-center justify-center" @click.self="emit('close')">
      <div class="bg-white text-ink-900 rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div class="flex items-center justify-between">
          <div class="text-xl font-bold">Change password</div>
          <button class="text-ink-500" @click="emit('close')">Cancel</button>
        </div>
        <p class="text-sm text-ink-500 mt-1">{{ auth.user?.email }}</p>
        <form novalidate class="mt-4 space-y-3" @submit.prevent="save">
          <input v-model="current" :type="show ? 'text' : 'password'" autocomplete="current-password" class="input" placeholder="Current password" />
          <input v-model="next" :type="show ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="New password (8+ characters)" />
          <input v-model="confirm" :type="show ? 'text' : 'password'" autocomplete="new-password" class="input" placeholder="Confirm new password" />
          <label class="flex items-center gap-2 text-sm text-ink-500"><input v-model="show" type="checkbox" class="accent-teal-700" /> Show passwords</label>
          <div v-if="error" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ error }}</div>
          <button type="submit" :disabled="saving" class="ios-button-primary w-full disabled:opacity-60">{{ saving ? 'Saving…' : 'Save password' }}</button>
        </form>
      </div>
    </div>
  </teleport>
</template>
