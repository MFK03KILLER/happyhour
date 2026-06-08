<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const items = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);

function can(p) { return (auth.user?.permissions || []).includes(p); }

function blankForm() {
  return {
    title: '', subtitle: '', description: '',
    heroImageUrl: '', offerType: 'BOGO', discountValue: 0,
    maxUsesPerCustomer: 1, categorySlug: 'dining',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    featured: false, todaysOffer: false, popupOffer: false,
    disabledOnHolidays: true,
    activeWindow: { days: ['daily'], start: '14:00', end: '17:00' },
  };
}
const form = ref(blankForm());

const DAYS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' }, { key: 'sun', label: 'Sun' },
];

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/merchant/coupons');
    items.value = data.items;
  } finally { loading.value = false; }
}

function openNew() { editing.value = null; form.value = blankForm(); showForm.value = true; }
function openEdit(c) {
  editing.value = c;
  form.value = {
    title: c.title || '', subtitle: c.subtitle || '', description: c.description || '',
    heroImageUrl: c.heroImageUrl || '',
    offerType: c.offerType || 'BOGO', discountValue: c.discountValue || 0,
    maxUsesPerCustomer: c.maxUsesPerCustomer || 1,
    categorySlug: c.categorySlug || 'dining',
    validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    validUntil: c.validUntil ? new Date(c.validUntil).toISOString().slice(0,10) : new Date(Date.now()+90*24*60*60*1000).toISOString().slice(0,10),
    featured: !!c.featured, todaysOffer: !!c.todaysOffer, popupOffer: !!c.popupOffer,
    disabledOnHolidays: c.disabledOnHolidays !== false,
    activeWindow: c.activeWindow || { days: ['daily'], start: '14:00', end: '17:00' },
  };
  showForm.value = true;
}

const saveError = ref('');
const saving = ref(false);

async function save() {
  saveError.value = '';
  saving.value = true;
  try {
    const payload = { ...form.value, offerKind: 'member_perk', priceUSD: 0 };
    if (editing.value) await client.put(`/merchant/coupons/${editing.value._id}`, payload);
    else await client.post('/merchant/coupons', payload);
    showForm.value = false;
    await load();
  } catch (e) {
    saveError.value = e.response?.data?.error?.message || e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

async function del(id) {
  if (!confirm('Delete this coupon?')) return;
  try {
    await client.delete(`/merchant/coupons/${id}`);
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Delete failed');
  }
}

function toggleDay(d) {
  const days = form.value.activeWindow.days || [];
  if (d === 'daily') { form.value.activeWindow.days = ['daily']; return; }
  let next = days.filter((x) => x !== 'daily');
  if (next.includes(d)) next = next.filter((x) => x !== d);
  else next.push(d);
  if (next.length === 0) next = ['daily'];
  form.value.activeWindow.days = next;
}

function offerTypeLabel(t) {
  return { BOGO: 'Buy 1 Get 1', PERCENT_OFF: '% Off', FLAT_OFF: '$ Off', FREE_ITEM: 'Free Item', BUNDLE: 'Bundle' }[t] || t;
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-cream-100 pb-28">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white safe-top px-5 pb-8 rounded-b-3xl">
      <div class="pt-2 flex items-center justify-between">
        <div>
          <div class="text-xs opacity-80 font-semibold uppercase tracking-wider">شعبه من</div>
          <h1 class="text-2xl font-bold mt-0.5">کوپن‌ها</h1>
        </div>
        <button v-if="can('manage_coupons')" @click="openNew" class="bg-white text-teal-700 px-4 py-2 rounded-full text-sm font-bold active:scale-95">
          <i class="fa-solid fa-plus mr-1"></i>جدید
        </button>
      </div>
    </header>

    <div v-if="loading" class="px-5 -mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-32 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="px-5 mt-12 text-center">
      <div class="mx-auto w-20 h-20 rounded-3xl bg-cream-200 flex items-center justify-center">
        <i class="fa-solid fa-ticket text-3xl text-ink-300"></i>
      </div>
      <div class="mt-4 font-semibold">هنوز کوپنی ندارید</div>
      <p class="text-ink-500 text-sm mt-1">اولین کوپن خود را بسازید تا در ساعات کم‌بازده مشتری جذب کنید.</p>
      <button v-if="can('manage_coupons')" @click="openNew" class="ios-button-primary mt-5">ساخت کوپن</button>
    </div>
    <div v-else class="px-5 -mt-6 space-y-3">
      <div v-for="c in items" :key="c._id" class="ios-card overflow-hidden">
        <div class="flex">
          <img :src="c.heroImageUrl" class="w-24 h-24 object-cover bg-cream-200 flex-shrink-0" />
          <div class="flex-1 p-3 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="font-bold truncate">{{ c.title }}</div>
                <div class="text-xs text-ink-500 truncate">{{ c.subtitle }}</div>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span class="chip bg-teal-50 text-teal-700 text-[10px]">{{ offerTypeLabel(c.offerType) }}</span>
                  <span v-if="c.status === 'paused'" class="chip bg-ink-700 text-white text-[10px]">متوقف</span>
                  <span v-if="c.todaysOffer" class="chip bg-coral-500 text-white text-[10px]">امروز</span>
                  <span v-if="c.activeWindow?.start" class="chip bg-cream-200 text-ink-700 text-[10px]">{{ c.activeWindow.start }}-{{ c.activeWindow.end }}</span>
                </div>
              </div>
            </div>
            <div v-if="can('manage_coupons')" class="flex gap-3 mt-3 pt-2 border-t border-cream-200">
              <button @click="openEdit(c)" class="text-sm font-semibold text-teal-700"><i class="fa-solid fa-pen-to-square mr-1"></i>ویرایش</button>
              <button @click="del(c._id)" class="text-sm font-semibold text-coral-600"><i class="fa-solid fa-trash mr-1"></i>حذف</button>
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
          <input v-model="form.title" class="input" placeholder="عنوان (مثلاً: یکی بخر دوتا ببر)" required />
          <input v-model="form.subtitle" class="input" placeholder="زیرعنوان کوتاه" />
          <textarea v-model="form.description" class="input" rows="2" placeholder="توضیحات / شرایط"></textarea>
          <input v-model="form.heroImageUrl" class="input" placeholder="لینک تصویر اصلی" />

          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 mb-1.5">نوع آفر</div>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" v-for="t in ['BOGO','PERCENT_OFF','FREE_ITEM','FLAT_OFF','BUNDLE']" :key="t" @click="form.offerType = t" class="rounded-2xl py-2.5 border-2 text-xs font-bold transition active:scale-95" :class="form.offerType === t ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20 text-ink-700'">
                {{ offerTypeLabel(t) }}
              </button>
            </div>
          </div>

          <input v-if="['PERCENT_OFF','FLAT_OFF'].includes(form.offerType)" v-model.number="form.discountValue" type="number" min="0" class="input" :placeholder="form.offerType === 'PERCENT_OFF' ? 'درصد تخفیف' : 'مقدار تخفیف (تومان)'" />

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">برجسته‌سازی</div>
          <label class="flex items-center gap-3 p-3 rounded-2xl bg-coral-500/5 cursor-pointer">
            <input type="checkbox" v-model="form.todaysOffer" class="w-5 h-5" />
            <div>
              <div class="font-semibold"><i class="fa-solid fa-fire text-coral-500 mr-1"></i>آفر امروز</div>
              <div class="text-xs text-ink-500">نمایش در بالای صفحه‌ی فروشگاه</div>
            </div>
          </label>

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">
            <i class="fa-solid fa-calendar-xmark"></i> تعطیلات
          </div>
          <label class="flex items-center gap-3 p-3 rounded-2xl bg-cream-100 cursor-pointer">
            <input type="checkbox" v-model="form.disabledOnHolidays" class="w-5 h-5" />
            <div>
              <div class="font-semibold">غیرفعال در تعطیلات</div>
              <div class="text-xs text-ink-500">کوپن در تعطیلات رسمی و تعطیلات اختصاصی فروشگاه غیرفعال می‌شود. بردارید تا در تعطیلات هم فعال بماند.</div>
            </div>
          </label>

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">
            <i class="fa-regular fa-clock"></i> ساعات فعال
          </div>
          <div class="flex gap-1 flex-wrap">
            <button type="button" @click="toggleDay('daily')" class="chip transition" :class="(form.activeWindow.days || []).includes('daily') ? 'bg-teal-600 text-white' : 'bg-cream-200 text-ink-700'">هر روز</button>
            <button type="button" v-for="d in DAYS" :key="d.key" @click="toggleDay(d.key)" class="chip transition" :class="(form.activeWindow.days || []).includes(d.key) ? 'bg-teal-600 text-white' : 'bg-cream-200 text-ink-700'">
              {{ d.label }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="form.activeWindow.start" type="time" class="input" />
            <input v-model="form.activeWindow.end" type="time" class="input" />
          </div>

          <div v-if="saveError" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 p-3 text-sm text-coral-700">
            <i class="fa-solid fa-triangle-exclamation mr-1"></i>{{ saveError }}
          </div>
          <button type="submit" :disabled="saving" class="ios-button-primary w-full mt-2">{{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Create coupon') }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
