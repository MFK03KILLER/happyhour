<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const vendors = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({
  vendorId: '', title: '', subtitle: '', description: '',
  heroImageUrl: '', offerType: 'BUNDLE', priceUSD: 0,
  maxUsesPerCustomer: 1, categorySlug: 'restaurants',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
});

async function load() {
  loading.value = true;
  try {
    const [c, v] = await Promise.all([
      client.get('/admin/coupons'),
      client.get('/admin/vendors'),
    ]);
    items.value = c.data.items;
    vendors.value = v.data.items;
  } finally { loading.value = false; }
}

async function save() {
  await client.post('/admin/coupons', form.value);
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('Delete coupon?')) return;
  await client.delete(`/admin/coupons/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Coupons</h1>
        <p class="text-ink-500 mt-1">Offers shown to customers</p>
      </div>
      <button @click="showForm = true" class="ios-button-primary">+ New coupon</button>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="ios-card h-44 animate-pulse"></div>
    </div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="c in items" :key="c._id" class="ios-card overflow-hidden">
        <img v-if="c.heroImageUrl" :src="c.heroImageUrl" class="w-full h-32 object-cover" />
        <div class="p-4">
          <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider truncate">{{ c.vendorId?.name }}</div>
          <div class="font-bold mt-0.5 truncate">{{ c.title }}</div>
          <div class="text-sm text-ink-500 truncate">{{ c.subtitle }}</div>
          <div class="flex items-center justify-between mt-3">
            <span class="text-sm font-bold text-teal-700">${{ c.priceUSD.toFixed(2) }}</span>
            <button @click="del(c._id)" class="text-sm text-coral-600 font-semibold">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New coupon</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <select v-model="form.vendorId" class="input" required>
            <option value="">Select vendor</option>
            <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
          </select>
          <input v-model="form.title" class="input" placeholder="Title (e.g. Morning Slices)" required />
          <input v-model="form.subtitle" class="input" placeholder="Subtitle" />
          <textarea v-model="form.description" class="input" rows="3" placeholder="Description"></textarea>
          <input v-model="form.heroImageUrl" class="input" placeholder="Hero image URL" />
          <div class="grid grid-cols-2 gap-2">
            <select v-model="form.offerType" class="input">
              <option value="BUNDLE">Bundle</option>
              <option value="BOGO">BOGO</option>
              <option value="PERCENT_OFF">% off</option>
              <option value="FLAT_OFF">Flat $ off</option>
              <option value="FREE_ITEM">Free item</option>
            </select>
            <select v-model="form.categorySlug" class="input">
              <option value="restaurants">Restaurants</option>
              <option value="cafes">Cafés</option>
              <option value="bars">Bars</option>
              <option value="entertainment">Entertainment</option>
              <option value="fitness">Fitness</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model.number="form.priceUSD" type="number" min="0" step="0.5" class="input" placeholder="Price USD" />
            <input v-model.number="form.maxUsesPerCustomer" type="number" min="1" class="input" placeholder="Max uses" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="form.validFrom" type="date" class="input" />
            <input v-model="form.validUntil" type="date" class="input" />
          </div>
          <button type="submit" class="ios-button-primary w-full">Create</button>
        </form>
      </div>
    </div>
  </div>
</template>
