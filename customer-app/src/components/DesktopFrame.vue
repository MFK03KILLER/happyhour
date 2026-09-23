<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Capacitor } from '@capacitor/core';

defineProps({ landing: Boolean });

// The phone-mockup frame is a desktop-browser presentation only. Inside the native
// app, and on any touch device (iPad included), the app must fill the screen —
// App Review tests on iPad and saw a phone mock with "Demo" text inside the app.
const isNative = Capacitor.isNativePlatform();
const framed = ref(false);
let mq = null;

function evaluate() {
  framed.value = !isNative
    && window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
}

onMounted(() => {
  evaluate();
  mq = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  mq.addEventListener?.('change', evaluate);
});
onBeforeUnmount(() => mq?.removeEventListener?.('change', evaluate));
</script>

<template>
  <!-- Marketing landing: always full width -->
  <div v-if="landing" class="min-h-screen w-full">
    <slot />
  </div>

  <!-- Desktop browser with a mouse: app shown inside a phone frame -->
  <div
    v-else-if="framed"
    class="min-h-screen w-full flex items-center justify-center py-10 relative overflow-hidden bg-gradient-to-br from-teal-800 via-ink-900 to-teal-700"
  >
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-coral-500/20 blur-3xl"></div>
      <div class="absolute -bottom-32 -right-20 w-[520px] h-[520px] rounded-full bg-teal-400/20 blur-3xl"></div>
    </div>

    <div class="absolute top-8 left-8 text-white max-w-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-lift">
          <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
        </div>
        <div class="text-2xl font-bold tracking-tight">Happy Hour</div>
      </div>
      <p class="mt-3 text-cream-50/80 text-sm leading-relaxed">
        Member deals at Bay Area restaurants, cafes and bars. A new deal every day.
      </p>
    </div>

    <div class="relative w-[420px] h-[860px] rounded-[44px] shadow-[0_30px_80px_rgba(0,0,0,.4)] border-[10px] border-ink-900 overflow-hidden bg-cream-100">
      <div class="absolute top-0 inset-x-0 z-50 pointer-events-none">
        <div class="mx-auto mt-2 h-7 w-32 rounded-full bg-ink-900"></div>
      </div>
      <div class="h-[840px] overflow-y-auto overflow-x-hidden scroll-no-bar relative">
        <slot />
      </div>
    </div>
  </div>

  <!-- Phones, tablets and the native app: full screen, content in a readable column -->
  <div v-else class="min-h-screen w-full bg-cream-100" style="overflow-x: clip">
    <div class="hh-column mx-auto w-full max-w-[720px] min-h-screen">
      <slot />
    </div>
  </div>
</template>
