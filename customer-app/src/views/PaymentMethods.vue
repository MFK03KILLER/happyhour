<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const methods = ref([
  { id: '1', type: 'apple_pay', label: 'Apple Pay', sub: 'Amex •••• 0005', primary: true },
  { id: '2', type: 'card', label: 'Visa •••• 4242', sub: 'Expires 09/28', primary: false },
]);
const showAdd = ref(false);
</script>

<template>
  <div class="min-h-screen pb-12 safe-top">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Payment methods</div>
    </header>

    <section class="px-5 mt-6 space-y-3">
      <div v-for="m in methods" :key="m.id" class="ios-card p-4 flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center">
          <svg v-if="m.type==='apple_pay'" class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.46c-.02-2.42 1.98-3.58 2.07-3.64-1.13-1.65-2.88-1.88-3.5-1.9-1.49-.15-2.91.87-3.67.87-.77 0-1.93-.86-3.18-.83-1.63.02-3.14.95-3.98 2.41-1.7 2.95-.43 7.3 1.22 9.69.8 1.17 1.76 2.48 3.01 2.43 1.21-.05 1.67-.78 3.13-.78 1.46 0 1.87.78 3.16.75 1.31-.02 2.13-1.19 2.93-2.36.92-1.35 1.3-2.66 1.32-2.73-.03-.01-2.51-.96-2.53-3.81z"/></svg>
          <svg v-else class="w-7 h-7 text-ink-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold">{{ m.label }}</div>
          <div class="text-sm text-ink-500">{{ m.sub }}</div>
        </div>
        <span v-if="m.primary" class="chip bg-teal-50 text-teal-700">Default</span>
      </div>

      <button @click="showAdd = true" class="ios-card w-full p-4 flex items-center gap-3 active:bg-cream-100">
        <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>
        </div>
        <div class="font-semibold">Add payment method</div>
      </button>
    </section>

    <section class="mt-8 px-5">
      <div class="ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">Demo mode</div>
        <p class="text-sm text-ink-700 mt-2 leading-relaxed">
          All payments are mocked in this build. No real card data is collected or stored. Adding methods here is just for UI preview.
        </p>
      </div>
    </section>

    <div v-if="showAdd" class="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
      <div class="bg-white rounded-t-3xl w-full max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] animate-slide-up">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">Add method</div>
          <button @click="showAdd = false" class="text-ink-500">Cancel</button>
        </div>
        <div class="space-y-2">
          <button class="w-full bg-black text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold active:scale-[.98]">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.46c-.02-2.42 1.98-3.58 2.07-3.64-1.13-1.65-2.88-1.88-3.5-1.9-1.49-.15-2.91.87-3.67.87-.77 0-1.93-.86-3.18-.83-1.63.02-3.14.95-3.98 2.41-1.7 2.95-.43 7.3 1.22 9.69.8 1.17 1.76 2.48 3.01 2.43 1.21-.05 1.67-.78 3.13-.78 1.46 0 1.87.78 3.16.75 1.31-.02 2.13-1.19 2.93-2.36.92-1.35 1.3-2.66 1.32-2.73-.03-.01-2.51-.96-2.53-3.81z"/></svg>
            Add Apple Pay
          </button>
          <button class="w-full bg-cream-200 text-ink-900 rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold active:scale-[.98]">
            Add credit/debit card
          </button>
        </div>
        <div class="text-center text-[11px] text-ink-300 mt-3">Demo only — no real processing</div>
      </div>
    </div>
  </div>
</template>
