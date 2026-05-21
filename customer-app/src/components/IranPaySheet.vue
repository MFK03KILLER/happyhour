<script setup>
import { ref } from 'vue';
import { toman } from '../composables/useFormat';

const props = defineProps({
  amount: { type: Number, required: true },
  merchantName: { type: String, default: 'هپی‌اَور' },
  itemName: { type: String, default: 'خرید' },
});
const emit = defineEmits(['confirm', 'close']);

const stage = ref('idle');

async function pay(method) {
  if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15);
  stage.value = 'redirect';
  await new Promise((r) => setTimeout(r, 1200));
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
            <div class="text-3xl font-bold mt-1">{{ toman(amount) }}</div>
            <div class="text-sm text-ink-500 mt-0.5">{{ itemName }}</div>
          </div>

          <div class="text-xs uppercase font-semibold text-ink-500 mb-3">انتخاب درگاه</div>

          <div class="space-y-3">
            <button @click="pay('zibal')" class="w-full bg-teal-50 border-2 border-teal-600 text-teal-800 rounded-2xl py-4 flex items-center justify-between px-5 font-semibold active:scale-[.98] transition">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">Z</div>
                <div class="text-right">
                  <div class="font-bold">زیبال</div>
                  <div class="text-[11px] opacity-70">امن، سریع، بدون کارمزد</div>
                </div>
              </div>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            </button>

            <button @click="pay('zarinpal')" class="w-full bg-white border border-ink-300/30 text-ink-900 rounded-2xl py-4 flex items-center justify-between px-5 font-semibold active:scale-[.98] transition">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-white font-bold">ز</div>
                <div class="text-right">
                  <div class="font-bold">زرین‌پال</div>
                  <div class="text-[11px] text-ink-500">پرداخت با کارت بانکی</div>
                </div>
              </div>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            </button>

            <button @click="pay('card_to_card')" class="w-full bg-cream-200 text-ink-900 rounded-2xl py-4 flex items-center justify-between px-5 font-semibold active:scale-[.98] transition">
              <div class="flex items-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
                <div class="text-right">
                  <div class="font-bold">کارت به کارت</div>
                  <div class="text-[11px] text-ink-500">از طریق کارت بانکی</div>
                </div>
              </div>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <div class="mt-4 text-center text-[11px] text-ink-300">
            پرداخت دمو — مبلغی از حساب شما کسر نمی‌شود
          </div>
        </div>

        <div v-else-if="stage==='redirect'" class="px-6 pt-8 pb-12 text-center">
          <div class="mx-auto w-20 h-20 rounded-full border-4 border-teal-600/20 border-t-teal-600 animate-spin"></div>
          <div class="mt-5 font-semibold">انتقال به درگاه پرداخت...</div>
          <div class="text-sm text-ink-500 mt-1">لطفاً صفحه را نبندید</div>
        </div>

        <div v-else-if="stage==='processing'" class="px-6 pt-8 pb-12 text-center">
          <div class="mx-auto w-20 h-20 rounded-full border-4 border-teal-600/20 border-t-teal-600 animate-spin"></div>
          <div class="mt-5 font-semibold">در حال تایید پرداخت</div>
          <div class="text-sm text-ink-500 mt-1">چند لحظه صبر کنید...</div>
        </div>

        <div v-else class="px-6 pt-8 pb-12 text-center animate-fade-in">
          <div class="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4 10-10"/></svg>
          </div>
          <div class="mt-5 text-xl font-bold">پرداخت موفق</div>
          <div class="text-sm text-ink-500 mt-1">کوپن به کیف شما اضافه شد.</div>
        </div>
      </div>
    </div>
  </teleport>
</template>
