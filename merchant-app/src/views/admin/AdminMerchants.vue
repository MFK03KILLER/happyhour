<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const vendors = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({
  vendorId: '', name: '', category: 'restaurant', phone: '',
  address: { street: '', city: '', state: 'CA', zip: '', country: 'US' },
});

async function load() {
  loading.value = true;
  try {
    const [m, v] = await Promise.all([
      client.get('/admin/merchants'),
      client.get('/admin/vendors'),
    ]);
    items.value = m.data.items;
    vendors.value = v.data.items;
  } finally { loading.value = false; }
}

async function save() {
  await client.post('/admin/merchants', form.value);
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('Delete merchant?')) return;
  await client.delete(`/admin/merchants/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Merchants</h1>
        <p class="text-ink-500 mt-1">Individual store locations</p>
      </div>
      <button @click="showForm = true" class="ios-button-primary">+ New merchant</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-24 animate-pulse"></div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="m in items" :key="m._id" class="p-4 flex items-center gap-3">
        <img v-if="m.logoUrl" :src="m.logoUrl" class="w-12 h-12 rounded-xl object-cover bg-cream-200" />
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ m.name }}</div>
          <div class="text-sm text-ink-500 truncate">{{ m.address?.street }}, {{ m.address?.city }}, {{ m.address?.state }}</div>
          <div class="text-xs text-ink-300 mt-0.5">{{ m.vendorId?.name }} · {{ m.category }}</div>
        </div>
        <button @click="del(m._id)" class="text-sm text-coral-600 font-semibold">Delete</button>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New merchant</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <select v-model="form.vendorId" class="input" required>
            <option value="">Select vendor</option>
            <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
          </select>
          <input v-model="form.name" class="input" placeholder="Merchant name" required />
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
          <button type="submit" class="ios-button-primary w-full">Create</button>
        </form>
      </div>
    </div>
  </div>
</template>
