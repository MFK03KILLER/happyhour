<script setup>
// Mounted globally inside App.vue. Watches the logged-in user; if they are a
// vendor or merchant_staff AND their `acceptedMerchantTerms.version` is below
// the current published Merchant TOS version, opens a forced TermsModal that
// blocks the rest of the UI until they accept (or decline and sign out).

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import TermsModal from './TermsModal.vue';

const auth = useAuthStore();
const router = useRouter();
const showForced = ref(false);
const currentVersion = ref(null);
const checked = ref(false);

const needsAccept = computed(() => {
  const u = auth.user;
  if (!u) return false;
  if (!['vendor', 'merchant_staff'].includes(u.role)) return false;
  if (currentVersion.value == null) return false;
  const accepted = u.acceptedMerchantTerms?.version;
  return accepted !== currentVersion.value;
});

async function loadCurrentVersion() {
  try {
    const { data } = await client.get('/public/terms', { params: { audience: 'merchant' } });
    currentVersion.value = data.version;
  } catch {}
  finally { checked.value = true; }
}

// Re-check whenever user changes (login, fetchMe)
watch(() => auth.user, async (u) => {
  if (!u || !['vendor', 'merchant_staff'].includes(u.role)) {
    showForced.value = false;
    return;
  }
  if (currentVersion.value == null) await loadCurrentVersion();
  showForced.value = needsAccept.value;
}, { immediate: true });

async function onAccept(version) {
  try {
    const url = auth.user?.role === 'vendor' ? '/vendor/accept-terms' : '/merchant/accept-terms';
    await client.post(url, { version });
    // Refresh user (so acceptedMerchantTerms is updated in store)
    await auth.fetchMe();
    showForced.value = false;
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Could not record acceptance — please retry');
  }
}

async function onDecline() {
  // Decline = sign out (they cannot continue without agreement)
  await auth.logout();
  router.push('/login');
  showForced.value = false;
}
</script>

<template>
  <TermsModal
    :show="showForced"
    audience="merchant"
    :require-accept="true"
    @accept="onAccept"
    @close="onDecline"
  />
</template>
