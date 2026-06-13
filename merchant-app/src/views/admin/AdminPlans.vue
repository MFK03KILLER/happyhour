<script setup>
// ویرایش قیمت پلن‌های اشتراک (مشتری + مرچنت). تغییرات بلافاصله روی
// /public/plans و خریدهای جدید اعمال می‌شود (بدون نیاز به ری‌استارت سرور).
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';

const loading = ref(true);
const saving = ref(false);
const savedAt = ref(null);
const base = ref({ customer: {}, merchant: {} });
const overrides = ref({ customer: {}, merchant: {} });

// مدل فرم: برای هر audience/tier یک {monthly, yearly}. مقدار اولیه = effective (override یا base).
const form = ref({ customer: {}, merchant: {} });

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/plan-prices');
    base.value = data.base;
    overrides.value = data.overrides || { customer: {}, merchant: {} };
    // پر کردن فرم با قیمت موثر فعلی
    const f = { customer: {}, merchant: {} };
    for (const aud of ['customer', 'merchant']) {
      for (const row of data.effective[aud]) {
        f[aud][row.tier] = {
          label: row.label,
          monthly: row.price.monthly,
          yearly: row.price.yearly,
        };
      }
    }
    form.value = f;
  } finally { loading.value = false; }
}

async function save() {
  saving.value = true;
  try {
    // فقط tier های پولی را به‌عنوان override می‌فرستیم (basic رایگان است)
    const out = { customer: {}, merchant: {} };
    for (const aud of ['customer', 'merchant']) {
      for (const tier of Object.keys(form.value[aud])) {
        if (tier === 'basic') continue;
        const v = form.value[aud][tier];
        out[aud][tier] = { monthly: Number(v.monthly) || 0, yearly: Number(v.yearly) || 0 };
      }
    }
    await client.put('/admin/plan-prices', { overrides: out });
    savedAt.value = new Date();
    await load();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'ذخیره ناموفق بود');
  } finally { saving.value = false; }
}

async function resetToDefaults() {
  if (!confirm('قیمت‌ها به مقادیر پیش‌فرض برمی‌گردند. ادامه می‌دهید؟')) return;
  saving.value = true;
  try {
    await client.put('/admin/plan-prices', { overrides: { customer: {}, merchant: {} } });
    savedAt.value = new Date();
    await load();
  } finally { saving.value = false; }
}

function toman(n) {
  if (!n) return '۰';
  return Number(n).toLocaleString('fa-IR');
}

const audiences = [
  { key: 'customer', label: 'مشتری', icon: 'fa-user' },
  { key: 'merchant', label: 'مرچنت', icon: 'fa-store' },
];

// فقط tier های پولی نمایش داده می‌شوند
function paidTiers(aud) {
  return Object.entries(form.value[aud] || {}).filter(([t]) => t !== 'basic');
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">قیمت اشتراک‌ها</h1>
    <p class="text-ink-500 mt-1">قیمت پلن‌های اشتراک مشتری و مرچنت را اینجا ویرایش کنید. تغییرات بلافاصله اعمال می‌شود. همه‌ی مبالغ به تومان است.</p>

    <div v-if="loading" class="mt-6 ios-card h-64 animate-pulse"></div>

    <template v-else>
      <div v-for="aud in audiences" :key="aud.key" class="mt-6">
        <div class="flex items-center gap-2 mb-3">
          <i class="fa-solid text-teal-700" :class="aud.icon"></i>
          <h2 class="text-lg font-bold">پلن‌های {{ aud.label }}</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="[tier, v] in paidTiers(aud.key)" :key="tier" class="ios-card p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="font-bold">{{ v.label }}</div>
              <span class="chip bg-cream-200 text-ink-500 text-[10px] font-mono">{{ tier }}</span>
            </div>

            <label class="block text-xs uppercase font-semibold text-ink-500 mb-1">قیمت ماهانه (تومان)</label>
            <input v-model.number="form[aud.key][tier].monthly" type="number" min="0" step="1000" class="input mb-1" />
            <div class="text-xs text-ink-400 mb-3">{{ toman(form[aud.key][tier].monthly) }} تومان</div>

            <label class="block text-xs uppercase font-semibold text-ink-500 mb-1">قیمت سالانه (تومان)</label>
            <input v-model.number="form[aud.key][tier].yearly" type="number" min="0" step="1000" class="input mb-1" />
            <div class="text-xs text-ink-400">{{ toman(form[aud.key][tier].yearly) }} تومان</div>

            <div class="mt-3 pt-3 border-t border-cream-200 text-[11px] text-ink-400">
              پیش‌فرض: {{ toman(base[aud.key]?.[tier]?.monthly) }} ماهانه · {{ toman(base[aud.key]?.[tier]?.yearly) }} سالانه
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center gap-2 flex-wrap">
        <button :disabled="saving" @click="save" class="ios-button-primary">
          {{ saving ? 'در حال ذخیره…' : 'ذخیره قیمت‌ها' }}
        </button>
        <button :disabled="saving" @click="resetToDefaults" class="ios-card px-4 py-2.5 text-sm font-semibold text-ink-700">بازگشت به پیش‌فرض</button>
        <span v-if="savedAt" class="text-xs text-teal-700 font-semibold">✓ ذخیره شد در {{ savedAt.toLocaleTimeString('fa-IR') }}</span>
      </div>

      <div class="mt-8 ios-card p-5 bg-cream-100 border border-ink-300/20">
        <div class="text-sm font-bold mb-1">ℹ️ نکته</div>
        <ul class="text-sm text-ink-700 space-y-1 list-disc list-inside">
          <li>پلن «پایه» همیشه رایگان است و قابل ویرایش نیست.</li>
          <li>قیمت‌ها بلافاصله روی صفحه‌ی عضویت مشتری و پنل قیمت مرچنت اعمال می‌شوند.</li>
          <li>اشتراک‌های فعلی تا پایان دوره با قیمت قبلی ادامه می‌یابند؛ قیمت جدید برای خرید/تمدید بعدی است.</li>
          <li>هر تغییر در لاگ ممیزی ثبت می‌شود.</li>
        </ul>
      </div>
    </template>
  </div>
</template>
