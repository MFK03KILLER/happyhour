<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const items = ref([]);
const vendors = ref([]);
const merchants = ref([]);
const roles = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);
const search = ref('');
const filterRole = ref('');
const lastCreated = ref(null);

function blankForm() {
  return { email: '', password: '', fullName: '', role: 'customer', vendorId: '', merchantId: '', roleSlug: '', status: 'active', permissions: [] };
}
const form = ref(blankForm());

const ALL_PERMS = [
  'manage_coupons', 'view_coupons',
  'manage_merchants', 'view_merchants',
  'manage_team', 'view_team',
  'manage_hours', 'manage_profile',
  'view_stats', 'view_payments',
  'scan_coupons',
];

async function load() {
  loading.value = true;
  try {
    const [u, v, m, r] = await Promise.all([
      client.get('/admin/users', { params: { q: search.value, role: filterRole.value } }),
      client.get('/admin/vendors'),
      client.get('/admin/merchants'),
      client.get('/admin/roles'),
    ]);
    items.value = u.data.items;
    vendors.value = v.data.items;
    merchants.value = m.data.items;
    roles.value = r.data.items;
  } finally { loading.value = false; }
}

function openNew() { editing.value = null; form.value = blankForm(); showForm.value = true; }

function openEdit(u) {
  editing.value = u;
  form.value = {
    email: u.email || '',
    password: '',
    fullName: u.fullName || '',
    role: u.role,
    vendorId: u.vendorId?._id || u.vendorId || '',
    merchantId: u.merchantId?._id || u.merchantId || '',
    roleSlug: u.roleSlug || '',
    status: u.status || 'active',
    permissions: u.permissions || [],
  };
  showForm.value = true;
}

async function save() {
  const payload = { ...form.value };
  if (!payload.vendorId) delete payload.vendorId;
  if (!payload.merchantId) delete payload.merchantId;
  if (!payload.roleSlug) delete payload.roleSlug;
  if (editing.value) {
    if (!payload.password) delete payload.password;
    delete payload.email;
    await client.put(`/admin/users/${editing.value._id}`, payload);
  } else {
    await client.post('/admin/users', payload);
    if (payload.password) {
      lastCreated.value = { email: payload.email, password: payload.password, name: payload.fullName };
    }
  }
  showForm.value = false;
  await load();
}

async function del(u) {
  if (u._id === auth.user?._id) return alert('Cannot delete your own account');
  if (!confirm(`Permanently delete ${u.fullName}?`)) return;
  await client.delete(`/admin/users/${u._id}`);
  await load();
}

async function toggleStatus(u) {
  const next = u.status === 'active' ? 'suspended' : 'active';
  if (!confirm(`${next === 'suspended' ? 'Suspend' : 'Activate'} ${u.fullName}?`)) return;
  await client.put(`/admin/users/${u._id}`, { status: next });
  await load();
}

function togglePerm(p) {
  const i = form.value.permissions.indexOf(p);
  if (i >= 0) form.value.permissions.splice(i, 1);
  else form.value.permissions.push(p);
}

function genPwd() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  form.value.password = p;
}

function roleLabel(r) { return { admin: 'Admin', vendor: 'Vendor', merchant_staff: 'Merchant Staff', customer: 'Customer' }[r] || r; }
function statusColor(s) { return { active: 'bg-green-100 text-green-700', suspended: 'bg-coral-500/10 text-coral-700', pending: 'bg-amber-100 text-amber-700' }[s] || 'bg-cream-200 text-ink-700'; }
function roleSlugName(slug) { const r = roles.value.find((x) => x.slug === slug); return r ? r.name : slug; }

const filteredRoles = computed(() => {
  if (form.value.role === 'vendor' || form.value.role === 'merchant_staff') {
    return roles.value.filter((r) => r.scope === 'vendor');
  }
  return [];
});

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
        <p class="text-ink-500 mt-1">All accounts · {{ items.length }} total</p>
      </div>
      <button @click="openNew" class="ios-button-primary"><i class="fa-solid fa-user-plus mr-2"></i>New user</button>
    </div>

    <div v-if="lastCreated" class="mt-4 ios-card p-4 bg-green-50 border border-green-300">
      <div class="font-bold text-green-700"><i class="fa-solid fa-circle-check mr-1"></i>User created</div>
      <p class="text-sm text-ink-700 mt-1">Share these credentials with <strong>{{ lastCreated.name }}</strong>:</p>
      <div class="mt-2 font-mono text-sm">
        <div>{{ lastCreated.email }}</div>
        <div>{{ lastCreated.password }}</div>
      </div>
      <button @click="lastCreated = null" class="text-xs text-green-700 font-semibold mt-2">Dismiss</button>
    </div>

    <div class="mt-4 ios-card p-3 flex gap-2 flex-wrap">
      <div class="relative flex-1 min-w-[200px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"></i>
        <input v-model="search" @keyup.enter="load" class="input pl-9" placeholder="Search by name or email..." />
      </div>
      <select v-model="filterRole" @change="load" class="input md:max-w-[160px]">
        <option value="">All roles</option>
        <option value="admin">Admin</option>
        <option value="vendor">Vendor</option>
        <option value="merchant_staff">Merchant Staff</option>
        <option value="customer">Customer</option>
      </select>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-12 text-center text-ink-500">
      <i class="fa-solid fa-users text-4xl text-ink-300"></i>
      <div class="mt-3">No users match.</div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="u in items" :key="u._id" class="p-4 flex items-center gap-3" :class="u.status === 'suspended' ? 'opacity-60' : ''">
        <div class="w-11 h-11 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center flex-shrink-0">{{ u.fullName?.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="font-semibold truncate">{{ u.fullName }}</div>
            <span class="chip text-[10px]" :class="statusColor(u.status)">{{ u.status }}</span>
          </div>
          <div class="text-sm text-ink-500 truncate">{{ u.email }}</div>
          <div class="flex flex-wrap gap-1 mt-1">
            <span class="chip bg-cream-200 text-ink-700 text-[10px]">{{ roleLabel(u.role) }}</span>
            <span v-if="u.roleSlug" class="chip bg-purple-50 text-purple-700 text-[10px]"><i class="fa-solid fa-id-badge text-[9px]"></i> {{ roleSlugName(u.roleSlug) }}</span>
            <span v-if="u.vendorId?.name" class="chip bg-teal-50 text-teal-700 text-[10px]"><i class="fa-solid fa-building text-[9px]"></i> {{ u.vendorId.name }}</span>
            <span v-if="u.merchantId?.name" class="chip bg-coral-500/10 text-coral-600 text-[10px]"><i class="fa-solid fa-store text-[9px]"></i> {{ u.merchantId.name }}</span>
            <span v-if="(u.permissions || []).length" class="chip bg-cream-200 text-ink-500 text-[10px]">{{ u.permissions.length }} perms</span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button @click="toggleStatus(u)" class="text-sm font-semibold" :class="u.status === 'active' ? 'text-amber-600' : 'text-green-700'" :title="u.status === 'active' ? 'Suspend' : 'Activate'">
            <i class="fa-solid" :class="u.status === 'active' ? 'fa-pause' : 'fa-play'"></i>
          </button>
          <button @click="openEdit(u)" class="text-sm font-semibold text-teal-700" title="Edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button @click="del(u)" class="text-sm font-semibold text-coral-600" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'Edit user' : 'New user' }}</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.fullName" class="input" placeholder="Full name" required />
          <input v-model="form.email" type="email" class="input" placeholder="Email" :disabled="!!editing" required />
          <div class="flex gap-2">
            <input v-model="form.password" type="text" class="input flex-1" :placeholder="editing ? 'New password (blank = unchanged)' : 'Password (min 8 chars)'" :minlength="editing ? 0 : 8" :required="!editing" />
            <button type="button" @click="genPwd" class="ios-card px-3 text-sm font-semibold text-teal-700 active:scale-95">Generate</button>
          </div>

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">Account type</div>
          <select v-model="form.role" class="input">
            <option value="customer">Customer</option>
            <option value="merchant_staff">Merchant Staff</option>
            <option value="vendor">Vendor Owner</option>
            <option value="admin">Platform Admin</option>
          </select>
          <select v-model="form.status" class="input">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          <template v-if="form.role === 'vendor' || form.role === 'merchant_staff'">
            <select v-model="form.vendorId" class="input">
              <option value="">— Select vendor —</option>
              <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
            </select>
            <select v-if="form.role === 'merchant_staff'" v-model="form.merchantId" class="input">
              <option value="">— Select location (optional) —</option>
              <option v-for="m in merchants" :key="m._id" :value="m._id">{{ m.name }}</option>
            </select>

            <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">Role preset</div>
            <p class="text-xs text-ink-500">Selecting a role auto-fills permissions. You can fine-tune below.</p>
            <div class="space-y-2 max-h-56 overflow-y-auto">
              <label v-for="r in filteredRoles" :key="r.slug" class="flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition" :class="form.roleSlug === r.slug ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'">
                <input type="radio" :value="r.slug" v-model="form.roleSlug" class="mt-1" @change="form.permissions = [...r.permissions]" />
                <div class="flex-1">
                  <div class="font-bold text-sm">{{ r.name }}</div>
                  <div class="text-xs text-ink-500 mt-0.5">{{ r.description }}</div>
                </div>
              </label>
            </div>

            <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">Permissions ({{ form.permissions.length }})</div>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="p in ALL_PERMS" :key="p" class="flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer" :class="form.permissions.includes(p) ? 'bg-teal-50 text-teal-800 font-semibold' : 'bg-cream-100 text-ink-500'">
                <input type="checkbox" :checked="form.permissions.includes(p)" @change="togglePerm(p)" />
                <span>{{ p.replace(/_/g, ' ') }}</span>
              </label>
            </div>
          </template>

          <button type="submit" class="ios-button-primary w-full mt-3">{{ editing ? 'Save changes' : 'Create user' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
