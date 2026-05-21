<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';
import { useFlagsStore } from '../../stores/flags';

const items = ref([]);
const loading = ref(true);
const flagsStore = useFlagsStore();

const LABELS = {
  surprise_bag: { label: 'پاکت شگفتی', description: 'کوپن‌های لحظه‌آخری با قیمت ثابت و بدون نیاز به عضویت.' },
  subscription_tiers: { label: 'سطوح عضویت', description: 'چندین پلن عضویت (لایت / پلاس / پرو) به‌جای یک پلن واحد.' },
  maps: { label: 'نقشه', description: 'نقشه شعب نزدیک و لینک مسیریابی به نشان/بلد/گوگل مپ.' },
  push_notifications: { label: 'اعلان پوش', description: 'ارسال نوتیفیکیشن وب برای پیشنهادهای جدید.' },
  delivery: { label: 'تحویل به مقصد', description: 'امکان ارسال پاکت‌های شگفتی به آدرس مشتری.' },
  redemption_code: { label: 'کد ۶ رقمی', description: 'وارد کردن دستی کد به‌جای اسکن QR.' },
  referral_program: { label: 'برنامه دعوت دوستان', description: 'سیستم دعوت با پاداش برای هر دو طرف.' },
};

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/features');
    items.value = data.items;
  } finally { loading.value = false; }
}

async function toggle(flag) {
  const next = !flag.enabled;
  flag.enabled = next;
  try {
    await client.patch(`/admin/features/${flag.key}`, { enabled: next });
    await flagsStore.reload();
  } catch (e) {
    flag.enabled = !next;
    alert(e.response?.data?.error?.message || 'تغییر ناموفق');
  }
}

const grouped = computed(() => {
  const g = {};
  for (const it of items.value) {
    if (!g[it.group]) g[it.group] = [];
    g[it.group].push(it);
  }
  return g;
});

function groupLabel(g) { return { offers: 'پیشنهادها', discovery: 'کشف', engagement: 'تعامل با کاربر', redemption: 'استفاده', general: 'عمومی' }[g] || g; }
function labelFor(f) { return LABELS[f.key]?.label || f.label; }
function descFor(f) { return LABELS[f.key]?.description || f.description; }

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold">فیچرها</h1>
    <p class="text-ink-500 mt-1">روشن/خاموش کردن فیچرها برای کل پلتفرم. بصورت پیش‌فرض خاموش — در هر مرحله از پروژه روشن کنید.</p>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 4" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>

    <template v-else>
      <div v-for="(group, name) in grouped" :key="name" class="mt-6">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3">{{ groupLabel(name) }}</div>
        <div class="ios-card divide-y divide-cream-200">
          <div v-for="f in group" :key="f.key" class="p-5 flex items-start gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <div class="font-bold">{{ labelFor(f) }}</div>
                <span class="chip bg-cream-200 text-ink-500 font-mono text-[10px]" dir="ltr">{{ f.key }}</span>
                <span v-if="f.enabled" class="chip bg-green-100 text-green-700">روشن</span>
                <span v-else class="chip bg-cream-200 text-ink-500">خاموش</span>
              </div>
              <p class="text-sm text-ink-500 mt-1">{{ descFor(f) }}</p>
            </div>
            <button @click="toggle(f)" class="relative w-14 h-8 rounded-full transition-colors flex-shrink-0" :class="f.enabled ? 'bg-teal-600' : 'bg-cream-200'">
              <span class="absolute top-1 w-6 h-6 bg-white rounded-full shadow-soft transition-transform" :class="f.enabled ? 'translate-x-[-1.75rem]' : 'translate-x-[-0.25rem]'"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8 ios-card p-5 bg-cream-100 border border-ink-300/20">
        <div class="text-sm font-bold mb-1">ℹ️ نحوه کار فیچرها</div>
        <ul class="text-sm text-ink-700 space-y-1 list-disc list-inside">
          <li>خاموش کردن فیچر باعث می‌شود برای همه پنهان شود — UI، API و بک‌اند همگی مسدود می‌شوند.</li>
          <li>اپلیکیشن‌های مشتری و مرچنت در زمان لود وضعیت فیچرها را می‌گیرند. تغییرات با refresh صفحه اعمال می‌شود.</li>
          <li>هر تغییر در گزارش رویدادها ثبت می‌شود.</li>
        </ul>
      </div>
    </template>
  </div>
</template>
