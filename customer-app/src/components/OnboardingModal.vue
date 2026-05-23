<script setup>
import { ref } from 'vue';

const emit = defineEmits(['done']);
const step = ref(0);

const steps = [
  {
    icon: 'fa-mug-hot',
    color: 'from-teal-500 to-teal-700',
    title: 'Welcome to Happy Hour!',
    body: 'Save up to 70% at hundreds of restaurants, cafés, bars, and spas across the Bay Area. We help local businesses fill their quiet hours, and you save big.',
  },
  {
    icon: 'fa-ticket',
    color: 'from-coral-500 to-coral-600',
    title: '3 coupons every day',
    body: 'Your $4.99/month membership lets you claim up to 3 coupons per day. The counter resets every midnight. Pick the best deals near you!',
  },
  {
    icon: 'fa-clock',
    color: 'from-amber-500 to-amber-600',
    title: 'Use during Happy Hour',
    body: 'Each coupon is only valid during the merchant\'s happy hour window — usually 2-5pm. You can claim anytime, but redeem only during those hours. Check your Wallet for exact times.',
  },
  {
    icon: 'fa-location-dot',
    color: 'from-purple-500 to-purple-700',
    title: 'Find spots nearby',
    body: 'We sort merchants by distance from you. Allow location access and we\'ll show you the best deals within walking distance.',
  },
];

function next() {
  if (step.value < steps.length - 1) step.value++;
  else finish();
}

function finish() {
  localStorage.setItem('hh_onboarded', '1');
  emit('done');
}
</script>

<template>
  <teleport to="body">
    <div class="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center px-4">
      <div class="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-lift overflow-hidden animate-slide-up">
        <div class="relative h-56 flex items-center justify-center bg-gradient-to-br" :class="steps[step].color">
          <div class="text-white text-7xl drop-shadow-lg">
            <i class="fa-solid" :class="steps[step].icon"></i>
          </div>
          <button @click="finish" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-xs">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="p-6 pb-[max(env(safe-area-inset-bottom),20px)]">
          <div class="font-bold text-2xl">{{ steps[step].title }}</div>
          <p class="mt-3 text-ink-700 leading-relaxed">{{ steps[step].body }}</p>

          <div class="flex items-center gap-1.5 mt-6">
            <div v-for="(s, i) in steps" :key="i" class="h-1.5 rounded-full transition-all" :class="i === step ? 'bg-teal-600 w-8' : 'bg-cream-200 w-2'"></div>
          </div>

          <div class="flex gap-2 mt-5">
            <button v-if="step > 0" @click="step--" class="ios-card flex-1 py-3 font-semibold text-ink-700">Back</button>
            <button @click="next" class="ios-button-primary flex-1">
              {{ step === steps.length - 1 ? "Let's go!" : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
