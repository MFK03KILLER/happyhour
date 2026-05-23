<script setup>
import { useToastStore } from '../stores/toast';
const toast = useToastStore();

function bg(kind) {
  return {
    success: 'bg-green-600 text-white',
    error: 'bg-coral-600 text-white',
    warning: 'bg-amber-500 text-ink-900',
    info: 'bg-ink-900 text-white',
  }[kind] || 'bg-ink-900 text-white';
}
</script>

<template>
  <teleport to="body">
    <div class="fixed z-[120] inset-x-0 top-0 px-4 pt-[max(env(safe-area-inset-top),16px)] flex flex-col items-center gap-2 pointer-events-none">
      <transition-group name="toast" tag="div" class="w-full max-w-md flex flex-col gap-2">
        <div
          v-for="t in toast.items"
          :key="t.id"
          class="w-full rounded-2xl shadow-lift backdrop-blur-md pointer-events-auto overflow-hidden"
          :class="bg(t.kind)"
        >
          <div class="px-4 py-3 flex items-start gap-3">
            <div v-if="t.icon" class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid text-base" :class="t.icon"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div v-if="t.title" class="font-bold text-sm">{{ t.title }}</div>
              <div class="text-sm leading-snug" :class="t.title ? 'opacity-90 mt-0.5' : ''">{{ t.message }}</div>
              <button v-if="t.action" @click="t.action.handler(); toast.dismiss(t.id)" class="mt-2 text-xs font-bold underline underline-offset-2">
                {{ t.action.label }}
              </button>
            </div>
            <button @click="toast.dismiss(t.id)" class="opacity-70 hover:opacity-100 flex-shrink-0 p-1 -m-1">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 280ms cubic-bezier(.2,.8,.2,1);
}
.toast-enter-from { transform: translateY(-16px); opacity: 0; }
.toast-leave-to { transform: translateY(-12px); opacity: 0; }
.toast-leave-active { position: absolute; left: 0; right: 0; }
.toast-move { transition: transform 280ms cubic-bezier(.2,.8,.2,1); }
</style>
