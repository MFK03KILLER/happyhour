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
    name: '', category: 'dining', subCategory: '', cuisineTags: [],
    priceLevel: 2, description: '', phone: '', website: '',
    coverImageUrl: '', logoUrl: '',
    address: { street: '', city: 'San Francisco', state: 'CA', zip: '', country: 'US', lat: null, lng: null },
    offPeakHours: [],
  };
}
const form = ref(blankForm());
const cuisineInput = ref('');

const DAYS = [
  { key: 'mon', label: 'دوشنبه' }, { key: 'tue', label: 'سه‌شنبه' }, { key: 'wed', label: 'چهارشنبه' },
  { key: 'thu', label: 'پنجشنبه' }, { key: 'fri', label: 'جمعه' }, { key: 'sat', label: 'شنبه' }, { key: 'sun', label: 'یکشنبه' },
];

function can(p) { return (auth.user?.permissions || []).includes(p); }

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/vendor/merchants');
    items.value = data.items;
  } finally { loading.value = false; }
}

function openNew() {
  editing.value = null;
  form.value = blankForm();
  cuisineInput.value = '';
  showForm.value = true;
}

function openEdit(m) {
  editing.value = m;
  form.value = {
    name: m.name || '',
    category: m.category || 'dining',
    subCategory: m.subCategory || '',
    cuisineTags: m.cuisineTags || [],
    priceLevel: m.priceLevel || 2,
    description: m.description || '',
    phone: m.phone || '', website: m.website || '',
    coverImageUrl: m.coverImageUrl || '', logoUrl: m.logoUrl || '',
    address: { ...m.address, country: 'US' },
    offPeakHours: m.offPeakHours || [],
  };
  cuisineInput.value = '';
  showForm.value = true;
}

function addCuisine() {
  const v = cuisineInput.value.trim();
  if (!v) return;
  if (!form.value.cuisineTags.includes(v)) form.value.cuisineTags.push(v);
  cuisineInput.value = '';
}
function removeCuisine(t) {
  form.value.cuisineTags = form.value.cuisineTags.filter((x) => x !== t);
}

function addOffPeakSlot() {
  form.value.offPeakHours.push({ day: 'daily', start: '14:00', end: '17:00' });
}
function removeOffPeakSlot(i) {
  form.value.offPeakHours.splice(i, 1);
}

const saveError = ref('');
const saving = ref(false);

async function save() {
  saveError.value = '';
  saving.value = true;
  try {
    if (editing.value) {
      await client.put(`/vendor/merchants/${editing.value._id}`, form.value);
    } else {
      await client.post('/vendor/merchants', form.value);
    }
    showForm.value = false;
    await load();
  } catch (e) {
    saveError.value = e.response?.data?.error?.message || e.message || 'ذخیره ناموفق بود';
  } finally {
    saving.value = false;
  }
}

async function del(id) {
  if (!confirm('این شعبه حذف شود؟')) return;
  try {
    await client.delete(`/vendor/merchants/${id}`);
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'حذف ناموفق بود');
  }
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
      <button v-if="can('manage_merchants')" @click="openNew" class="ios-button-primary"><i class="fa-solid fa-plus mr-2"></i>شعبه جدید</button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-24 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-ink-500 text-center py-12">
      <i class="fa-solid fa-store text-4xl text-ink-300"></i>
      <div class="mt-3">هنوز شعبه‌ای ثبت نشده است.</div>
    </div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="m in items" :key="m._id" class="ios-card overflow-hidden">
        <div class="flex">
          <img :src="m.coverImageUrl || m.logoUrl" class="w-28 h-28 object-cover bg-cream-200 flex-shrink-0" />
          <div class="flex-1 p-4 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="font-bold truncate">{{ m.name }}</div>
                <div class="text-xs text-ink-500 truncate mt-0.5">{{ m.subCategory }} · {{ '$'.repeat(m.priceLevel || 2) }}</div>
                <div class="text-[11px] text-ink-300 truncate mt-1">{{ m.address?.street }}, {{ m.address?.city }}</div>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0 text-xs">
                <i class="fa-solid fa-star text-yellow-500"></i>
                <span class="font-bold">{{ (m.rating || 0).toFixed(1) }}</span>
              </div>
            </div>
            <div v-if="m.offPeakHours?.length" class="mt-2">
              <span class="chip bg-coral-500/10 text-coral-600 text-[10px]">
                <i class="fa-regular fa-clock"></i>
                هپی اَور: {{ m.offPeakHours[0].start }}-{{ m.offPeakHours[0].end }}
              </span>
            </div>
            <div v-if="can('manage_merchants')" class="flex gap-3 mt-2">
              <button @click="openEdit(m)" class="text-sm font-semibold text-teal-700 active:opacity-50"><i class="fa-solid fa-pen-to-square mr-1"></i>ویرایش</button>
              <button @click="del(m._id)" class="text-sm font-semibold text-coral-600 active:opacity-50"><i class="fa-solid fa-trash mr-1"></i>حذف</button>
            </div>
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
          <div class="text-xs uppercase font-semibold text-ink-500">اطلاعات پایه</div>
          <input v-model="form.name" class="input" placeholder="نام شعبه (مثلاً پیتزا دلخواه — شعبه ولیعصر)" required />
          <select v-model="form.category" class="input">
            <option value="dining">رستوران</option>
            <option value="cafe">کافه</option>
            <option value="bar">نوشیدنی</option>
            <option value="activities">تفریحی</option>
            <option value="wellness">سلامت و زیبایی</option>
            <option value="hotels">هتل</option>
            <option value="services">خدمات</option>
          </select>
          <input v-model="form.subCategory" class="input" placeholder="زیردسته (مثلاً پیتزا، کبابی)" />
          <input v-model="form.description" class="input" placeholder="توضیح کوتاه" />

          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 mb-1.5">سطح قیمت</div>
            <div class="grid grid-cols-4 gap-2">
              <button v-for="n in 4" :key="n" type="button" @click="form.priceLevel = n" class="py-2 rounded-2xl border-2 transition active:scale-95 font-bold" :class="form.priceLevel === n ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20 text-ink-700'">
                {{ '$'.repeat(n) }}
              </button>
            </div>
          </div>

          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 mb-1.5">برچسب‌های نوع غذا</div>
            <div class="flex gap-2">
              <input v-model="cuisineInput" @keyup.enter.prevent="addCuisine" class="input flex-1" placeholder="مثلاً ایتالیایی، گیاهی، مناسب خانواده" />
              <button type="button" @click="addCuisine" class="ios-card px-4 font-semibold text-teal-700 active:scale-95">افزودن</button>
            </div>
            <div v-if="form.cuisineTags.length" class="flex flex-wrap gap-1.5 mt-2">
              <span v-for="t in form.cuisineTags" :key="t" class="chip bg-teal-50 text-teal-700 cursor-pointer" @click="removeCuisine(t)">
                {{ t }} <i class="fa-solid fa-xmark text-[9px]"></i>
              </span>
            </div>
          </div>

          <div class="text-xs uppercase font-semibold text-ink-500 pt-3 border-t border-cream-200">نشانی</div>
          <input v-model="form.address.street" class="input" placeholder="نشانی خیابان" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model="form.address.city" class="input" placeholder="شهر" />
            <input v-model="form.address.state" class="input" placeholder="استان" />
          </div>
          <input v-model="form.address.zip" class="input" placeholder="کد پستی" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model.number="form.address.lat" type="number" step="0.0001" class="input" placeholder="عرض جغرافیایی" />
            <input v-model.number="form.address.lng" type="number" step="0.0001" class="input" placeholder="طول جغرافیایی" />
          </div>

          <input v-model="form.phone" type="tel" class="input" placeholder="تلفن" />

          <div class="text-xs uppercase font-semibold text-ink-500 pt-3 border-t border-cream-200">
            <i class="fa-regular fa-clock"></i> ساعات هپی اَور
          </div>
          <p class="text-xs text-ink-500">تعیین کنید کوپن‌های شما چه زمانی فعال هستند. مشتریان فقط در این ساعات می‌توانند کوپن دریافت کنند.</p>
          <div v-for="(slot, i) in form.offPeakHours" :key="i" class="ios-card p-3 space-y-2">
            <select v-model="slot.day" class="input text-sm">
              <option value="daily">هر روز</option>
              <option v-for="d in DAYS" :key="d.key" :value="d.key">{{ d.label }}</option>
            </select>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="slot.start" type="time" class="input text-sm" />
              <input v-model="slot.end" type="time" class="input text-sm" />
            </div>
            <button type="button" @click="removeOffPeakSlot(i)" class="text-coral-600 text-xs font-semibold"><i class="fa-solid fa-trash mr-1"></i>حذف</button>
          </div>
          <button type="button" @click="addOffPeakSlot" class="ios-card w-full p-3 text-teal-700 font-semibold active:scale-95">
            <i class="fa-solid fa-plus mr-1"></i> افزودن بازه هپی اَور
          </button>

          <div v-if="saveError" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 p-3 text-sm text-coral-700">
            <i class="fa-solid fa-triangle-exclamation mr-1"></i>{{ saveError }}
            <router-link v-if="saveError.toLowerCase().includes('plan')" to="/vendor/pricing" class="block mt-2 text-teal-700 font-semibold underline">مشاهده تعرفه‌ها و ارتقا ←</router-link>
          </div>
          <button type="submit" :disabled="saving" class="ios-button-primary w-full mt-3">{{ saving ? 'در حال ذخیره…' : (editing ? 'ذخیره تغییرات' : 'ساخت شعبه') }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
