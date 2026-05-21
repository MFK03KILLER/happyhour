<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function doLogout() {
  await auth.logout();
  router.push('/welcome');
}
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6">
      <h1 class="text-3xl font-bold tracking-tight">حساب کاربری</h1>
    </header>

    <section class="mt-6 px-5">
      <div class="ios-card p-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center text-xl font-bold">
          {{ auth.user?.fullName?.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-lg truncate">{{ auth.user?.fullName }}</div>
          <div class="text-ink-500 text-sm truncate" dir="ltr">{{ auth.user?.phone }}</div>
        </div>
      </div>
    </section>

    <section class="mt-5 px-5 space-y-2">
      <button @click="router.push('/subscribe')" class="ios-card w-full p-4 flex items-center justify-between active:bg-cream-100">
        <span class="font-medium">عضویت</span>
        <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m15 5-7 7 7 7"/></svg>
      </button>

      <div class="ios-card divide-y divide-cream-200">
        <button @click="router.push('/profile/payment-methods')" class="w-full flex items-center justify-between p-4 active:bg-cream-100">
          <span class="font-medium">روش‌های پرداخت</span>
          <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m15 5-7 7 7 7"/></svg>
        </button>
        <button @click="router.push('/profile/notifications')" class="w-full flex items-center justify-between p-4 active:bg-cream-100">
          <span class="font-medium">اعلان‌ها</span>
          <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m15 5-7 7 7 7"/></svg>
        </button>
        <button @click="router.push('/profile/help')" class="w-full flex items-center justify-between p-4 active:bg-cream-100">
          <span class="font-medium">راهنما و پشتیبانی</span>
          <svg class="w-5 h-5 text-ink-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="m15 5-7 7 7 7"/></svg>
        </button>
      </div>

      <button @click="doLogout" class="ios-card w-full p-4 text-coral-600 font-semibold active:bg-cream-100">
        خروج از حساب
      </button>
    </section>

    <div class="mt-8 text-center text-[11px] text-ink-300">هپی‌اَور دمو · ۱.۰</div>
  </div>
</template>
