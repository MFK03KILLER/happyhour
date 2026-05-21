<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { imageFor, toman, offerTypeLabel } from '../../composables/useFormat';

const items = ref([]);
const vendors = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);

function blankForm() {
  return {
    vendorId: '', title: '', subtitle: '', description: '',
    heroImageUrl: '', offerType: 'BUNDLE', priceUSD: 0,
    maxUsesPerCustomer: 1, categorySlug: 'restaurants',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
}
const form = ref(blankForm());

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

function openNew() { editing.value = null; form.value = blankForm(); showForm.value = true; }
function openEdit(c) {
  editing.value = c;
  form.value = {
    vendorId: c.vendorId?._id || c.vendorId,
    title: c.title || '', subtitle: c.subtitle || '', description: c.description || '',
    heroImageUrl: c.heroImageUrl || '', offerType: c.offerType || 'BUNDLE',
    priceUSD: c.priceUSD || 0, maxUsesPerCustomer: c.maxUsesPerCustomer || 1,
    categorySlug: c.categorySlug || 'restaurants',
    validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    validUntil: c.validUntil ? new Date(c.validUntil).toISOString().slice(0,10) : new Date(Date.now() + 90*24*60*60*1000).toISOString().slice(0,10),
  };
  showForm.value = true;
}

async function save() {
  if (editing.value) {
    await client.put(`/admin/coupons/${editing.value._id}`, form.value);
  } else {
    await client.post('/admin/coupons', form.value);
  }
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('این کوپن حذف شود؟')) return;
  await client.delete(`/admin/coupons/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">کوپن‌ها</h1>
        <p class="text-ink-500 mt-1">پیشنهادهای ارائه شده به مشتریان</p>
      </div>
      <button @click="openNew" class="ios-button-primary">+ کوپن جدید</button>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="ios-card h-44 animate-pulse"></div>
    </div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="c in items" :key="c._id" class="ios-card overflow-hidden">
        <img :src="imageFor(c)" class="w-full h-32 object-cover" />
        <div class="p-4">
          <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider truncate">{{ c.vendorId?.name }}</div>
          <div class="font-bold mt-0.5 truncate">{{ c.title }}</div>
          <div class="text-sm text-ink-500 truncate">{{ c.subtitle }}</div>
          <div class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="chip bg-teal-50 text-teal-700 text-[10px]">{{ offerTypeLabel(c.offerType) }}</span>
            <span class="chip bg-cream-200 text-ink-700 text-[10px]">{{ c.maxUsesPerCustomer }}× استفاده</span>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-cream-200">
            <span class="text-sm font-bold text-teal-700">{{ c.priceUSD > 0 ? toman(c.priceUSD) : 'رایگان' }}</span>
            <div class="flex gap-2">
              <button @click="openEdit(c)" class="text-sm font-semibold text-teal-700 active:opacity-50">ویرایش</button>
              <button @click="del(c._id)" class="text-sm font-semibold text-coral-600 active:opacity-50">حذف</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'ویرایش کوپن' : 'کوپن جدید' }}</div>
          <button @click="showForm = false" class="text-ink-500">انصراف</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <select v-model="form.vendorId" class="input" required>
            <option value="">انتخاب بیزنس</option>
            <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
          </select>
          <input v-model="form.title" class="input" placeholder="عنوان (مثل چلو کباب کوبیده)" required />
          <input v-model="form.subtitle" class="input" placeholder="زیرعنوان کوتاه" />
          <textarea v-model="form.description" class="input" rows="3" placeholder="توضیحات کامل"></textarea>
          <input v-model="form.heroImageUrl" class="input" placeholder="آدرس عکس اصلی (Unsplash)" />
          <div class="grid grid-cols-2 gap-2">
            <select v-model="form.offerType" class="input">
              <option value="BUNDLE">پکیج</option>
              <option value="BOGO">یکی بخر دوتا ببر</option>
              <option value="PERCENT_OFF">درصد تخفیف</option>
              <option value="FLAT_OFF">تخفیف ثابت</option>
              <option value="FREE_ITEM">هدیه رایگان</option>
            </select>
            <select v-model="form.categorySlug" class="input">
              <option value="restaurants">رستوران</option>
              <option value="cafes">کافه</option>
              <option value="fastfood">فست‌فود</option>
              <option value="entertainment">سرگرمی</option>
              <option value="beauty">زیبایی</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model.number="form.priceUSD" type="number" min="0" step="1000" class="input" dir="ltr" placeholder="قیمت (تومان)" />
            <input v-model.number="form.maxUsesPerCustomer" type="number" min="1" class="input" dir="ltr" placeholder="حداکثر استفاده" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="form.validFrom" type="date" class="input" dir="ltr" />
            <input v-model="form.validUntil" type="date" class="input" dir="ltr" />
          </div>
          <button type="submit" class="ios-button-primary w-full">{{ editing ? 'ذخیره تغییرات' : 'ایجاد کوپن' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
