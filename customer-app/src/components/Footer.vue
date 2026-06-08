<script setup>
// Full-width Entertainer-style footer with 4 link columns + download badges +
// social icons + copyright. Each link click opens a ContentModal that loads
// the corresponding SiteSetting block from the backend, so the text is fully
// editable from the admin panel.

import { ref } from 'vue';
import ContentModal from './ContentModal.vue';
import TermsModal from './TermsModal.vue';

// Map of column → links. Each link is { label, contentKey } where contentKey
// matches a SiteSetting key on the backend. The two "special" links are
// 'Terms of Use' (opens the long consumer TOS already in the system) and the
// download badges (deep links to the app stores when they're live).
const COLUMNS = [
  {
    title: 'Membership',
    links: [
      { label: '2026 Membership', key: 'content_membership_2026' },
      { label: 'VIP Key',         key: 'content_membership_vip'  },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Become a Partner', key: 'content_company_partner'   },
      { label: 'Corporate',        key: 'content_company_corporate' },
      { label: 'Careers',          key: 'content_company_careers'   },
      { label: 'About',            key: 'content_company_about'     },
    ],
  },
  {
    title: 'Help & Support',
    links: [
      { label: 'FAQs',         key: 'content_help_faqs'    },
      { label: 'Rules of Use', key: 'content_help_rules'   },
      { label: 'Contact Us',   key: 'content_help_contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'End User License', key: 'content_legal_eula'    },
      { label: 'Terms of Use',     key: '__terms_consumer__'   }, // special: opens TermsModal
      { label: 'Privacy Policy',   key: 'content_legal_privacy' },
    ],
  },
];

const SOCIAL = [
  { icon: 'fa-brands fa-instagram', href: 'https://instagram.com/happyhour',     label: 'Instagram' },
  { icon: 'fa-brands fa-facebook',  href: 'https://facebook.com/happyhour',      label: 'Facebook'  },
  { icon: 'fa-brands fa-youtube',   href: 'https://youtube.com/@happyhour',      label: 'YouTube'   },
  { icon: 'fa-brands fa-x-twitter', href: 'https://x.com/happyhour',             label: 'X'         },
];

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
  <footer class="bg-teal-800 text-cream-50 mt-12 pb-[max(env(safe-area-inset-bottom),24px)]">
    <div class="max-w-6xl mx-auto px-5 md:px-8 py-10">
      <!-- Top: 4 link columns + download buttons -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-8">
        <div v-for="col in COLUMNS" :key="col.title">
          <div class="font-bold text-sm uppercase tracking-wider text-cream-50 mb-3">{{ col.title }}</div>
          <ul class="space-y-2">
            <li v-for="link in col.links" :key="link.label">
              <button
                @click="openLink(link)"
                class="text-sm text-cream-100/85 hover:text-white hover:underline text-left transition"
              >{{ link.label }}</button>
            </li>
          </ul>
        </div>

        <!-- Download App column -->
        <div class="col-span-2 md:col-span-1">
          <div class="font-bold text-sm uppercase tracking-wider text-cream-50 mb-3">Download App</div>
          <div class="space-y-2">
            <a href="#" class="flex items-center gap-2 bg-black rounded-xl px-3 py-2 hover:bg-black/80 transition w-fit">
              <i class="fa-brands fa-google-play text-white text-xl"></i>
              <div class="leading-tight">
                <div class="text-[9px] uppercase tracking-wider text-cream-100/70">GET IT ON</div>
                <div class="text-sm font-bold text-white">Google Play</div>
              </div>
            </a>
            <a href="#" class="flex items-center gap-2 bg-black rounded-xl px-3 py-2 hover:bg-black/80 transition w-fit">
              <i class="fa-brands fa-apple text-white text-xl"></i>
              <div class="leading-tight">
                <div class="text-[9px] uppercase tracking-wider text-cream-100/70">Download on the</div>
                <div class="text-sm font-bold text-white">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom: logo + copyright + socials -->
      <div class="mt-10 pt-6 border-t border-cream-50/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-cream-50 text-teal-800 flex items-center justify-center">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <div class="text-sm text-cream-100/80">© Happy Hour, All rights reserved {{ year }}</div>
        </div>
        <div class="flex items-center gap-3">
          <a
            v-for="s in SOCIAL"
            :key="s.label"
            :href="s.href"
            target="_blank"
            rel="noopener"
            :aria-label="s.label"
            class="w-9 h-9 rounded-full border border-cream-50/30 text-cream-50 flex items-center justify-center hover:bg-cream-50/15 transition"
          >
            <i :class="s.icon" class="text-sm"></i>
          </a>
        </div>
      </div>
    </div>

    <ContentModal :show="showContent" :content-key="activeContentKey" @close="showContent = false" />
    <TermsModal :show="showTerms" audience="consumer" @close="showTerms = false" />
  </footer>
</template>
