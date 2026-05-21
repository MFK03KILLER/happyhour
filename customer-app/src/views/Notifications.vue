<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const settings = ref({
  newOffers: true,
  expiringCoupons: true,
  pickupReminders: true,
  promotions: false,
  push: true,
  sms: false,
});
</script>

<template>
  <div class="min-h-screen safe-top pb-12">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -mr-8">اعلان‌ها</div>
    </header>

    <div class="px-5 mt-6 space-y-4">
      <div class="ios-card divide-y divide-cream-200">
        <div class="p-4 flex items-center justify-between">
          <div>
            <div class="font-semibold">پیشنهادهای جدید</div>
            <div class="text-xs text-ink-500 mt-0.5">وقتی کوپن جدیدی نزدیک شما باشد</div>
          </div>
          <label class="relative inline-block w-11 h-6">
            <input type="checkbox" v-model="settings.newOffers" class="sr-only peer" />
            <span class="absolute inset-0 bg-cream-200 peer-checked:bg-teal-600 rounded-full transition cursor-pointer"></span>
            <span class="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-[-1.25rem]"></span>
          </label>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div>
            <div class="font-semibold">کوپن‌های در حال انقضا</div>
            <div class="text-xs text-ink-500 mt-0.5">یادآوری قبل از تمام شدن اعتبار</div>
          </div>
          <label class="relative inline-block w-11 h-6">
            <input type="checkbox" v-model="settings.expiringCoupons" class="sr-only peer" />
            <span class="absolute inset-0 bg-cream-200 peer-checked:bg-teal-600 rounded-full transition cursor-pointer"></span>
            <span class="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-[-1.25rem]"></span>
          </label>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div>
            <div class="font-semibold">یادآوری تحویل</div>
            <div class="text-xs text-ink-500 mt-0.5">وقتی بازه تحویل پاکت نزدیک است</div>
          </div>
          <label class="relative inline-block w-11 h-6">
            <input type="checkbox" v-model="settings.pickupReminders" class="sr-only peer" />
            <span class="absolute inset-0 bg-cream-200 peer-checked:bg-teal-600 rounded-full transition cursor-pointer"></span>
            <span class="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-[-1.25rem]"></span>
          </label>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div>
            <div class="font-semibold">پیشنهادهای ویژه</div>
            <div class="text-xs text-ink-500 mt-0.5">تخفیف‌های لحظه‌ای و رویدادها</div>
          </div>
          <label class="relative inline-block w-11 h-6">
            <input type="checkbox" v-model="settings.promotions" class="sr-only peer" />
            <span class="absolute inset-0 bg-cream-200 peer-checked:bg-teal-600 rounded-full transition cursor-pointer"></span>
            <span class="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-[-1.25rem]"></span>
          </label>
        </div>
      </div>

      <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider pt-2 px-2">روش اطلاع‌رسانی</div>
      <div class="ios-card divide-y divide-cream-200">
        <div class="p-4 flex items-center justify-between">
          <div class="font-semibold">اعلان پوش (مرورگر/PWA)</div>
          <label class="relative inline-block w-11 h-6">
            <input type="checkbox" v-model="settings.push" class="sr-only peer" />
            <span class="absolute inset-0 bg-cream-200 peer-checked:bg-teal-600 rounded-full transition cursor-pointer"></span>
            <span class="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-[-1.25rem]"></span>
          </label>
        </div>
        <div class="p-4 flex items-center justify-between">
          <div class="font-semibold">پیامک</div>
          <label class="relative inline-block w-11 h-6">
            <input type="checkbox" v-model="settings.sms" class="sr-only peer" />
            <span class="absolute inset-0 bg-cream-200 peer-checked:bg-teal-600 rounded-full transition cursor-pointer"></span>
            <span class="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-[-1.25rem]"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
