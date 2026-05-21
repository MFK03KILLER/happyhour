<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();
const openFaq = ref(null);

const features = [
  { icon: '🍽', title: 'صدها رستوران و کافه', desc: 'بهترین رستوران‌ها و کافه‌های تهران در یک اپلیکیشن.' },
  { icon: '💰', title: 'تا ۷۰٪ تخفیف', desc: 'به جای پرداخت کامل، فقط بخشی از قیمت را بدهید.' },
  { icon: '📱', title: 'QR یا کد ۶ رقمی', desc: 'در صندوق، یا کد یا QR را نشان دهید — تمام شد.' },
  { icon: '🔥', title: 'پاکت‌های شگفتی', desc: 'آخر شب رستوران‌ها مازادشان را با تخفیف ویژه ارائه می‌دهند.' },
];

const faqs = [
  { q: 'چگونه از تخفیف‌ها استفاده کنم؟', a: 'عضو شوید، کوپن مورد علاقه‌تان را انتخاب کنید و در محل کسب‌وکار QR یا کد را به متصدی نشان دهید.' },
  { q: 'هزینه عضویت چقدر است؟', a: 'ماهانه ۲۹۹٬۰۰۰ تومان. می‌توانید هر زمان لغو کنید.' },
  { q: 'چند بار می‌توانم از یک کوپن استفاده کنم؟', a: 'بسته به کوپن — برخی فقط یک بار، برخی تا ۵ بار قابل استفاده هستند.' },
  { q: 'آیا فقط تهران است؟', a: 'فعلاً تهران. به‌زودی اصفهان، شیراز و مشهد.' },
];
</script>

<template>
  <div class="min-h-screen bg-cream-100">
    <header class="safe-top px-5 pt-6 pb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
        </div>
        <div class="font-bold text-lg">هپی‌اَور</div>
      </div>
      <button @click="router.push('/login')" class="text-sm font-semibold text-teal-700">ورود</button>
    </header>

    <section class="px-5 mt-6">
      <div class="rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white p-8 relative overflow-hidden shadow-lift">
        <div class="absolute -left-8 -top-8 w-48 h-48 rounded-full bg-white/10"></div>
        <div class="absolute left-12 bottom-2 w-32 h-32 rounded-full bg-coral-500/20"></div>
        <div class="relative">
          <div class="text-xs uppercase tracking-wider font-semibold opacity-80">عضویت هپی‌اَور</div>
          <h1 class="mt-2 text-3xl font-bold leading-tight">بخور، بنوش، تفریح کن<br/>با تخفیف‌های عالی</h1>
          <p class="mt-3 text-cream-50/90">با ۲۹۹٬۰۰۰ تومان در ماه، به صدها رستوران، کافه و مرکز سرگرمی دسترسی داشته باشید.</p>
          <button @click="router.push('/login')" class="mt-6 bg-white text-teal-700 font-bold rounded-full px-6 py-3 active:scale-95 transition shadow-soft">
            شروع کنید →
          </button>
        </div>
      </div>
    </section>

    <section class="px-5 mt-10">
      <h2 class="text-xl font-bold mb-4">چرا هپی‌اَور؟</h2>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="f in features" :key="f.title" class="ios-card p-4">
          <div class="text-3xl mb-2">{{ f.icon }}</div>
          <div class="font-bold text-sm">{{ f.title }}</div>
          <div class="text-xs text-ink-500 mt-1 leading-relaxed">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <section class="px-5 mt-10">
      <h2 class="text-xl font-bold mb-4">قیمت‌گذاری ساده</h2>
      <div class="ios-card p-6">
        <div class="text-xs uppercase tracking-wider text-teal-700 font-semibold">عضویت ماهانه</div>
        <div class="flex items-baseline gap-2 mt-2">
          <div class="text-4xl font-bold">۲۹۹٬۰۰۰</div>
          <div class="text-ink-500">تومان / ماه</div>
        </div>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="flex items-center gap-2"><span class="text-teal-600">✓</span> دسترسی نامحدود به همه کوپن‌ها</li>
          <li class="flex items-center gap-2"><span class="text-teal-600">✓</span> پاکت‌های شگفتی با تا ۷۰٪ تخفیف</li>
          <li class="flex items-center gap-2"><span class="text-teal-600">✓</span> لغو در هر زمان، بدون قید</li>
          <li class="flex items-center gap-2"><span class="text-teal-600">✓</span> پشتیبانی ۲۴ ساعته</li>
        </ul>
        <button @click="router.push('/login')" class="ios-button-primary w-full mt-5">عضو شدن</button>
      </div>
    </section>

    <section class="px-5 mt-10">
      <h2 class="text-xl font-bold mb-4">سوالات متداول</h2>
      <div class="space-y-2">
        <div v-for="(f, i) in faqs" :key="i" class="ios-card overflow-hidden">
          <button @click="openFaq = openFaq === i ? null : i" class="w-full p-4 flex items-center justify-between text-right">
            <div class="font-semibold text-sm">{{ f.q }}</div>
            <svg class="w-5 h-5 text-ink-300 transition-transform" :class="openFaq === i ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div v-if="openFaq === i" class="px-4 pb-4 text-sm text-ink-700 leading-relaxed">{{ f.a }}</div>
        </div>
      </div>
    </section>

    <footer class="px-5 mt-12 pb-10 text-center">
      <button @click="router.push('/login')" class="ios-button-primary px-8">عضویت یا ورود</button>
      <div class="mt-6 text-[11px] text-ink-300">© هپی‌اَور · دمو</div>
    </footer>
  </div>
</template>
