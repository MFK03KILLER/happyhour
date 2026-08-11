<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useToastStore } from '../stores/toast';
import { useGeolocation } from '../composables/useGeolocation';

const router = useRouter();
const toast = useToastStore();
const geo = useGeolocation();
const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);
const saving = ref(false);
const locating = ref(false);

function blankForm() {
  return { label: 'Home', street: '', city: 'San Francisco', state: 'CA', zip: '', phone: '', notes: '', lat: null, lng: null, isDefault: false };
}
const form = ref(blankForm());

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/customer/addresses');
    items.value = data.items || [];
  } finally { loading.value = false; }
}

function openNew() { editing.value = null; form.value = blankForm(); showForm.value = true; }
function openEdit(a) {
  editing.value = a;
  form.value = { label: a.label, street: a.street, city: a.city, state: a.state, zip: a.zip, phone: a.phone || '', notes: a.notes || '', lat: a.lat ?? null, lng: a.lng ?? null, isDefault: a.isDefault };
  showForm.value = true;
}

// Attach the device's GPS position so delivery distance/fee can be computed.
async function useMyLocation() {
  locating.value = true;
  try {
    const pos = await geo.request();
    if (pos) {
      form.value.lat = pos.lat;
      form.value.lng = pos.lng;
      toast.success('Location attached — delivery fees will be exact.', { title: 'Located 📍' });
    } else {
      toast.warning('Could not get your location. You can still save the address.', { title: 'No GPS' });
    }
  } catch {
    toast.warning('Could not get your location. You can still save the address.', { title: 'No GPS' });
  } finally { locating.value = false; }
}

async function save() {
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (payload.lat == null) delete payload.lat;
    if (payload.lng == null) delete payload.lng;
    if (editing.value) await client.put(`/customer/addresses/${editing.value._id}`, payload);
    else await client.post('/customer/addresses', payload);
    showForm.value = false;
    await load();
  } catch (e) {
    toast.error(e.response?.data?.error?.message || 'Could not save address', { title: 'Save failed' });
  } finally { saving.value = false; }
}

async function del(a) {
  if (!confirm(`Delete "${a.label}"?`)) return;
  await client.delete(`/customer/addresses/${a._id}`);
  await load();
}

async function makeDefault(a) {
  await client.put(`/customer/addresses/${a._id}`, { isDefault: true });
  await load();
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen pb-12 safe-top bg-cream-100">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Saved addresses</div>
    </header>

    <div class="px-5 mt-5">
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 2" :key="i" class="ios-card h-20 animate-pulse"></div>
      </div>

      <div v-else-if="items.length === 0" class="mt-12 text-center">
        <div class="mx-auto w-20 h-20 rounded-3xl bg-cream-200 flex items-center justify-center">
          <i class="fa-solid fa-location-dot text-3xl text-ink-300"></i>
        </div>
        <div class="mt-4 font-semibold">No addresses yet</div>
        <p class="text-ink-500 text-sm mt-1">Add one to get surprise bags delivered.</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="a in items" :key="a._id" class="ios-card p-4 flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i class="fa-solid" :class="a.label?.toLowerCase() === 'work' ? 'fa-briefcase' : 'fa-house'"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold">{{ a.label }}</span>
              <span v-if="a.isDefault" class="chip bg-teal-600 text-white text-[10px]">Default</span>
              <span v-if="a.lat != null" class="chip bg-cream-200 text-ink-500 text-[10px]"><i class="fa-solid fa-location-crosshairs text-[9px]"></i> GPS</span>
            </div>
            <div class="text-sm text-ink-700 mt-0.5">{{ a.street }}</div>
            <div class="text-xs text-ink-500">{{ [a.city, a.state, a.zip].filter(Boolean).join(', ') }}</div>
            <div v-if="a.notes" class="text-xs text-ink-300 mt-0.5 italic truncate">{{ a.notes }}</div>
            <div class="flex gap-3 mt-2">
              <button v-if="!a.isDefault" @click="makeDefault(a)" class="text-xs font-semibold text-teal-700">Set default</button>
              <button @click="openEdit(a)" class="text-xs font-semibold text-ink-500">Edit</button>
              <button @click="del(a)" class="text-xs font-semibold text-coral-600">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <button @click="openNew" class="ios-button-primary w-full mt-5">
        <i class="fa-solid fa-plus mr-2"></i>Add address
      </button>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'Edit address' : 'New address' }}</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <div class="flex gap-2">
            <button type="button" v-for="l in ['Home','Work','Other']" :key="l" @click="form.label = l"
              class="flex-1 py-2 rounded-full text-sm font-semibold border-2 transition"
              :class="form.label === l ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-ink-300/20 text-ink-500'">
              {{ l }}
            </button>
          </div>
          <input v-model="form.street" class="input" placeholder="Street address" required />
          <div class="grid grid-cols-2 gap-2">
            <input v-model="form.city" class="input" placeholder="City" />
            <input v-model="form.zip" class="input" placeholder="ZIP" />
          </div>
          <input v-model="form.phone" type="tel" class="input" placeholder="Phone for the courier (optional)" />
          <input v-model="form.notes" class="input" placeholder="Instructions — gate code, leave at door…" />

          <button type="button" @click="useMyLocation" :disabled="locating"
            class="w-full py-2.5 rounded-2xl text-sm font-semibold border-2 border-teal-600/30 text-teal-700 active:scale-[0.99]">
            <i class="fa-solid fa-location-crosshairs mr-1"></i>
            {{ locating ? 'Locating…' : (form.lat != null ? 'Location attached ✓ (tap to refresh)' : 'Use my current location') }}
          </button>
          <p class="text-[11px] text-ink-300 text-center">Attaching GPS makes the delivery fee exact. Optional.</p>

          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="form.isDefault" class="w-5 h-5 accent-teal-600" />
            <span class="text-sm">Set as default</span>
          </label>

          <button type="submit" class="ios-button-primary w-full" :disabled="saving">
            {{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Add address') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
