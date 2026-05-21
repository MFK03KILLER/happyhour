<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="min-h-screen pb-12 safe-top">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Help & support</div>
    </header>

    <section class="px-5 mt-6">
      <div class="ios-card divide-y divide-cream-200">
        <a href="mailto:help@happyhour.demo" class="block p-4 active:bg-cream-100">
          <div class="font-semibold">Email support</div>
          <div class="text-sm text-ink-500">help@happyhour.demo · replies within 24h</div>
        </a>
        <a href="#" class="block p-4 active:bg-cream-100">
          <div class="font-semibold">FAQ</div>
          <div class="text-sm text-ink-500">Browse common questions</div>
        </a>
        <a href="#" class="block p-4 active:bg-cream-100">
          <div class="font-semibold">Report an issue</div>
          <div class="text-sm text-ink-500">Something not working? Let us know.</div>
        </a>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">App version</div>
        <div class="font-semibold mt-1">Happy Hour Demo · v1.0</div>
      </div>
    </section>
  </div>
</template>
