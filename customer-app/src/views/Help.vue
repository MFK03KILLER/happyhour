<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();
const openFaq = ref(null);

const faqs = [
  { q: 'چگونه عضو هپی‌اَور شوم؟', a: 'فقط شماره موبایل خود را وارد کنید، کد تایید بفرستیم و عضو شوید.' },
  { q: 'هزینه عضویت چقدر است؟', a: 'ماهانه ۲۹۹٬۰۰۰ تومان یا سالانه ۲٬۹۹۰٬۰۰۰ تومان (با ۱۷٪ صرفه‌جویی).' },
  { q: 'چگونه از کوپن استفاده کنم؟', a: 'کوپن خود را در کیف من باز کنید، QR را به متصدی صندوق نشان دهید و او اسکن می‌کند.' },
  { q: 'آیا می‌توانم عضویت را لغو کنم؟', a: 'بله، هر زمان می‌توانید از صفحه عضویت لغو کنید. تا پایان دوره فعلی، خدمات شما فعال است.' },
  { q: 'چند بار می‌توانم از یک کوپن استفاده کنم؟', a: 'این به نوع کوپن بستگی دارد — برخی یک بار، برخی تا ۵ بار قابل استفاده‌اند.' },
  { q: 'آیا اطلاعات من امن است؟', a: 'بله، تمام اطلاعات با رمزنگاری ذخیره می‌شوند و فقط شما به آن‌ها دسترسی دارید.' },
];
</script>

<template>
  <div class="min-h-screen safe-top pb-12">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 5l7 7-7 7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -mr-8">راهنما و پشتیبانی</div>
    </header>

    <div class="px-5 mt-6 space-y-4">
      <div class="ios-card p-5 text-center">
        <div class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 11v3a8 8 0 0 0 16 0v-3"/><path d="M9 17h6"/><circle cx="12" cy="11" r="3"/></svg>
        </div>
        <div class="mt-3 font-bold">نیاز به کمک دارید؟</div>
        <p class="text-sm text-ink-500 mt-1">تیم پشتیبانی ما ۲۴/۷ آماده است.</p>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <a href="tel:+982188888888" class="ios-button-primary w-full text-sm">تماس</a>
          <a href="mailto:support@happyhour.ir" class="ios-button-secondary w-full text-sm">ایمیل</a>
        </div>
      </div>

      <div>
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider pt-2 px-2 mb-2">سوالات متداول</div>
        <div class="space-y-2">
          <div v-for="(f, i) in faqs" :key="i" class="ios-card overflow-hidden">
            <button @click="openFaq = openFaq === i ? null : i" class="w-full p-4 flex items-center justify-between text-right">
              <div class="font-semibold text-sm">{{ f.q }}</div>
              <svg class="w-5 h-5 text-ink-300 transition-transform" :class="openFaq === i ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div v-if="openFaq === i" class="px-4 pb-4 text-sm text-ink-700 leading-relaxed">{{ f.a }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
