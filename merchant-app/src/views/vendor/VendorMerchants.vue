<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { imageFor, categoryLabel } from '../../composables/useFormat';

const auth = useAuthStore();
const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);

function blankForm() {
  return {
    name: '', category: 'restaurant', phone: '', logoUrl: '', coverImageUrl: '',
    address: { street: '', city: 'تهران', state: 'تهران', zip: '', country: 'IR', lat: null, lng: null },
  };
}
const form = ref(blankForm());

function can(p) { return (auth.user?.permissions || []).includes(p); }

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/vendor/merchants');
    items.value = data.items;
  } finally { loading.value = false; }
}

function openNew() { editing.value = null; form.value = blankForm(); showForm.value = true; }
function openEdit(m) {
  editing.value = m;
  form.value = {
    name: m.name || '', category: m.category || 'restaurant',
    phone: m.phone || '', logoUrl: m.logoUrl || '', coverImageUrl: m.coverImageUrl || '',
    address: {
      street: m.address?.street || '', city: m.address?.city || 'تهران',
      state: m.address?.state || 'تهران', zip: m.address?.zip || '',
      country: 'IR', lat: m.address?.lat || null, lng: m.address?.lng || null,
    },
  };
  showForm.value = true;
}

async function save() {
  if (editing.value) await client.put(`/vendor/merchants/${editing.value._id}`, form.value);
  else await client.post('/vendor/merchants', form.value);
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('این شعبه حذف شود؟')) return;
  await client.delete(`/vendor/merchants/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">شعب شما</h1>
        <p class="text-ink-500 mt-1">شعب فروشگاهی</p>
      </div>
      <button v-if="can('manage_merchants')" @click="openNew" class="ios-button-primary">+ شعبه جدید</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-24 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-ink-500 text-center py-8">هنوز شعبه‌ای ندارید.</div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="m in items" :key="m._id" class="ios-card overflow-hidden flex">
        <img :src="imageFor(m)" class="w-24 h-24 object-cover bg-cream-200 flex-shrink-0" />
        <div class="flex-1 p-4 min-w-0">
          <div class="font-semibold truncate">{{ m.name }}</div>
          <div class="text-xs text-ink-500 truncate">{{ m.address?.street }}، {{ m.address?.city }}</div>
          <div class="text-[11px] text-ink-300 mt-1">{{ categoryLabel(m.category) }}</div>
          <div v-if="can('manage_merchants')" class="flex gap-2 mt-2">
            <button @click="openEdit(m)" class="text-xs font-semibold text-teal-700 active:opacity-50">ویرایش</button>
            <button @click="del(m._id)" class="text-xs font-semibold text-coral-600 active:opacity-50">حذف</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'ویرایش شعبه' : 'شعبه جدید' }}</div>
          <button @click="showForm = false" class="text-ink-500">انصراف</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.name" class="input" placeholder="نام شعبه" required />
          <select v-model="form.category" class="input">
            <option value="restaurant">رستوران</option>
            <option value="cafe">کافه</option>
            <option value="fastfood">فست‌فود</option>
            <option value="bar">بار</option>
            <option value="retail">فروشگاه</option>
            <option value="fitness">باشگاه</option>
            <option value="beauty">زیبایی</option>
            <option value="entertainment">سرگرمی</option>
          </select>
          <input v-model="form.address.street" class="input" placeholder="آدرس" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model="form.address.city" class="input" placeholder="شهر" />
            <input v-model="form.address.state" class="input" placeholder="استان" />
          </div>
          <input v-model="form.address.zip" class="input" dir="ltr" placeholder="کد پستی" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model.number="form.address.lat" type="number" step="0.0001" dir="ltr" class="input text-right" placeholder="عرض" />
            <input v-model.number="form.address.lng" type="number" step="0.0001" dir="ltr" class="input text-right" placeholder="طول" />
          </div>
          <input v-model="form.phone" type="tel" dir="ltr" class="input text-right" placeholder="تلفن شعبه" />
          <input v-model="form.logoUrl" type="url" class="input" placeholder="آدرس لوگو (اختیاری)" />
          <input v-model="form.coverImageUrl" type="url" class="input" placeholder="آدرس کاور (اختیاری)" />
          <button type="submit" class="ios-button-primary w-full">{{ editing ? 'ذخیره تغییرات' : 'ایجاد شعبه' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
