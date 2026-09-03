<script setup>
// Public page explaining how to delete a Happy Hour account.
// Google Play requires a web URL for this (Data safety → account deletion).
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const router = useRouter();
const auth = useAuthStore();
function start() { router.push(auth.isAuthenticated ? '/profile' : '/login'); }
</script>

<template>
  <div class="min-h-screen bg-cream-100 safe-top pb-16">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <router-link to="/welcome" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200" aria-label="Home">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </router-link>
      <div class="flex-1 text-center font-semibold -ml-8">Delete your account</div>
    </header>

    <main class="max-w-2xl mx-auto px-5 mt-5 space-y-4">
      <article class="ios-card p-5 md:p-7 text-sm text-ink-700 leading-relaxed">
        <h1 class="text-2xl font-bold tracking-tight text-ink-900">Delete your Happy Hour account</h1>
        <p class="mt-3">You can permanently delete your account and personal data yourself, at any time, from inside the app:</p>
        <ol class="list-decimal list-inside space-y-1.5 mt-3">
          <li>Sign in to Happy Hour (app or <a href="https://happyhourz.org" class="text-teal-700 underline">happyhourz.org</a>).</li>
          <li>Open <strong>Profile</strong> (the round avatar button).</li>
          <li>Scroll down and tap <strong>Delete my account</strong>.</li>
          <li>Confirm your password and tap <strong>Delete forever</strong>.</li>
        </ol>
        <h2 class="text-lg font-bold mt-6 mb-2">What is deleted</h2>
        <ul class="list-disc list-inside space-y-1">
          <li>Your name, email address, phone number and profile photo</li>
          <li>Saved delivery addresses and favorite places</li>
          <li>Claimed coupons in your wallet and your membership</li>
          <li>Your login sessions (you are signed out everywhere)</li>
        </ul>
        <h2 class="text-lg font-bold mt-6 mb-2">What is kept</h2>
        <p>Payment receipts are retained for accounting and legal (tax) reasons, but they are anonymised — they no longer contain your name, email or phone number. Deletion is immediate and cannot be undone.</p>
        <h2 class="text-lg font-bold mt-6 mb-2">Need help?</h2>
        <p>If you cannot sign in, email <a href="mailto:support@happyhourz.org" class="text-teal-700 underline">support@happyhourz.org</a> from the address on your account and we will delete it for you.</p>
        <button @click="start" class="ios-button-primary w-full mt-6">Sign in to delete my account</button>
      </article>
      <div class="text-center text-[11px] text-ink-300">
        <router-link to="/privacy" class="underline">Privacy Policy</router-link> · <router-link to="/terms" class="underline">Terms of Service</router-link>
      </div>
    </main>
  </div>
</template>
