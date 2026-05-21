<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { logoFor } from '../../composables/useFormat';

const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);
const form = ref({
  name: '', description: '', contactEmail: '', logoUrl: '',
  ownerFullName: '', ownerPhone: '', ownerPassword: '',
});
const lastCreated = ref(null);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/vendors');
    items.value = data.items;
  } finally { loading.value = false; }
}

function openNew() {
  editing.value = null;
  form.value = { name: '', description: '', contactEmail: '', logoUrl: '', ownerFullName: '', ownerPhone: '', ownerPassword: '' };
  showForm.value = true;
}

function openEdit(v) {
  editing.value = v;
  form.value = {
    name: v.name || '', description: v.description || '',
    contactEmail: v.contactEmail || '', logoUrl: v.logoUrl || '',
    ownerFullName: '', ownerPhone: '', ownerPassword: '',
  };
  showForm.value = true;
}

async function save() {
  const payload = { ...form.value };
  if (!payload.ownerPhone) {
    delete payload.ownerPhone; delete payload.ownerPassword; delete payload.ownerFullName;
  }
  if (editing.value) {
    delete payload.ownerPhone; delete payload.ownerPassword; delete payload.ownerFullName;
    await client.put(`/admin/vendors/${editing.value._id}`, payload);
  } else {
    const { data } = await client.post('/admin/vendors', payload);
    if (data.owner) lastCreated.value = { phone: form.value.ownerPhone, password: form.value.ownerPassword, name: data.vendor.name };
  }
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('این بیزنس حذف شود؟')) return;
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
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">بیزنس‌ها</h1>
        <p class="text-ink-500 mt-1">شرکت‌ها و برندهای والد</p>
      </div>
      <button @click="openNew" class="ios-button-primary">+ بیزنس جدید</button>
    </div>

    <div v-if="lastCreated" class="mt-6 ios-card p-5 bg-teal-50 border border-teal-600/30">
      <div class="font-bold text-teal-700">بیزنس + مدیر ایجاد شد!</div>
      <p class="text-sm text-ink-700 mt-1">این مشخصات را به <strong>{{ lastCreated.name }}</strong> تحویل دهید:</p>
      <div class="mt-3 font-mono text-sm space-y-1" dir="ltr">
        <div><span class="text-ink-500">موبایل:</span> {{ lastCreated.phone }}</div>
        <div><span class="text-ink-500">رمز:</span> {{ lastCreated.password }}</div>
      </div>
      <p class="text-xs text-ink-500 mt-3">با ورود به سیستم به پنل وندور هدایت می‌شوند و می‌توانند شعب، کوپن و تیم خود را مدیریت کنند.</p>
      <button @click="lastCreated = null" class="text-sm text-teal-700 font-semibold mt-3">بستن</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="v in items" :key="v._id" class="ios-card p-4 flex items-center gap-3">
        <img :src="v.logoUrl || logoFor(v.name)" class="w-12 h-12 rounded-full object-cover bg-cream-200 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ v.name }}</div>
          <div class="text-sm text-ink-500 truncate">{{ v.description || 'بدون توضیحات' }}</div>
        </div>
        <div class="flex gap-1.5 flex-shrink-0">
          <button @click="openEdit(v)" class="text-sm font-semibold text-teal-700 active:opacity-50 px-2">ویرایش</button>
          <button @click="del(v._id)" class="text-sm font-semibold text-coral-600 active:opacity-50 px-2">حذف</button>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'ویرایش بیزنس' : 'بیزنس جدید' }}</div>
          <button @click="showForm = false" class="text-ink-500">انصراف</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">اطلاعات برند</div>
          <input v-model="form.name" class="input" placeholder="نام بیزنس (مثل ریحون)" required />
          <input v-model="form.description" class="input" placeholder="توضیح کوتاه" />
          <input v-model="form.contactEmail" type="email" class="input" placeholder="ایمیل تماس" />
          <input v-model="form.logoUrl" type="url" class="input" placeholder="آدرس لوگو (Unsplash و ...)" />

          <template v-if="!editing">
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider mt-4 pt-3 border-t border-cream-200">حساب مدیر (اختیاری)</div>
            <p class="text-xs text-ink-500">برای مدیر بیزنس حساب وندور می‌سازد. این مشخصات را به ایشان تحویل دهید.</p>
            <input v-model="form.ownerFullName" class="input" placeholder="نام مدیر" />
            <input v-model="form.ownerPhone" type="tel" dir="ltr" class="input text-right" placeholder="شماره موبایل (09xxxxxxxxx)" />
            <div class="flex gap-2">
              <input v-model="form.ownerPassword" type="text" class="input flex-1" placeholder="رمز عبور" minlength="8" />
              <button type="button" @click="genPwd" class="ios-card px-3 text-sm font-semibold text-teal-700 active:scale-95">ساخت</button>
            </div>
          </template>

          <button type="submit" class="ios-button-primary w-full mt-2">{{ editing ? 'ذخیره تغییرات' : 'ایجاد بیزنس' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
