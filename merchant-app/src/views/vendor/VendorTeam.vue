<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { permissionLabel } from '../../composables/useFormat';

const items = ref([]);
const merchants = ref([]);
const loading = ref(true);
const showForm = ref(false);
const lastCreated = ref(null);

function blankForm() {
  return { fullName: '', phone: '', password: '', role: 'merchant_staff', merchantId: '', permissions: ['scan_only'] };
}
const form = ref(blankForm());

const PERMISSIONS = ['manage_coupons', 'view_stats', 'manage_team', 'scan_only', 'manage_merchants'];

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
  await client.post('/vendor/team', payload);
  lastCreated.value = { phone: form.value.phone, password: form.value.password, name: form.value.fullName };
  showForm.value = false;
  form.value = blankForm();
  await load();
}

async function del(id) {
  if (!confirm('این عضو حذف شود؟')) return;
  await client.delete(`/vendor/team/${id}`);
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

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">تیم بیزنس</h1>
        <p class="text-ink-500 mt-1">پرسنل و مدیران شعب</p>
      </div>
      <button @click="showForm = true" class="ios-button-primary">+ عضو جدید</button>
    </div>

    <div v-if="lastCreated" class="mt-6 ios-card p-5 bg-teal-50 border border-teal-600/30">
      <div class="font-bold text-teal-700">عضو جدید ایجاد شد!</div>
      <p class="text-sm text-ink-700 mt-1">این مشخصات را به <strong>{{ lastCreated.name }}</strong> تحویل دهید:</p>
      <div class="mt-3 font-mono text-sm space-y-1" dir="ltr">
        <div>{{ lastCreated.phone }}</div>
        <div>{{ lastCreated.password }}</div>
      </div>
      <button @click="lastCreated = null" class="text-sm text-teal-700 font-semibold mt-3">بستن</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-ink-500 text-center py-8">هنوز عضوی ندارید.</div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="u in items" :key="u._id" class="p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center">{{ u.fullName?.charAt(0) }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ u.fullName }}</div>
          <div class="text-sm text-ink-500 truncate" dir="ltr">{{ u.phone }}</div>
          <div class="flex gap-1 mt-1 flex-wrap">
            <span v-for="p in u.permissions" :key="p" class="chip bg-cream-200 text-ink-700 text-[10px]">{{ permissionLabel(p) }}</span>
          </div>
        </div>
        <button @click="del(u._id)" class="text-sm text-coral-600 font-semibold">حذف</button>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">عضو جدید تیم</div>
          <button @click="showForm = false" class="text-ink-500">انصراف</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.fullName" class="input" placeholder="نام و نام خانوادگی" required />
          <input v-model="form.phone" type="tel" dir="ltr" class="input text-right" placeholder="شماره موبایل" required />
          <div class="flex gap-2">
            <input v-model="form.password" type="text" class="input flex-1" placeholder="رمز عبور" minlength="8" required />
            <button type="button" @click="genPwd" class="ios-card px-3 text-sm font-semibold text-teal-700">ساخت</button>
          </div>
          <select v-model="form.merchantId" class="input">
            <option value="">شعبه (اختیاری)</option>
            <option v-for="m in merchants" :key="m._id" :value="m._id">{{ m.name }}</option>
          </select>
          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider mb-2">سطح دسترسی</div>
            <div class="space-y-2">
              <label v-for="p in PERMISSIONS" :key="p" class="flex items-center gap-2 text-sm">
                <input type="checkbox" :checked="form.permissions.includes(p)" @change="togglePerm(p)" />
                {{ permissionLabel(p) }}
              </label>
            </div>
          </div>
          <button type="submit" class="ios-button-primary w-full">ایجاد عضو</button>
        </form>
      </div>
    </div>
  </div>
</template>
