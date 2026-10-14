<script setup>
// Where Stripe Checkout lands when it was opened from the native app's browser
// sheet. That sheet isn't signed in, so this page only tells people to go back:
// the app checks the membership itself when the sheet closes.
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const paid = computed(() => route.query.status === 'success');
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-8 text-center bg-cream-100">
    <div class="w-20 h-20 rounded-full flex items-center justify-center" :class="paid ? 'bg-green-100' : 'bg-cream-200'">
      <i class="fa-solid text-3xl" :class="paid ? 'fa-check text-green-600' : 'fa-xmark text-ink-500'"></i>
    </div>
    <h1 class="mt-5 text-2xl font-bold">{{ paid ? 'Payment received' : 'Checkout cancelled' }}</h1>
    <p class="mt-2 text-ink-500 max-w-sm">
      <template v-if="paid">Your membership is being activated. Tap <b>Done</b> to go back to the Happy Hour app.</template>
      <template v-else>You haven't been charged. Tap <b>Done</b> to go back to the Happy Hour app.</template>
    </p>
    <router-link to="/subscribe" class="mt-8 text-sm font-semibold text-teal-700">Not in the app? Open your membership →</router-link>
  </div>
</template>
