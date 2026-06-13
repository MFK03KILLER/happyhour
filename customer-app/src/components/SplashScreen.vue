<script setup>
import { onMounted, ref } from 'vue';

const emit = defineEmits(['done']);
const hidden = ref(false);

onMounted(() => {
  setTimeout(() => {
    hidden.value = true;
    setTimeout(() => emit('done'), 400);
  }, 1100);
});
</script>

<template>
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 transition-opacity duration-300"
    :class="hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'"
  >
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-coral-500/30 blur-3xl animate-pulse-soft"></div>
      <div class="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
    </div>

    <div class="relative text-center text-white animate-pop-in">
      <div class="mx-auto w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lift">
        <i class="fa-solid fa-mug-hot text-5xl text-white"></i>
      </div>
      <div class="mt-6 text-4xl font-bold tracking-tight">هپی اَور</div>
      <div class="mt-2 text-sm font-medium opacity-80">بخور. بنوش. صرفه‌جویی کن.</div>
    </div>

    <div class="absolute bottom-12 inset-x-0 flex justify-center">
      <div class="w-10 h-1 rounded-full bg-white/30 overflow-hidden">
        <div class="h-full bg-white animate-loader"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pop-in-splash {
  0% { transform: scale(.85); opacity: 0; }
  60% { transform: scale(1.03); opacity: 1; }
  100% { transform: scale(1); }
}
.animate-pop-in { animation: pop-in-splash 700ms cubic-bezier(.2,.8,.2,1); }
@keyframes loader {
  0% { width: 0%; }
  100% { width: 100%; }
}
.animate-loader { animation: loader 1.1s ease-out forwards; }
</style>
