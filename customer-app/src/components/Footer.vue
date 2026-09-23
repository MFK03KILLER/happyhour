<script setup>
// Site footer. Every link opens a ContentModal that loads its SiteSetting block,
// so all copy stays editable from the admin panel.
//
// Layout is driven by the width the footer actually gets, not the viewport: it is
// rendered inside a 420px phone frame on desktop, in a 720px column on tablets and
// full width on the landing page. Viewport breakpoints put five columns into the
// phone frame and the headings collided.

import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import ContentModal from './ContentModal.vue';
import TermsModal from './TermsModal.vue';

const SUPPORT_EMAIL = 'business9776@gmail.com';

// Fill these in once each listing is public. An empty URL hides the badge — a
// dead "#" link reads as unfinished, and App Review rejects store references to
// other platforms inside the native app.
const STORE_LINKS = {
  appStore: '',
  googlePlay: '',
};

// Only accounts you own. Empty href = hidden.
const SOCIAL = [
  { icon: 'fa-brands fa-instagram', href: '', label: 'Instagram' },
  { icon: 'fa-brands fa-facebook', href: '', label: 'Facebook' },
  { icon: 'fa-brands fa-x-twitter', href: '', label: 'X' },
].filter((s) => s.href);

const COLUMNS = [
  {
    title: 'Membership',
    links: [
      { label: '2026 Membership', key: 'content_membership_2026' },
      { label: 'VIP Key', key: 'content_membership_vip' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', key: 'content_company_about' },
      { label: 'Become a Partner', key: 'content_company_partner' },
      { label: 'Corporate', key: 'content_company_corporate' },
      { label: 'Careers', key: 'content_company_careers' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQs', key: 'content_help_faqs' },
      { label: 'Rules of Use', key: 'content_help_rules' },
      { label: 'Contact Us', key: 'content_help_contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Use', key: '__terms_consumer__' },
      { label: 'Privacy Policy', key: 'content_legal_privacy' },
      { label: 'End User License', key: 'content_legal_eula' },
    ],
  },
];

const isNative = Capacitor.isNativePlatform();
const showStores = !isNative && (STORE_LINKS.appStore || STORE_LINKS.googlePlay);

const activeContentKey = ref('');
const showContent = ref(false);
const showTerms = ref(false);

function openLink(link) {
  if (link.key === '__terms_consumer__') {
    showTerms.value = true;
  } else {
    activeContentKey.value = link.key;
    showContent.value = true;
  }
}

const year = new Date().getFullYear();
</script>

<template>
  <footer class="hh-footer bg-teal-800 text-cream-50 mt-12">
    <div class="max-w-6xl mx-auto px-6 pt-10 pb-[max(env(safe-area-inset-bottom),24px)]">
      <div class="flex flex-wrap gap-x-10 gap-y-9">
        <!-- Brand -->
        <div class="flex-[1_1_15rem] min-w-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-cream-50 text-teal-800 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            </div>
            <span class="text-lg font-bold tracking-tight">Happy Hour</span>
          </div>
          <p class="mt-3 text-sm leading-relaxed text-cream-100/75 max-w-xs">
            Member deals at independent restaurants, cafes and bars across the Bay Area.
          </p>
          <a
            :href="`mailto:${SUPPORT_EMAIL}`"
            class="mt-4 inline-flex items-center gap-2 text-sm text-cream-50 hover:text-white break-all"
          >
            <i class="fa-regular fa-envelope text-cream-100/70"></i>{{ SUPPORT_EMAIL }}
          </a>

          <div v-if="showStores" class="mt-5 flex flex-wrap gap-2">
            <a
              v-if="STORE_LINKS.appStore"
              :href="STORE_LINKS.appStore"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 bg-black rounded-xl px-3 py-2 hover:bg-black/80 transition"
            >
              <i class="fa-brands fa-apple text-white text-xl"></i>
              <span class="leading-tight">
                <span class="block text-[9px] uppercase tracking-wider text-cream-100/70">Download on the</span>
                <span class="block text-sm font-bold text-white">App Store</span>
              </span>
            </a>
            <a
              v-if="STORE_LINKS.googlePlay"
              :href="STORE_LINKS.googlePlay"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 bg-black rounded-xl px-3 py-2 hover:bg-black/80 transition"
            >
              <i class="fa-brands fa-google-play text-white text-lg"></i>
              <span class="leading-tight">
                <span class="block text-[9px] uppercase tracking-wider text-cream-100/70">Get it on</span>
                <span class="block text-sm font-bold text-white">Google Play</span>
              </span>
            </a>
          </div>
        </div>

        <!-- Link columns: as many per row as the width allows, never overlapping -->
        <nav
          class="flex-[3_1_26rem] min-w-0 grid gap-x-6 gap-y-8"
          style="grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));"
          aria-label="Footer"
        >
          <div v-for="col in COLUMNS" :key="col.title" class="min-w-0">
            <h3 class="text-xs font-semibold uppercase tracking-[0.08em] text-cream-100/60">{{ col.title }}</h3>
            <ul class="mt-3 space-y-2.5">
              <li v-for="link in col.links" :key="link.label">
                <button
                  type="button"
                  @click="openLink(link)"
                  class="text-sm text-cream-50/90 hover:text-white text-left leading-snug transition"
                >{{ link.label }}</button>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div class="mt-10 pt-5 border-t border-cream-50/15 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div class="text-xs text-cream-100/65">© {{ year }} Happy Hour. All rights reserved.</div>
        <div v-if="SOCIAL.length" class="flex items-center gap-2">
          <a
            v-for="s in SOCIAL"
            :key="s.label"
            :href="s.href"
            target="_blank"
            rel="noopener"
            :aria-label="s.label"
            class="w-8 h-8 rounded-full border border-cream-50/25 text-cream-50 flex items-center justify-center hover:bg-cream-50/15 transition"
          >
            <i :class="s.icon" class="text-xs"></i>
          </a>
        </div>
      </div>
    </div>

    <ContentModal :show="showContent" :content-key="activeContentKey" @close="showContent = false" />
    <TermsModal :show="showTerms" audience="consumer" @close="showTerms = false" />
  </footer>
</template>
