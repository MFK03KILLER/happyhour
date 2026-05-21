<script setup>
import { onMounted, ref, watch } from 'vue';
import client from '../../api/client';
import { toman, persianDateTime, persianNumber, methodLabel, statusLabel } from '../../composables/useFormat';

const items = ref([]);
const total = ref(0);
const page = ref(1);
const limit = 20;
const loading = ref(true);
const filters = ref({ method: '', kind: '', status: '' });

async function load() {
  loading.value = true;
  try {
    const params = { page: page.value, limit };
    if (filters.value.method) params.method = filters.value.method;
    if (filters.value.kind) params.kind = filters.value.kind;
    if (filters.value.status) params.status = filters.value.status;
    const { data } = await client.get('/admin/payments', { params });
    items.value = data.items;
    total.value = data.total;
  } finally { loading.value = false; }
}

onMounted(load);
watch(filters, load, { deep: true });
watch(page, load);

function kindLabel(k) { return { subscription: 'عضویت', coupon_purchase: 'خرید کوپن', other: 'سایر' }[k] || 'سایر'; }
function kindColor(k) { return { subscription: 'bg-teal-50 text-teal-700', coupon_purchase: 'bg-coral-500/10 text-coral-600', other: 'bg-cream-200 text-ink-700' }[k] || 'bg-cream-200 text-ink-700'; }
function methodColor(m) { return { zibal: 'bg-teal-50 text-teal-700', zarinpal: 'bg-yellow-100 text-yellow-700', saman: 'bg-blue-100 text-blue-700', card_to_card: 'bg-cream-200 text-ink-700' }[m] || 'bg-cream-200 text-ink-700'; }
function statusColor(s) { return { succeeded: 'bg-green-100 text-green-700', failed: 'bg-coral-500/10 text-coral-600', refunded: 'bg-cream-200 text-ink-500' }[s] || 'bg-cream-200 text-ink-500'; }
function totalPages() { return Math.max(1, Math.ceil(total.value / limit)); }
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">پرداخت‌ها</h1>
        <p class="text-ink-500 mt-1">تراکنش‌های کل پلتفرم</p>
      </div>
      <div class="text-sm text-ink-500">{{ persianNumber(total) }} تراکنش</div>
    </div>

    <div class="mt-6 ios-card p-4 flex flex-wrap gap-3">
      <select v-model="filters.method" class="input md:max-w-[200px]">
        <option value="">همه درگاه‌ها</option>
        <option value="zibal">زیبال</option>
        <option value="zarinpal">زرین‌پال</option>
        <option value="saman">بانک سامان</option>
        <option value="card_to_card">کارت به کارت</option>
      </select>
      <select v-model="filters.kind" class="input md:max-w-[200px]">
        <option value="">همه انواع</option>
        <option value="subscription">عضویت</option>
        <option value="coupon_purchase">خرید کوپن</option>
        <option value="other">سایر</option>
      </select>
      <select v-model="filters.status" class="input md:max-w-[200px]">
        <option value="">همه وضعیت‌ها</option>
        <option value="succeeded">موفق</option>
        <option value="failed">ناموفق</option>
        <option value="refunded">بازپرداخت</option>
      </select>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 8" :key="i" class="ios-card h-16 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-12 text-center text-ink-500">پرداختی یافت نشد.</div>
    <div v-else class="mt-6">
      <div class="hidden md:block ios-card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-cream-100 text-right">
            <tr>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase">تاریخ</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase">مشتری</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase">نوع</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase">عنوان</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase">درگاه</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase">وضعیت</th>
              <th class="px-4 py-3 font-semibold text-ink-500 text-xs uppercase text-left">مبلغ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cream-200">
            <tr v-for="p in items" :key="p._id" class="hover:bg-cream-100/50">
              <td class="px-4 py-3 text-ink-700">{{ persianDateTime(p.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="font-semibold">{{ p.customerId?.fullName }}</div>
                <div class="text-xs text-ink-500" dir="ltr">{{ p.customerId?.phone }}</div>
              </td>
              <td class="px-4 py-3"><span class="chip" :class="kindColor(p.context?.kind)">{{ kindLabel(p.context?.kind) }}</span></td>
              <td class="px-4 py-3 text-ink-700 truncate max-w-[200px]">{{ p.context?.label || '—' }}</td>
              <td class="px-4 py-3"><span class="chip" :class="methodColor(p.method)">{{ methodLabel(p.method) }}</span></td>
              <td class="px-4 py-3"><span class="chip" :class="statusColor(p.status)">{{ statusLabel(p.status) }}</span></td>
              <td class="px-4 py-3 text-left font-bold text-teal-700">{{ toman(p.amountUSD) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div v-for="p in items" :key="p._id" class="ios-card p-4">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <div class="font-semibold truncate">{{ p.customerId?.fullName }}</div>
              <div class="text-xs text-ink-500 truncate">{{ p.context?.label }}</div>
              <div class="text-[10px] text-ink-300 mt-0.5">{{ persianDateTime(p.createdAt) }}</div>
            </div>
            <div class="text-left">
              <div class="font-bold text-teal-700">{{ toman(p.amountUSD) }}</div>
              <span class="chip text-[10px]" :class="statusColor(p.status)">{{ statusLabel(p.status) }}</span>
            </div>
          </div>
          <div class="flex gap-1.5 mt-2 flex-wrap">
            <span class="chip text-[10px]" :class="kindColor(p.context?.kind)">{{ kindLabel(p.context?.kind) }}</span>
            <span class="chip text-[10px]" :class="methodColor(p.method)">{{ methodLabel(p.method) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <button @click="page > 1 && (page--)" :disabled="page <= 1" class="ios-card px-4 py-2 text-sm font-semibold disabled:opacity-40 active:scale-95">→ قبلی</button>
        <div class="text-sm text-ink-500">صفحه {{ persianNumber(page) }} از {{ persianNumber(totalPages()) }}</div>
        <button @click="page < totalPages() && (page++)" :disabled="page >= totalPages()" class="ios-card px-4 py-2 text-sm font-semibold disabled:opacity-40 active:scale-95">بعدی ←</button>
      </div>
    </div>
  </div>
</template>
