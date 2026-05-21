<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({
  name: '', description: '', contactEmail: '', logoUrl: '',
  ownerFullName: '', ownerEmail: '', ownerPassword: '',
});
const lastCreated = ref(null);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/vendors');
    items.value = data.items;
  } finally { loading.value = false; }
}

async function save() {
  const payload = { ...form.value };
  if (!payload.ownerEmail) {
    delete payload.ownerEmail; delete payload.ownerPassword; delete payload.ownerFullName;
  }
  const { data } = await client.post('/admin/vendors', payload);
  if (data.owner) {
    lastCreated.value = { email: form.value.ownerEmail, password: form.value.ownerPassword, name: data.vendor.name };
  }
  showForm.value = false;
  form.value = { name: '', description: '', contactEmail: '', logoUrl: '', ownerFullName: '', ownerEmail: '', ownerPassword: '' };
  await load();
}

async function del(id) {
  if (!confirm('Delete vendor?')) return;
  await client.delete(`/admin/vendors/${id}`);
  await load();
}

function genPwd() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  form.value.ownerPassword = p;
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Vendors</h1>
        <p class="text-ink-500 mt-1">Parent companies / brands</p>
      </div>
      <button @click="showForm = true" class="ios-button-primary">+ New vendor</button>
    </div>

    <div v-if="lastCreated" class="mt-6 ios-card p-5 bg-teal-50 border border-teal-600/30">
      <div class="font-bold text-teal-700">Vendor + owner created!</div>
      <p class="text-sm text-ink-700 mt-1">Deliver these credentials to <strong>{{ lastCreated.name }}</strong>:</p>
      <div class="mt-3 font-mono text-sm space-y-1">
        <div><span class="text-ink-500">Login:</span> {{ lastCreated.email }}</div>
        <div><span class="text-ink-500">Password:</span> {{ lastCreated.password }}</div>
      </div>
      <p class="text-xs text-ink-500 mt-3">They'll be redirected to the Vendor console on login and can manage their merchants, coupons, and team.</p>
      <button @click="lastCreated = null" class="text-sm text-teal-700 font-semibold mt-3">Dismiss</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="v in items" :key="v._id" class="p-4 flex items-center gap-3">
        <img v-if="v.logoUrl" :src="v.logoUrl" class="w-12 h-12 rounded-full object-cover bg-cream-200" />
        <div v-else class="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center font-bold text-ink-500">{{ v.name.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ v.name }}</div>
          <div class="text-sm text-ink-500 truncate">{{ v.description }}</div>
        </div>
        <button @click="del(v._id)" class="text-sm text-coral-600 font-semibold">Delete</button>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New vendor</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Brand info</div>
          <input v-model="form.name" class="input" placeholder="Vendor name (e.g. Pizza My Heart)" required />
          <input v-model="form.description" class="input" placeholder="Short description" />
          <input v-model="form.contactEmail" type="email" class="input" placeholder="Contact email" />
          <input v-model="form.logoUrl" type="url" class="input" placeholder="Logo URL" />

          <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider mt-4 pt-3 border-t border-cream-200">Owner account (optional)</div>
          <p class="text-xs text-ink-500">Creates a vendor user with full permissions. Deliver creds to the business owner.</p>
          <input v-model="form.ownerFullName" class="input" placeholder="Owner name" />
          <input v-model="form.ownerEmail" type="email" class="input" placeholder="Owner email (their login)" />
          <div class="flex gap-2">
            <input v-model="form.ownerPassword" type="text" class="input flex-1" placeholder="Password" minlength="8" />
            <button type="button" @click="genPwd" class="ios-card px-3 text-sm font-semibold text-teal-700 active:scale-95">Generate</button>
          </div>

          <button type="submit" class="ios-button-primary w-full mt-2">Create vendor</button>
        </form>
      </div>
    </div>
  </div>
</template>
