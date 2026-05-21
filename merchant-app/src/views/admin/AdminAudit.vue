<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';
import { persianDateTime } from '../../composables/useFormat';

const items = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/audit-logs');
    items.value = data.items;
  } finally { loading.value = false; }
});

function actionLabel(a) {
  const map = {
    'vendor.create': 'ایجاد بیزنس', 'vendor.update': 'ویرایش بیزنس', 'vendor.delete': 'حذف بیزنس',
    'merchant.create': 'ایجاد شعبه', 'merchant.update': 'ویرایش شعبه', 'merchant.delete': 'حذف شعبه',
    'coupon.create': 'ایجاد کوپن', 'coupon.update': 'ویرایش کوپن', 'coupon.delete': 'حذف کوپن',
    'user.create': 'ایجاد کاربر', 'user.update': 'ویرایش کاربر', 'user.delete': 'حذف کاربر',
    'feature.toggle': 'تغییر فیچر',
  };
  return map[a] || a;
}
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold">گزارش رویدادها</h1>
    <p class="text-ink-500 mt-1">تمام اقدامات مدیر در سیستم ثبت می‌شوند.</p>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 6" :key="i" class="ios-card h-16 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-12 text-center text-ink-500">هنوز رویدادی ثبت نشده.</div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="a in items" :key="a._id" class="p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center text-ink-500 mt-0.5 flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l3 2"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold">{{ actionLabel(a.action) }}</div>
          <div class="text-sm text-ink-500 truncate">
            {{ a.actorUserId?.fullName }} · {{ a.targetType }}
          </div>
        </div>
        <div class="text-[11px] text-ink-300 flex-shrink-0">{{ persianDateTime(a.createdAt) }}</div>
      </div>
    </div>
  </div>
</template>
