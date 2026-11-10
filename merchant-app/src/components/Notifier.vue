<script setup>
import { notices, dismiss } from '../lib/notify';
</script>

<template>
  <teleport to="body">
    <div class="fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none" style="padding-top: max(env(safe-area-inset-top), 12px)">
      <button
        v-for="n in notices"
        :key="n.id"
        type="button"
        class="pointer-events-auto w-full max-w-md text-left rounded-2xl px-4 py-3 text-sm font-semibold shadow-lift animate-fade-in flex items-start gap-2"
        :class="n.kind === 'success' ? 'bg-teal-700 text-white' : 'bg-coral-600 text-white'"
        @click="dismiss(n.id)"
      >
        <i class="fa-solid mt-0.5" :class="n.kind === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
        <span class="flex-1">{{ n.text }}</span>
      </button>
    </div>
  </teleport>
</template>
