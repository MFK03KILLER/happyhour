<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const vendors = ref([]);
const merchants = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({ email: '', password: '', fullName: '', role: 'merchant_staff', vendorId: '', merchantId: '' });

async function load() {
  loading.value = true;
  try {
    const [u, v, m] = await Promise.all([
      client.get('/admin/users'),
      client.get('/admin/vendors'),
      client.get('/admin/merchants'),
    ]);
    items.value = u.data.items;
    vendors.value = v.data.items;
    merchants.value = m.data.items;
  } finally { loading.value = false; }
}

async function save() {
  const payload = { ...form.value };
  if (!payload.vendorId) delete payload.vendorId;
  if (!payload.merchantId) delete payload.merchantId;
  await client.post('/admin/users', payload);
  showForm.value = false;
  form.value = { email: '', password: '', fullName: '', role: 'merchant_staff', vendorId: '', merchantId: '' };
  await load();
}

function roleLabel(r) {
  return { admin: 'Admin', vendor: 'Vendor', merchant_staff: 'Merchant staff', customer: 'Customer' }[r] || r;
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
        <p class="text-ink-500 mt-1">All accounts on the platform</p>
      </div>
      <button @click="showForm = true" class="ios-button-primary">+ New user</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-16 animate-pulse"></div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="u in items" :key="u._id" class="p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center">{{ u.fullName?.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ u.fullName }}</div>
          <div class="text-sm text-ink-500 truncate">{{ u.email }}</div>
        </div>
        <span class="chip bg-cream-200 text-ink-700">{{ roleLabel(u.role) }}</span>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New user</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.fullName" class="input" placeholder="Full name" required />
          <input v-model="form.email" type="email" class="input" placeholder="Email" required />
          <input v-model="form.password" type="password" class="input" placeholder="Password" required minlength="8" />
          <select v-model="form.role" class="input">
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="merchant_staff">Merchant staff</option>
            <option value="customer">Customer</option>
          </select>
          <select v-if="form.role === 'vendor' || form.role === 'merchant_staff'" v-model="form.vendorId" class="input">
            <option value="">Select vendor</option>
            <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
          </select>
          <select v-if="form.role === 'merchant_staff'" v-model="form.merchantId" class="input">
            <option value="">Select merchant location</option>
            <option v-for="m in merchants" :key="m._id" :value="m._id">{{ m.name }}</option>
          </select>
          <button type="submit" class="ios-button-primary w-full">Create user</button>
        </form>
      </div>
    </div>
  </div>
</template>
