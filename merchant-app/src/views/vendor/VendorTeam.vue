<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const merchants = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({ email: '', password: '', fullName: '', merchantId: '', permissions: ['scan_only'] });
const lastCreated = ref(null);

const PERMS = [
  { key: 'scan_only', label: 'Scan only', help: 'Can scan customer QR codes (cashier level)' },
  { key: 'view_stats', label: 'View stats', help: 'Can see redemption + revenue stats' },
  { key: 'manage_coupons', label: 'Manage coupons', help: 'Create, edit, delete coupons' },
  { key: 'manage_merchants', label: 'Manage locations', help: 'Add new store locations' },
  { key: 'manage_team', label: 'Manage team', help: 'Add/remove team members' },
];

async function load() {
  loading.value = true;
  try {
    const [t, m] = await Promise.all([
      client.get('/vendor/team'),
      client.get('/vendor/merchants'),
    ]);
    items.value = t.data.items;
    merchants.value = m.data.items;
  } finally { loading.value = false; }
}

async function save() {
  const payload = { ...form.value };
  if (!payload.merchantId) delete payload.merchantId;
  const { data } = await client.post('/vendor/team', payload);
  lastCreated.value = { email: payload.email, password: payload.password };
  form.value = { email: '', password: '', fullName: '', merchantId: '', permissions: ['scan_only'] };
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('Remove this team member?')) return;
  await client.delete(`/vendor/team/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Team</h1>
        <p class="text-ink-500 mt-1">Staff who can access your console + scanner</p>
      </div>
      <button @click="showForm = true" class="ios-button-primary">+ New team member</button>
    </div>

    <div v-if="lastCreated" class="mt-6 ios-card p-5 bg-teal-50 border border-teal-600/30">
      <div class="font-bold text-teal-700">Team member created!</div>
      <p class="text-sm text-ink-700 mt-1">Share these credentials securely:</p>
      <div class="mt-3 font-mono text-sm space-y-1">
        <div><span class="text-ink-500">Email:</span> {{ lastCreated.email }}</div>
        <div><span class="text-ink-500">Password:</span> {{ lastCreated.password }}</div>
      </div>
      <button @click="lastCreated = null" class="text-sm text-teal-700 font-semibold mt-3">Dismiss</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-16 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-ink-500">No team yet.</div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="u in items" :key="u._id" class="p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold">{{ u.fullName?.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ u.fullName }}</div>
          <div class="text-sm text-ink-500 truncate">{{ u.email }}</div>
          <div class="flex gap-1 mt-1 flex-wrap">
            <span v-for="p in (u.permissions || [])" :key="p" class="chip bg-cream-200 text-ink-700 text-[10px]">{{ p }}</span>
          </div>
        </div>
        <button @click="del(u._id)" class="text-sm text-coral-600 font-semibold">Remove</button>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New team member</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.fullName" class="input" placeholder="Full name" required />
          <input v-model="form.email" type="email" class="input" placeholder="Email (their login)" required />
          <input v-model="form.password" type="text" class="input" placeholder="Password (deliver to them)" required minlength="8" />
          <select v-model="form.merchantId" class="input">
            <option value="">Any location (vendor-wide)</option>
            <option v-for="m in merchants" :key="m._id" :value="m._id">{{ m.name }}</option>
          </select>

          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider mb-2">Permissions</div>
            <div class="space-y-2">
              <label v-for="p in PERMS" :key="p.key" class="flex items-start gap-3 ios-card p-3 cursor-pointer">
                <input type="checkbox" :value="p.key" v-model="form.permissions" class="mt-0.5" />
                <div>
                  <div class="font-semibold text-sm">{{ p.label }}</div>
                  <div class="text-xs text-ink-500">{{ p.help }}</div>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" class="ios-button-primary w-full">Create team member</button>
        </form>
      </div>
    </div>
  </div>
</template>
