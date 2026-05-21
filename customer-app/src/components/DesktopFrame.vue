<script setup>
defineProps({ landing: Boolean });
</script>

<template>
  <div v-if="landing" class="min-h-screen w-full">
    <slot />
  </div>
  <div
    v-else
    class="min-h-screen w-full md:flex md:items-center md:justify-center md:py-10 relative overflow-hidden"
    :class="['bg-cream-100', 'md:bg-gradient-to-br', 'md:from-teal-800', 'md:via-ink-900', 'md:to-teal-700']"
  >
    <div class="hidden md:block absolute inset-0 pointer-events-none">
      <div class="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-coral-500/20 blur-3xl"></div>
      <div class="absolute -bottom-32 -right-20 w-[520px] h-[520px] rounded-full bg-teal-400/20 blur-3xl"></div>
    </div>

    <div class="hidden md:block absolute top-8 left-8 text-white max-w-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-lift">
          <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
        </div>
        <div class="text-2xl font-bold tracking-tight">Happy Hour</div>
      </div>
      <p class="mt-3 text-cream-50/80 text-sm leading-relaxed">
        America's friendliest coupon club. Save up to 50% at the spots you already love.
      </p>
    </div>

    <div
      class="relative w-full md:w-[420px] md:h-[860px] md:rounded-[44px] md:shadow-[0_30px_80px_rgba(0,0,0,.4)] md:border-[10px] md:border-ink-900 md:overflow-hidden bg-cream-100"
    >
      <div class="hidden md:block absolute top-0 inset-x-0 z-50 pointer-events-none">
        <div class="mx-auto mt-2 h-7 w-32 rounded-full bg-ink-900"></div>
      </div>
      <div class="h-full md:h-[840px] overflow-y-auto overflow-x-hidden scroll-no-bar relative">
        <slot />
      </div>
    </div>

    <div class="hidden md:block absolute bottom-6 right-8 text-white/60 text-xs">
      Demo · v1.0
    </div>
  </div>
</template>
