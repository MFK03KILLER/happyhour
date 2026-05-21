<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({
  name: '', category: 'restaurant', phone: '',
  address: { street: '', city: '', state: 'CA', zip: '', country: 'US' },
});

function can(p) { return (auth.user?.permissions || []).includes(p); }

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/vendor/merchants');
    items.value = data.items;
  } finally { loading.value = false; }
}

async function save() {
  await client.post('/vendor/merchants', form.value);
  showForm.value = false;
  form.value = { name: '', category: 'restaurant', phone: '', address: { street: '', city: '', state: 'CA', zip: '', country: 'US' } };
  await load();
}

async function del(id) {
  if (!confirm('Delete this location?')) return;
  await client.delete(`/vendor/merchants/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Locations</h1>
        <p class="text-ink-500 mt-1">Your physical store locations</p>
      </div>
      <button v-if="can('manage_merchants')" @click="showForm = true" class="ios-button-primary">+ New location</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-24 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-ink-500">No locations yet.</div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="m in items" :key="m._id" class="p-4 flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">{{ m.name.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ m.name }}</div>
          <div class="text-sm text-ink-500 truncate">{{ m.address?.street }}, {{ m.address?.city }}, {{ m.address?.state }}</div>
          <div class="text-xs text-ink-300 capitalize mt-0.5">{{ m.category }}</div>
        </div>
        <button v-if="can('manage_merchants')" @click="del(m._id)" class="text-sm text-coral-600 font-semibold">Delete</button>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New location</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.name" class="input" placeholder="Location name" required />
          <select v-model="form.category" class="input">
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Café</option>
            <option value="bar">Bar</option>
            <option value="retail">Retail</option>
            <option value="fitness">Fitness</option>
            <option value="beauty">Beauty</option>
            <option value="entertainment">Entertainment</option>
          </select>
          <input v-model="form.address.street" class="input" placeholder="Street" />
          <div class="grid grid-cols-3 gap-2">
            <input v-model="form.address.city" class="input col-span-2" placeholder="City" />
            <input v-model="form.address.state" class="input" placeholder="State" />
          </div>
          <input v-model="form.address.zip" class="input" placeholder="ZIP" />
          <input v-model="form.phone" class="input" placeholder="Phone" />
          <button type="submit" class="ios-button-primary w-full">Create location</button>
        </form>
      </div>
    </div>
  </div>
</template>
