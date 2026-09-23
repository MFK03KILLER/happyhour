<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ContentModal from '../components/ContentModal.vue';
import TermsModal from '../components/TermsModal.vue';

const router = useRouter();
const SUPPORT_EMAIL = 'business9776@gmail.com';

const activeKey = ref('');
const showContent = ref(false);
const showTerms = ref(false);

function open(key) {
  activeKey.value = key;
  showContent.value = true;
}

const issueMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Happy Hour - issue report')}`;
</script>

<template>
  <div class="min-h-screen pb-12 safe-top">
    <header class="px-5 pt-4 flex items-center">
      <button @click="router.back()" aria-label="Back" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">Help & support</div>
    </header>

    <section class="px-5 mt-6">
      <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider px-1 mb-2">Get help</div>
      <div class="ios-card divide-y divide-cream-200">
        <a :href="`mailto:${SUPPORT_EMAIL}`" class="flex items-center gap-3 p-4 active:bg-cream-100">
          <i class="fa-regular fa-envelope text-teal-700 w-5 text-center"></i>
          <div class="flex-1 min-w-0">
            <div class="font-semibold">Email support</div>
            <div class="text-sm text-ink-500 break-all">{{ SUPPORT_EMAIL }} · usually within one business day</div>
          </div>
        </a>
        <button type="button" @click="open('content_help_faqs')" class="w-full flex items-center gap-3 p-4 text-left active:bg-cream-100">
          <i class="fa-solid fa-circle-question text-teal-700 w-5 text-center"></i>
          <div class="flex-1">
            <div class="font-semibold">FAQs</div>
            <div class="text-sm text-ink-500">Membership, redeeming deals and payments</div>
          </div>
          <i class="fa-solid fa-chevron-right text-ink-300 text-xs"></i>
        </button>
        <button type="button" @click="open('content_help_rules')" class="w-full flex items-center gap-3 p-4 text-left active:bg-cream-100">
          <i class="fa-solid fa-list-check text-teal-700 w-5 text-center"></i>
          <div class="flex-1">
            <div class="font-semibold">Rules of use</div>
            <div class="text-sm text-ink-500">How claiming and redeeming works</div>
          </div>
          <i class="fa-solid fa-chevron-right text-ink-300 text-xs"></i>
        </button>
        <a :href="issueMailto" class="flex items-center gap-3 p-4 active:bg-cream-100">
          <i class="fa-solid fa-bug text-teal-700 w-5 text-center"></i>
          <div class="flex-1">
            <div class="font-semibold">Report an issue</div>
            <div class="text-sm text-ink-500">Something not working? Tell us what happened.</div>
          </div>
        </a>
      </div>

      <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider px-1 mb-2 mt-7">Legal</div>
      <div class="ios-card divide-y divide-cream-200">
        <button type="button" @click="showTerms = true" class="w-full flex items-center justify-between p-4 text-left active:bg-cream-100">
          <span class="font-semibold">Terms of Use</span><i class="fa-solid fa-chevron-right text-ink-300 text-xs"></i>
        </button>
        <button type="button" @click="open('content_legal_privacy')" class="w-full flex items-center justify-between p-4 text-left active:bg-cream-100">
          <span class="font-semibold">Privacy Policy</span><i class="fa-solid fa-chevron-right text-ink-300 text-xs"></i>
        </button>
        <button type="button" @click="open('content_legal_eula')" class="w-full flex items-center justify-between p-4 text-left active:bg-cream-100">
          <span class="font-semibold">End User License</span><i class="fa-solid fa-chevron-right text-ink-300 text-xs"></i>
        </button>
      </div>
    </section>

    <ContentModal :show="showContent" :content-key="activeKey" @close="showContent = false" />
    <TermsModal :show="showTerms" audience="consumer" @close="showTerms = false" />
  </div>
</template>
