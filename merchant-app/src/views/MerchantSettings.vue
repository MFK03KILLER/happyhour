<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';
import TermsModal from '../components/TermsModal.vue';

const auth = useAuthStore();
const router = useRouter();
const merchant = ref(null);
const loading = ref(true);
const editing = ref(false);
const saving = ref(false);
const form = ref(null);
const showTerms = ref(false);

function can(p) { return (auth.user?.permissions || []).includes(p); }

const DAYS = [
  { key: 'mon', label: 'دوشنبه' }, { key: 'tue', label: 'سه‌شنبه' }, { key: 'wed', label: 'چهارشنبه' },
  { key: 'thu', label: 'پنجشنبه' }, { key: 'fri', label: 'جمعه' }, { key: 'sat', label: 'شنبه' }, { key: 'sun', label: 'یکشنبه' },
];

onMounted(load);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/merchant/me');
    merchant.value = data;
  } finally { loading.value = false; }
}

function openEdit() {
  form.value = {
    name: merchant.value.name,
    description: merchant.value.description || '',
    subCategory: merchant.value.subCategory || '',
    priceLevel: merchant.value.priceLevel || 2,
    phone: merchant.value.phone || '',
    coverImageUrl: merchant.value.coverImageUrl || '',
    logoUrl: merchant.value.logoUrl || '',
    address: { ...(merchant.value.address || {}) },
    offPeakHours: (merchant.value.offPeakHours || []).map((s) => ({ ...s })),
  };
  editing.value = true;
}

async function save() {
  saving.value = true;
  try {
    await client.put('/merchant/me', form.value);
    await load();
    editing.value = false;
  } finally { saving.value = false; }
}

function addSlot() {
  form.value.offPeakHours.push({ day: 'daily', start: '14:00', end: '17:00' });
}
function removeSlot(i) {
  form.value.offPeakHours.splice(i, 1);
}

async function doLogout() { await auth.logout(); router.push('/login'); }
</script>

<template>
  <div class="min-h-screen bg-cream-100 pb-28">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white safe-top px-5 pb-8 rounded-b-3xl">
      <div class="pt-2 flex items-center justify-between">
        <div>
          <div class="text-xs opacity-80 font-semibold uppercase tracking-wider">شعبه شما</div>
          <h1 class="text-2xl font-bold mt-0.5">فروشگاه</h1>
        </div>
        <button v-if="can('manage_hours') && !editing" @click="openEdit" class="bg-white text-teal-700 px-4 py-2 rounded-full text-sm font-bold active:scale-95">
          <i class="fa-solid fa-pen-to-square mr-1"></i>ویرایش
        </button>
      </div>
    </header>

    <div v-if="loading" class="px-5 -mt-6 space-y-4">
      <div class="ios-card h-32 animate-pulse"></div>
    </div>

    <template v-else-if="editing && form">
      <div class="px-5 -mt-6 space-y-3">
        <div class="ios-card p-5 space-y-3">
          <div class="text-xs uppercase font-semibold text-ink-500">اطلاعات پایه</div>
          <input v-model="form.name" class="input" placeholder="نام شعبه" required />
          <input v-model="form.description" class="input" placeholder="توضیح کوتاه" />
          <input v-model="form.subCategory" class="input" placeholder="زیردسته (مثلاً پیتزا، استیک‌هاوس)" />
          <div>
            <div class="text-xs text-ink-500 mb-1">سطح قیمت</div>
            <div class="grid grid-cols-4 gap-2">
              <button v-for="n in 4" :key="n" type="button" @click="form.priceLevel = n" class="py-2 rounded-2xl border-2 font-bold transition active:scale-95" :class="form.priceLevel === n ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20 text-ink-700'">
                {{ '﷼'.repeat(n) }}
              </button>
            </div>
          </div>
          <input v-model="form.phone" type="tel" class="input" placeholder="تلفن" dir="ltr" />
        </div>

        <div class="ios-card p-5 space-y-2">
          <div class="text-xs uppercase font-semibold text-ink-500">آدرس</div>
          <input v-model="form.address.street" class="input" placeholder="خیابان" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model="form.address.city" class="input" placeholder="شهر" />
            <input v-model="form.address.state" class="input" placeholder="استان" />
          </div>
          <input v-model="form.address.zip" class="input" placeholder="کد پستی" dir="ltr" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model.number="form.address.lat" type="number" step="0.0001" class="input" placeholder="عرض جغرافیایی" dir="ltr" />
            <input v-model.number="form.address.lng" type="number" step="0.0001" class="input" placeholder="طول جغرافیایی" dir="ltr" />
          </div>
        </div>

        <div class="ios-card p-5">
          <div class="text-xs uppercase font-semibold text-ink-500 mb-2"><i class="fa-regular fa-clock"></i> ساعات هپی اَور</div>
          <p class="text-xs text-ink-500 mb-3">کوپن‌ها فقط در این ساعات قابل استفاده هستند.</p>
          <div v-for="(slot, i) in form.offPeakHours" :key="i" class="ios-card p-3 mb-2 space-y-2">
            <select v-model="slot.day" class="input text-sm">
              <option value="daily">روزانه</option>
              <option v-for="d in DAYS" :key="d.key" :value="d.key">{{ d.label }}</option>
            </select>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="slot.start" type="time" class="input text-sm" />
              <input v-model="slot.end" type="time" class="input text-sm" />
            </div>
            <button type="button" @click="removeSlot(i)" class="text-coral-600 text-xs font-semibold"><i class="fa-solid fa-trash mr-1"></i>حذف</button>
          </div>
          <button type="button" @click="addSlot" class="ios-card w-full p-3 text-teal-700 font-semibold active:scale-95">
            <i class="fa-solid fa-plus mr-1"></i>افزودن بازه
          </button>
        </div>

        <div class="flex gap-2 pt-2">
          <button @click="editing = false" class="ios-card flex-1 py-3 font-semibold text-ink-700">انصراف</button>
          <button @click="save" :disabled="saving" class="ios-button-primary flex-1">{{ saving ? 'در حال ذخیره…' : 'ذخیره تغییرات' }}</button>
        </div>
      </div>
    </template>

    <div v-else-if="merchant" class="px-5 -mt-6 space-y-4">
      <div class="ios-card overflow-hidden">
        <div class="relative h-32 bg-cream-200">
          <img :src="imageFor(merchant)" class="w-full h-full object-cover" />
        </div>
        <div class="p-5 -mt-10 relative">
          <img :src="merchant.logoUrl || logoFor(merchant.name)" class="w-16 h-16 rounded-2xl object-cover bg-white shadow-lift" />
          <div class="mt-3">
            <div class="font-bold text-lg">{{ merchant.name }}</div>
            <div class="text-sm text-ink-500">{{ merchant.subCategory || merchant.category }} · {{ merchant.vendorId?.name }}</div>
          </div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">آدرس</div>
        <div class="mt-2">
          <div class="font-semibold">{{ merchant.address?.street }}</div>
          <div class="text-sm text-ink-500">{{ merchant.address?.city }}، {{ merchant.address?.state }} {{ merchant.address?.zip }}</div>
        </div>
        <div v-if="merchant.phone" class="mt-3 pt-3 border-t border-cream-200">
          <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">تلفن</div>
          <div class="font-semibold mt-1" dir="ltr">{{ merchant.phone }}</div>
        </div>
      </div>

      <div v-if="merchant.offPeakHours?.length" class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider"><i class="fa-regular fa-clock"></i> ساعات هپی اَور</div>
        <div class="mt-2 space-y-1.5">
          <div v-for="(s, i) in merchant.offPeakHours" :key="i" class="flex justify-between text-sm">
            <span class="font-semibold capitalize">{{ s.day }}</span>
            <span class="text-ink-500">{{ s.start }} – {{ s.end }}</span>
          </div>
        </div>
      </div>

      <div class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">کاربر فعلی</div>
        <div class="mt-2 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold">{{ auth.user?.fullName?.charAt(0) }}</div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">{{ auth.user?.fullName }}</div>
            <div class="text-xs text-ink-500 truncate">{{ auth.user?.email }}</div>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="p in (auth.user?.permissions || [])" :key="p" class="chip bg-cream-200 text-ink-500 text-[10px]">{{ p.replace(/_/g, ' ') }}</span>
        </div>
      </div>

      <button @click="doLogout" class="ios-card w-full p-4 text-coral-600 font-semibold active:bg-cream-100 text-center">
        خروج
      </button>

      <button @click="showTerms = true" class="block mx-auto text-xs text-ink-500 underline pt-2">
        <i class="fa-regular fa-file-lines mr-1"></i>قوانین و مقررات فروشگاه
      </button>
    </div>

    <TermsModal :show="showTerms" audience="merchant" @close="showTerms = false" />
  </div>
</template>
