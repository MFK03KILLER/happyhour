<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);
const error = ref('');

function blankForm() {
  return {
    code: '', description: '',
    discountType: 'percent', discountValue: 10,
    audience: 'customer', appliesToTiers: [],
    minAmountUSD: 0, maxRedemptions: null, perUserLimit: 1,
    active: true, expiresAt: '',
  };
}
const form = ref(blankForm());

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/promo-codes');
    items.value = data.items;
  } finally { loading.value = false; }
}

function openNew() { editing.value = null; error.value = ''; form.value = blankForm(); showForm.value = true; }

function openEdit(p) {
  editing.value = p;
  error.value = '';
  form.value = {
    code: p.code,
    description: p.description || '',
    discountType: p.discountType,
    discountValue: p.discountValue,
    audience: p.audience || 'customer',
    appliesToTiers: [...(p.appliesToTiers || [])],
    minAmountUSD: p.minAmountUSD || 0,
    maxRedemptions: p.maxRedemptions ?? null,
    perUserLimit: p.perUserLimit || 1,
    active: p.active !== false,
    expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 10) : '',
  };
  showForm.value = true;
}

function toggleTier(t) {
  const i = form.value.appliesToTiers.indexOf(t);
  if (i >= 0) form.value.appliesToTiers.splice(i, 1);
  else form.value.appliesToTiers.push(t);
}

async function save() {
  error.value = '';
  const payload = {
    ...form.value,
    code: form.value.code.toUpperCase().trim(),
    discountValue: Number(form.value.discountValue),
    minAmountUSD: Number(form.value.minAmountUSD) || 0,
    perUserLimit: Number(form.value.perUserLimit) || 1,
    maxRedemptions: form.value.maxRedemptions === '' || form.value.maxRedemptions == null
      ? null : Number(form.value.maxRedemptions),
    expiresAt: form.value.expiresAt || null,
  };
  try {
    if (editing.value) await client.put(`/admin/promo-codes/${editing.value._id}`, payload);
    else await client.post('/admin/promo-codes', payload);
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not save promo code';
  }
}

async function del(p) {
  if (!confirm(`Delete promo code ${p.code}?`)) return;
  await client.delete(`/admin/promo-codes/${p._id}`);
  await load();
}

async function toggleActive(p) {
  await client.put(`/admin/promo-codes/${p._id}`, { active: !p.active });
  await load();
}

function discountLabel(p) {
  return p.discountType === 'percent' ? `${p.discountValue}% off` : `$${Number(p.discountValue).toFixed(2)} off`;
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Promo Codes</h1>
        <p class="text-ink-500 mt-1">Discounts customers can apply at checkout · {{ items.length }} total</p>
      </div>
      <button @click="openNew" class="ios-button-primary"><i class="fa-solid fa-plus mr-2"></i>New promo code</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-12 text-center text-ink-500">
      <i class="fa-solid fa-ticket text-4xl text-ink-300"></i>
      <div class="mt-3">No promo codes yet.</div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="p in items" :key="p._id" class="p-4 flex items-center gap-3" :class="p.active ? '' : 'opacity-60'">
        <div class="w-11 h-11 rounded-xl bg-coral-500/10 text-coral-600 font-bold flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-ticket"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="font-bold font-mono tracking-wide truncate">{{ p.code }}</div>
            <span class="chip text-[10px]" :class="p.active ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-ink-500'">{{ p.active ? 'Active' : 'Off' }}</span>
            <span class="chip bg-teal-50 text-teal-700 text-[10px]">{{ discountLabel(p) }}</span>
          </div>
          <div v-if="p.description" class="text-sm text-ink-500 truncate">{{ p.description }}</div>
          <div class="flex flex-wrap gap-1 mt-1">
            <span class="chip bg-cream-200 text-ink-700 text-[10px]">{{ p.audience }}</span>
            <span v-if="p.appliesToTiers?.length" class="chip bg-purple-50 text-purple-700 text-[10px]">{{ p.appliesToTiers.join(', ') }}</span>
            <span class="chip bg-cream-200 text-ink-500 text-[10px]">
              {{ p.timesRedeemed }}<span v-if="p.maxRedemptions != null">/{{ p.maxRedemptions }}</span> used
            </span>
            <span v-if="p.expiresAt" class="chip bg-amber-50 text-amber-700 text-[10px]">exp {{ new Date(p.expiresAt).toLocaleDateString() }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button @click="toggleActive(p)" class="text-sm font-semibold" :class="p.active ? 'text-amber-600' : 'text-green-700'" :title="p.active ? 'Disable' : 'Enable'">
            <i class="fa-solid" :class="p.active ? 'fa-pause' : 'fa-play'"></i>
          </button>
          <button @click="openEdit(p)" class="text-sm font-semibold text-teal-700" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button @click="del(p)" class="text-sm font-semibold text-coral-600" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'Edit promo code' : 'New promo code' }}</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.code" class="input font-mono uppercase" placeholder="CODE e.g. WELCOME20" required />
          <input v-model="form.description" class="input" placeholder="Internal description (optional)" />

          <div class="flex gap-2">
            <select v-model="form.discountType" class="input flex-1">
              <option value="percent">Percent off (%)</option>
              <option value="fixed">Fixed amount off ($)</option>
            </select>
            <input v-model.number="form.discountValue" type="number" min="0" step="0.01" class="input w-28" :placeholder="form.discountType === 'percent' ? '%' : '$'" required />
          </div>

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">Applies to</div>
          <select v-model="form.audience" class="input">
            <option value="customer">Customer plans</option>
            <option value="merchant">Merchant plans</option>
            <option value="all">All plans</option>
          </select>
          <div class="flex gap-2">
            <label class="flex-1 flex items-center gap-2 p-2 rounded-xl text-sm cursor-pointer" :class="form.appliesToTiers.includes('gold') ? 'bg-teal-50 text-teal-800 font-semibold' : 'bg-cream-100 text-ink-500'">
              <input type="checkbox" :checked="form.appliesToTiers.includes('gold')" @change="toggleTier('gold')" /> Gold
            </label>
            <label class="flex-1 flex items-center gap-2 p-2 rounded-xl text-sm cursor-pointer" :class="form.appliesToTiers.includes('premium') ? 'bg-teal-50 text-teal-800 font-semibold' : 'bg-cream-100 text-ink-500'">
              <input type="checkbox" :checked="form.appliesToTiers.includes('premium')" @change="toggleTier('premium')" /> Premium
            </label>
          </div>
          <p class="text-xs text-ink-300">Leave both unchecked to apply to every tier.</p>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-ink-500">Max total uses</label>
              <input v-model="form.maxRedemptions" type="number" min="0" class="input" placeholder="Unlimited" />
            </div>
            <div>
              <label class="text-xs text-ink-500">Uses per user</label>
              <input v-model.number="form.perUserLimit" type="number" min="1" class="input" />
            </div>
            <div>
              <label class="text-xs text-ink-500">Min amount ($)</label>
              <input v-model.number="form.minAmountUSD" type="number" min="0" step="0.01" class="input" />
            </div>
            <div>
              <label class="text-xs text-ink-500">Expires</label>
              <input v-model="form.expiresAt" type="date" class="input" />
            </div>
          </div>

          <label class="flex items-center gap-2 pt-1">
            <input type="checkbox" v-model="form.active" class="w-5 h-5 accent-teal-600" />
            <span class="text-sm">Active</span>
          </label>

          <div v-if="error" class="text-coral-600 text-sm">{{ error }}</div>
          <button type="submit" class="ios-button-primary w-full mt-2">{{ editing ? 'Save changes' : 'Create promo code' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
