<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({ name: '', description: '', contactEmail: '', logoUrl: '' });

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/vendors');
    items.value = data.items;
  } finally { loading.value = false; }
}

async function save() {
  await client.post('/admin/vendors', form.value);
  showForm.value = false;
  form.value = { name: '', description: '', contactEmail: '', logoUrl: '' };
  await load();
}

async function del(id) {
  if (!confirm('Delete vendor?')) return;
  await client.delete(`/admin/vendors/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Vendors</h1>
        <p class="text-ink-500 mt-1">Parent companies / chains</p>
      </div>
      <button @click="showForm = true" class="ios-button-primary">+ New vendor</button>
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
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New vendor</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.name" class="input" placeholder="Vendor name" required />
          <input v-model="form.description" class="input" placeholder="Short description" />
          <input v-model="form.contactEmail" type="email" class="input" placeholder="Contact email" />
          <input v-model="form.logoUrl" type="url" class="input" placeholder="Logo URL" />
          <button type="submit" class="ios-button-primary w-full">Create</button>
        </form>
      </div>
    </div>
  </div>
</template>
