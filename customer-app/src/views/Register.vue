<script setup>
// نسخه‌ی فارسی فقط از OTP استفاده می‌کند — این صفحه فقط برای back-compat قدیمی نگه داشته شده.
// ثبت‌نام در نسخه‌ی فارسی از طریق همان لاگین OTP انجام می‌شود.
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
onMounted(() => router.replace('/login'));
</script>

<template>
  <div class="min-h-screen flex items-center justify-center text-ink-500">
    در حال انتقال به صفحه ورود...
  </div>
</template>
