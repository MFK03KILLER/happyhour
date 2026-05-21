<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { roleLabel, statusLabel, permissionLabel } from '../../composables/useFormat';

const items = ref([]);
const vendors = ref([]);
const merchants = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);

function blankForm() {
  return { fullName: '', phone: '', password: '', role: 'merchant_staff', vendorId: '', merchantId: '', permissions: [] };
}
const form = ref(blankForm());

const PERMISSIONS = ['manage_coupons', 'view_stats', 'manage_team', 'scan_only', 'manage_merchants'];

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

function openNew() { editing.value = null; form.value = blankForm(); showForm.value = true; }

function openEdit(u) {
  editing.value = u;
  form.value = {
    fullName: u.fullName || '',
    phone: u.phone || '',
    password: '',
    role: u.role || 'merchant_staff',
    vendorId: u.vendorId?._id || u.vendorId || '',
    merchantId: u.merchantId?._id || u.merchantId || '',
    permissions: u.permissions || [],
  };
  showForm.value = true;
}

async function save() {
  const payload = { ...form.value };
  if (!payload.vendorId) delete payload.vendorId;
  if (!payload.merchantId) delete payload.merchantId;
  if (editing.value) {
    if (!payload.password) delete payload.password;
    await client.put(`/admin/users/${editing.value._id}`, payload);
  } else {
    await client.post('/admin/users', payload);
  }
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('این کاربر حذف شود؟')) return;
  await client.delete(`/admin/users/${id}`);
  await load();
}

function togglePerm(p) {
  const i = form.value.permissions.indexOf(p);
  if (i >= 0) form.value.permissions.splice(i, 1);
  else form.value.permissions.push(p);
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">کاربران</h1>
        <p class="text-ink-500 mt-1">تمام کاربران پلتفرم</p>
      </div>
      <button @click="openNew" class="ios-button-primary">+ کاربر جدید</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-16 animate-pulse"></div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="u in items" :key="u._id" class="p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center flex-shrink-0">{{ u.fullName?.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ u.fullName }}</div>
          <div class="text-sm text-ink-500 truncate" dir="ltr">{{ u.phone }}</div>
        </div>
        <span class="chip bg-cream-200 text-ink-700 flex-shrink-0">{{ roleLabel(u.role) }}</span>
        <div class="flex gap-2 flex-shrink-0">
          <button @click="openEdit(u)" class="text-sm font-semibold text-teal-700 active:opacity-50">ویرایش</button>
          <button @click="del(u._id)" class="text-sm font-semibold text-coral-600 active:opacity-50">حذف</button>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'ویرایش کاربر' : 'کاربر جدید' }}</div>
          <button @click="showForm = false" class="text-ink-500">انصراف</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.fullName" class="input" placeholder="نام و نام خانوادگی" required />
          <input v-model="form.phone" type="tel" dir="ltr" class="input text-right" placeholder="شماره موبایل (09xxxxxxxxx)" required :disabled="!!editing" />
          <input v-model="form.password" type="password" class="input" :placeholder="editing ? 'رمز جدید (خالی = تغییر ندهد)' : 'رمز عبور (حداقل ۸ کاراکتر)'" :required="!editing" :minlength="editing ? 0 : 8" />
          <select v-model="form.role" class="input">
            <option value="admin">مدیر کل</option>
            <option value="vendor">مالک بیزنس</option>
            <option value="merchant_staff">پرسنل شعبه</option>
            <option value="customer">مشتری</option>
          </select>
          <select v-if="form.role === 'vendor' || form.role === 'merchant_staff'" v-model="form.vendorId" class="input">
            <option value="">انتخاب بیزنس</option>
            <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
          </select>
          <select v-if="form.role === 'merchant_staff'" v-model="form.merchantId" class="input">
            <option value="">انتخاب شعبه</option>
            <option v-for="m in merchants" :key="m._id" :value="m._id">{{ m.name }}</option>
          </select>

          <div v-if="form.role !== 'customer' && form.role !== 'admin'">
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider mb-2">سطح دسترسی</div>
            <div class="space-y-2">
              <label v-for="p in PERMISSIONS" :key="p" class="flex items-center gap-2 text-sm">
                <input type="checkbox" :checked="form.permissions.includes(p)" @change="togglePerm(p)" />
                {{ permissionLabel(p) }}
              </label>
            </div>
          </div>

          <button type="submit" class="ios-button-primary w-full mt-2">{{ editing ? 'ذخیره تغییرات' : 'ایجاد کاربر' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
