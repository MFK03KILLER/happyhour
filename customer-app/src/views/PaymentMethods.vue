<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="min-h-screen safe-top pb-12">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -mr-8">روش‌های پرداخت</div>
    </header>

    <div class="px-5 mt-6 space-y-3">
      <div class="ios-card p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">Z</div>
        <div class="flex-1">
          <div class="font-bold">زیبال</div>
          <div class="text-xs text-ink-500">پرداخت با کارت بانکی</div>
        </div>
        <span class="chip bg-green-100 text-green-700">پیش‌فرض</span>
      </div>

      <div class="ios-card p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center text-white font-bold">ز</div>
        <div class="flex-1">
          <div class="font-bold">زرین‌پال</div>
          <div class="text-xs text-ink-500">سامانه پرداخت آنلاین</div>
        </div>
      </div>

      <div class="ios-card p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center text-ink-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
        </div>
        <div class="flex-1">
          <div class="font-bold">کارت به کارت</div>
          <div class="text-xs text-ink-500">پرداخت با کارت بانکی</div>
        </div>
      </div>

      <button class="ios-card w-full p-5 text-center text-teal-700 font-semibold active:bg-cream-100">
        + افزودن روش جدید
      </button>

      <div class="ios-card p-4 bg-cream-100 border border-ink-300/20">
        <div class="text-sm text-ink-700 leading-relaxed">
          💡 در نسخه دمو، پرداخت‌ها شبیه‌سازی شده‌اند و مبلغی کسر نمی‌شود. در نسخه نهایی، درگاه‌های زیبال و زرین‌پال به‌صورت واقعی پردازش خواهند شد.
        </div>
      </div>
    </div>
  </div>
</template>
