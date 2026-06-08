<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const globals = ref([]);
const customs = ref([]);
const todayInfo = ref(null);
const year = ref(new Date().getFullYear());
const showAdd = ref(false);
const newHoliday = ref({ date: '', name: '' });

function can(p) { return (auth.user?.permissions || []).includes(p); }

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/merchant/holidays', { params: { year: year.value } });
    globals.value = data.global || [];
    customs.value = data.custom || [];
    todayInfo.value = data.todayIsHoliday || null;
  } finally { loading.value = false; }
}

async function addCustom() {
  if (!newHoliday.value.date || !newHoliday.value.name) return;
  saving.value = true;
  try {
    await client.post('/merchant/holidays', newHoliday.value);
    newHoliday.value = { date: '', name: '' };
    showAdd.value = false;
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Failed to add holiday');
  } finally { saving.value = false; }
}

async function removeCustom(h) {
  if (!confirm(`Remove "${h.name}" (${h.date}) from your custom holidays?`)) return;
  try {
    await client.delete(`/merchant/holidays/${h._id}`);
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Failed to remove');
  }
}

const yearOptions = computed(() => {
  const now = new Date().getFullYear();
  return [now, now + 1, now + 2];
});

function fmtDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

async function doLogout() { await auth.logout(); router.push('/login'); }

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-cream-100 pb-28">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white safe-top px-5 pb-8 rounded-b-3xl">
      <div class="pt-2 flex items-center justify-between">
        <div>
          <div class="text-xs opacity-80 font-semibold uppercase tracking-wider">شعبه شما</div>
          <h1 class="text-2xl font-bold mt-0.5">تعطیلات</h1>
        </div>
        <select v-model="year" @change="load" class="bg-white/15 backdrop-blur text-white text-sm font-semibold rounded-full px-3 py-1.5 border border-white/30">
          <option v-for="y in yearOptions" :key="y" :value="y" class="text-ink-700">{{ y }}</option>
        </select>
      </div>
      <p class="mt-3 text-sm opacity-90">کوپن‌هایی که گزینه‌ی «غیرفعال در تعطیلات» روشن دارند (پیش‌فرض)، در این روزها در دسترس نخواهند بود.</p>
    </header>

    <div class="px-5 -mt-6 space-y-4">
      <div v-if="todayInfo" class="ios-card p-4 border-2 border-coral-500/40 bg-coral-500/5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-coral-500/10 text-coral-600 flex items-center justify-center"><i class="fa-solid fa-calendar-xmark"></i></div>
          <div>
            <div class="font-bold text-coral-600">امروز تعطیل است</div>
            <div class="text-sm text-ink-700">{{ todayInfo.name }} — کوپن‌های تعطیلات‌غیرفعال متوقف شده‌اند.</div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="ios-card h-32 animate-pulse"></div>

      <template v-else>
        <!-- Custom holidays -->
        <div class="ios-card p-5">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold">تعطیلات اختصاصی شعبه</div>
              <div class="text-xs text-ink-500">روزهایی که شعبه‌ی شما تعطیل است.</div>
            </div>
            <button v-if="can('manage_hours')" @click="showAdd = !showAdd" class="bg-teal-600 text-white px-3 py-1.5 rounded-full text-sm font-bold active:scale-95">
              <i class="fa-solid fa-plus mr-1"></i>افزودن
            </button>
          </div>

          <form v-if="showAdd && can('manage_hours')" @submit.prevent="addCustom" class="mt-3 space-y-2">
            <input v-model="newHoliday.date" type="date" class="input" required />
            <input v-model="newHoliday.name" class="input" placeholder="عنوان (مثلاً: عید نوروز، تعطیلات نوروزی)" required maxlength="60" />
            <div class="flex gap-2">
              <button type="button" @click="showAdd = false" class="ios-card flex-1 py-2.5 font-semibold text-ink-700">انصراف</button>
              <button type="submit" :disabled="saving" class="ios-button-primary flex-1">{{ saving ? 'در حال افزودن…' : 'افزودن تعطیلی' }}</button>
            </div>
          </form>

          <div v-if="customs.length === 0" class="mt-3 text-sm text-ink-500 italic">هنوز تعطیلی اختصاصی ثبت نکرده‌اید.</div>
          <div v-else class="mt-3 space-y-1.5">
            <div v-for="h in customs" :key="h._id" class="flex items-center justify-between py-2 px-3 rounded-2xl hover:bg-cream-100">
              <div class="min-w-0">
                <div class="font-semibold truncate">{{ h.name }}</div>
                <div class="text-xs text-ink-500">{{ fmtDate(h.date) }} · {{ h.date }}</div>
              </div>
              <button v-if="can('manage_hours')" @click="removeCustom(h)" class="text-coral-600 text-xs font-semibold ml-2"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>

        <!-- Global (US federal) holidays -->
        <div class="ios-card p-5">
          <div class="font-bold">تعطیلات رسمی · {{ year }}</div>
          <p class="text-xs text-ink-500 mt-1">خودکار. اگر می‌خواهید یک کوپن در تعطیلات رسمی هم فعال باشد، کوپن را ویرایش کنید و گزینه‌ی «غیرفعال در تعطیلات» را بردارید.</p>
          <div v-if="globals.length === 0" class="mt-3 text-sm text-ink-500 italic">هنوز تعطیلات رسمی seed نشده — اسکریپت seed را روی سرور اجرا کنید.</div>
          <div v-else class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div v-for="h in globals" :key="h._id" class="flex items-center justify-between py-2 px-3 rounded-2xl bg-cream-100">
              <div class="min-w-0">
                <div class="font-semibold text-sm truncate">{{ h.name }}</div>
                <div class="text-[11px] text-ink-500">{{ fmtDate(h.date) }}</div>
              </div>
              <span class="chip bg-teal-50 text-teal-700 text-[10px]">رسمی</span>
            </div>
          </div>
        </div>

        <button @click="doLogout" class="ios-card w-full p-4 text-coral-600 font-semibold active:bg-cream-100 text-center">خروج</button>
      </template>
    </div>
  </div>
</template>
