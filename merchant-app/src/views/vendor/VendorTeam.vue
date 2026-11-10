<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';

const items = ref([]);
const merchants = ref([]);
const roles = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);
const lastCreated = ref(null);
const saving = ref(false);
const formError = ref('');

function blankForm() {
  return { fullName: '', email: '', password: '', merchantId: '', roleSlug: 'vendor_cashier' };
}
const form = ref(blankForm());

async function load() {
  loading.value = true;
  try {
    const [t, m, r] = await Promise.all([
      client.get('/vendor/team'),
      client.get('/vendor/merchants'),
      client.get('/vendor/roles').catch(() => ({ data: { items: [] } })),
    ]);
    items.value = t.data.items;
    merchants.value = m.data.items;
    roles.value = r.data.items;
  } finally { loading.value = false; }
}

function openNew() { editing.value = null; form.value = blankForm(); formError.value = ''; showForm.value = true; }
function openEdit(u) {
  editing.value = u;
  form.value = {
    fullName: u.fullName || '',
    email: u.email || '',
    password: '',
    merchantId: u.merchantId?._id || u.merchantId || '',
    roleSlug: u.roleSlug || 'vendor_cashier',
  };
  formError.value = '';
  showForm.value = true;
}

// Checked here, not by the browser: iOS shows no validation bubbles, so a bad
// field used to make "Add member" do nothing at all.
function validate() {
  const f = form.value;
  if (!f.fullName.trim()) return "Enter the member's full name.";
  if (!editing.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'Enter a valid email address.';
  if ((!editing.value || f.password) && f.password.length < 8) return 'The password needs at least 8 characters (tap Generate).';
  if (!f.roleSlug) return 'Choose a role.';
  return '';
}

async function save() {
  formError.value = validate();
  if (formError.value) return;
  const payload = { ...form.value, fullName: form.value.fullName.trim(), email: form.value.email.trim().toLowerCase() };
  if (!payload.merchantId) delete payload.merchantId;
  saving.value = true;
  try {
    if (editing.value) {
      if (!payload.password) delete payload.password;
      delete payload.email;
      await client.put(`/vendor/team/${editing.value._id}`, payload, { silent: true });
    } else {
      await client.post('/vendor/team', payload, { silent: true });
      lastCreated.value = { email: payload.email, password: form.value.password, name: payload.fullName };
    }
    showForm.value = false;
    await load();
  } catch (e) {
    formError.value = e.response?.data?.error?.message || 'Could not save. Check your connection and try again.';
  } finally {
    saving.value = false;
  }
}

async function del(id) {
  if (!confirm('Remove this team member?')) return;
  await client.delete(`/vendor/team/${id}`);
  await load();
}

function genPwd() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  form.value.password = p;
}

function roleNameForUser(u) {
  if (!u.roleSlug) return 'Custom';
  const r = roles.value.find((x) => x.slug === u.roleSlug);
  return r ? r.name : u.roleSlug;
}

function selectedRole() { return roles.value.find((r) => r.slug === form.value.roleSlug); }

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Team</h1>
        <p class="text-ink-500 mt-1">Staff with roles and permissions</p>
      </div>
      <button @click="openNew" class="ios-button-primary"><i class="fa-solid fa-user-plus mr-2"></i>Add member</button>
    </div>

    <div v-if="lastCreated" class="mt-6 ios-card p-5 bg-teal-50 border border-teal-600/30">
      <div class="font-bold text-teal-700 flex items-center gap-2"><i class="fa-solid fa-circle-check"></i>Member created</div>
      <p class="text-sm text-ink-700 mt-1">Share these credentials with <strong>{{ lastCreated.name }}</strong>:</p>
      <div class="mt-3 font-mono text-sm space-y-1">
        <div><span class="text-ink-500">Login:</span> {{ lastCreated.email }}</div>
        <div><span class="text-ink-500">Password:</span> {{ lastCreated.password }}</div>
      </div>
      <button @click="lastCreated = null" class="text-sm text-teal-700 font-semibold mt-3">Dismiss</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-center py-12 text-ink-500">
      <i class="fa-solid fa-users text-4xl text-ink-300"></i>
      <div class="mt-3">No team members yet.</div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="u in items" :key="u._id" class="p-4 flex items-center gap-3">
        <div class="w-11 h-11 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">{{ u.fullName?.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ u.fullName }}</div>
          <div class="text-xs text-ink-500 truncate">{{ u.email }}</div>
          <div class="flex gap-1.5 mt-1 flex-wrap">
            <span class="chip bg-teal-50 text-teal-700 text-[10px]"><i class="fa-solid fa-id-badge text-[9px]"></i> {{ roleNameForUser(u) }}</span>
            <span v-if="u.merchantId?.name" class="chip bg-cream-200 text-ink-500 text-[10px]"><i class="fa-solid fa-store text-[9px]"></i> {{ u.merchantId.name }}</span>
          </div>
        </div>
        <button @click="openEdit(u)" class="text-sm text-teal-700 font-semibold"><i class="fa-solid fa-pen-to-square"></i></button>
        <button @click="del(u._id)" class="text-sm text-coral-600 font-semibold"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'Edit member' : 'Add member' }}</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" novalidate class="space-y-3">
          <input v-model="form.fullName" class="input" placeholder="Full name" required />
          <input v-model="form.email" type="email" class="input" placeholder="Email" :disabled="!!editing" required />
          <div class="flex gap-2">
            <input v-model="form.password" type="text" class="input flex-1" :placeholder="editing ? 'New password (blank = unchanged)' : 'Password'" :minlength="editing ? 0 : 8" :required="!editing" />
            <button type="button" @click="genPwd" class="ios-card px-3 text-sm font-semibold text-teal-700 active:scale-95">Generate</button>
          </div>

          <select v-model="form.merchantId" class="input">
            <option value="">All locations</option>
            <option v-for="m in merchants" :key="m._id" :value="m._id">{{ m.name }}</option>
          </select>

          <div class="text-xs uppercase font-semibold text-ink-500 mt-2">Role</div>
          <div class="space-y-2 max-h-72 overflow-y-auto">
            <label v-for="r in roles" :key="r.slug" class="flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer transition" :class="form.roleSlug === r.slug ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'">
              <input type="radio" :value="r.slug" v-model="form.roleSlug" class="mt-1" />
              <div class="flex-1">
                <div class="font-bold text-sm">{{ r.name }}</div>
                <div class="text-xs text-ink-500 mt-0.5">{{ r.description }}</div>
                <div class="flex flex-wrap gap-1 mt-2">
                  <span v-for="p in r.permissions" :key="p" class="chip bg-cream-200 text-ink-700 text-[9px]">{{ p.replace(/_/g, ' ') }}</span>
                </div>
              </div>
            </label>
          </div>

          <div v-if="formError" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ formError }}</div>
          <button type="submit" :disabled="saving" class="ios-button-primary w-full mt-2 disabled:opacity-60">{{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Add member') }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
