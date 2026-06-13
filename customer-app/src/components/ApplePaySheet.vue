<script setup>
import { ref } from 'vue';

const props = defineProps({
  amount: { type: Number, required: true },
  merchantName: { type: String, default: 'Happy Hour Demo' },
  itemName: { type: String, default: 'Coupon' },
});
const emit = defineEmits(['confirm', 'close']);

const stage = ref('idle');

async function pay(method) {
  if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15);
  stage.value = 'processing';
  await new Promise((r) => setTimeout(r, 1500));
  stage.value = 'success';
  await new Promise((r) => setTimeout(r, 700));
  emit('confirm', method);
}
</script>

<template>
  <teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end justify-center">
      <div class="absolute inset-0 bg-black/40 animate-fade-in" @click="emit('close')"></div>
      <div class="relative w-full max-w-md bg-white rounded-t-3xl shadow-lift animate-slide-up pb-[max(env(safe-area-inset-bottom),24px)]">
        <div class="flex justify-center pt-3"><div class="w-10 h-1.5 bg-ink-300/40 rounded-full"></div></div>

        <div v-if="stage==='idle'" class="px-6 pt-4 pb-2">
          <div class="text-center mb-4">
            <div class="text-xs uppercase tracking-wider text-ink-300 font-semibold">پرداخت به {{ merchantName }}</div>
            <div class="text-3xl font-bold mt-1">{{ amount.toFixed(2) }} تومان</div>
            <div class="text-sm text-ink-500 mt-0.5">{{ itemName }}</div>
          </div>

          <div class="space-y-3">
            <button @click="pay('apple_pay')" class="w-full bg-black text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold active:scale-[.98] transition">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.46c-.02-2.42 1.98-3.58 2.07-3.64-1.13-1.65-2.88-1.88-3.5-1.9-1.49-.15-2.91.87-3.67.87-.77 0-1.93-.86-3.18-.83-1.63.02-3.14.95-3.98 2.41-1.7 2.95-.43 7.3 1.22 9.69.8 1.17 1.76 2.48 3.01 2.43 1.21-.05 1.67-.78 3.13-.78 1.46 0 1.87.78 3.16.75 1.31-.02 2.13-1.19 2.93-2.36.92-1.35 1.3-2.66 1.32-2.73-.03-.01-2.51-.96-2.53-3.81zM14.74 5.36c.66-.81 1.11-1.93.99-3.05-.96.04-2.13.64-2.82 1.44-.62.71-1.16 1.86-1.02 2.95 1.08.08 2.18-.55 2.85-1.34z"/></svg>
              پرداخت با اپل پی
            </button>
            <button @click="pay('google_pay')" class="w-full bg-white text-ink-900 border border-ink-300/40 rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold active:scale-[.98] transition">
              <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M12 11v3.2h4.6c-.2 1.2-.8 2.2-1.7 2.9l2.7 2.1c1.6-1.5 2.5-3.7 2.5-6.3 0-.6-.1-1.2-.2-1.9H12z"/><path fill="#34A853" d="M12 20c2.3 0 4.2-.8 5.6-2.1l-2.7-2.1c-.8.5-1.7.8-2.9.8-2.2 0-4.1-1.5-4.8-3.5L4.5 15c1.4 2.9 4.2 5 7.5 5z"/><path fill="#FBBC04" d="M7.2 13.1c-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6L4.5 7.8C3.9 9 3.5 10.4 3.5 12s.4 3 1 4.2l2.7-3.1z"/><path fill="#EA4335" d="M12 6.4c1.2 0 2.4.4 3.2 1.2L17.6 5C16.1 3.7 14.2 3 12 3c-3.3 0-6.1 2.1-7.5 5l2.7 2.1c.7-2 2.6-3.5 4.8-3.5z"/></svg>
              پرداخت با گوگل پی
            </button>
            <button @click="pay('card')" class="w-full bg-cream-200 text-ink-900 rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold active:scale-[.98] transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
              پرداخت با کارت · امکس •••• ۰۰۰۵
            </button>
          </div>

          <div class="mt-4 text-center text-[11px] text-ink-300">
            پرداخت آزمایشی — هیچ مبلغی واقعی کسر نمی‌شود. <span class="font-semibold">حالت آزمایشی</span>
          </div>
        </div>

        <div v-else-if="stage==='processing'" class="px-6 pt-8 pb-12 text-center">
          <div class="mx-auto w-20 h-20 rounded-full border-4 border-teal-600/20 border-t-teal-600 animate-spin"></div>
          <div class="mt-5 font-semibold">در حال تایید با Face ID</div>
          <div class="text-sm text-ink-500 mt-1">برای ادامه، دستگاه خود را نزدیک نگه دارید</div>
        </div>

        <div v-else class="px-6 pt-8 pb-12 text-center animate-fade-in">
          <div class="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4 10-10"/></svg>
          </div>
          <div class="mt-5 text-xl font-bold">پرداخت موفق</div>
          <div class="text-sm text-ink-500 mt-1">کوپن شما اکنون در کیف پول شماست.</div>
        </div>
      </div>
    </div>
  </teleport>
</template>
