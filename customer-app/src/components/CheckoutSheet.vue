<script setup>
// Confirmation sheet for purchases while online payment isn't live. It must
// never look like Apple Pay / Google Pay or say a payment went through:
// nothing is charged here, and App Review rejects imitation payment sheets.
defineProps({
  title: { type: String, required: true },
  amountLabel: { type: String, required: true },   // "Free", "$8.99"
  itemName: { type: String, default: '' },
  note: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['confirm', 'close']);
</script>

<template>
  <teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end justify-center">
      <div class="absolute inset-0 bg-black/40 animate-fade-in" @click="!busy && emit('close')"></div>
      <div class="relative w-full max-w-md bg-white rounded-t-3xl shadow-lift animate-slide-up px-6 pt-3 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div class="flex justify-center"><div class="w-10 h-1.5 bg-ink-300/40 rounded-full"></div></div>

        <div class="text-center mt-4">
          <div class="text-xs uppercase tracking-wider text-ink-300 font-semibold">{{ title }}</div>
          <div class="text-3xl font-bold mt-1">{{ amountLabel }}</div>
          <div v-if="itemName" class="text-sm text-ink-500 mt-0.5">{{ itemName }}</div>
        </div>

        <p v-if="note" class="mt-4 text-sm text-ink-700 leading-relaxed bg-cream-100 rounded-2xl px-4 py-3">{{ note }}</p>

        <button
          type="button"
          :disabled="busy"
          class="ios-button-primary w-full mt-5 disabled:opacity-60"
          @click="emit('confirm')"
        >
          {{ busy ? 'One moment…' : confirmLabel }}
        </button>
        <button type="button" :disabled="busy" class="w-full mt-2 py-3 text-sm font-semibold text-ink-500" @click="emit('close')">
          Not now
        </button>
      </div>
    </div>
  </teleport>
</template>
