<script setup>
// Site footer, laid out after therotihut.com (rounded top, mono headings, serif
// body, underlined inline links, ruled legal row) in the Happy Hour palette.
//
// Every link opens a ContentModal that loads its SiteSetting block, so the copy
// stays editable from the admin panel.
//
// Three sizes, chosen by the width of the footer's content (container queries),
// not the viewport:
//   phone   < 560px   compact, centred, stacked
//   tablet  560-899   compact, four columns in one row
//   desktop >= 900    the full-size layout, website only
// Inside the app the content column is at most 720px, so an iPad - portrait or
// landscape - always gets the compact tablet layout.

import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';
import ContentModal from './ContentModal.vue';
import TermsModal from './TermsModal.vue';

const SUPPORT_EMAIL = 'business9776@gmail.com';

// Fill these in once each listing is public. Empty hides the badge; the native
// app never shows store badges (App Review 2.3.10).
const STORE_LINKS = { appStore: '', googlePlay: '' };
const showStores = !Capacitor.isNativePlatform() && (STORE_LINKS.appStore || STORE_LINKS.googlePlay);

const QUICK_LINKS = [
  { label: '2026 Membership', key: 'content_membership_2026' },
  { label: 'VIP Key', key: 'content_membership_vip' },
  { label: 'About', key: 'content_company_about' },
  { label: 'Become a Partner', key: 'content_company_partner' },
  { label: 'Corporate', key: 'content_company_corporate' },
  { label: 'Careers', key: 'content_company_careers' },
  { label: 'FAQs', key: 'content_help_faqs' },
  { label: 'Rules of Use', key: 'content_help_rules' },
  { label: 'Contact', key: 'content_help_contact' },
];

const LEGAL = [
  { label: 'Privacy Policy', key: 'content_legal_privacy' },
  { label: 'Terms of Use', key: '__terms_consumer__' },
  { label: 'End User License', key: 'content_legal_eula' },
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
  <footer class="hh-footer">
    <div class="hh-footer__wrap">
      <div class="hh-footer__inner">
        <!-- Brand -->
        <div class="hh-footer__brand">
          <div class="hh-footer__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <div class="hh-footer__wordmark">
            <div class="hh-footer__name">Happy Hour</div>
            <div class="hh-footer__since">© {{ year }} · Bay Area</div>
          </div>

          <div v-if="showStores" class="hh-footer__stores">
            <a v-if="STORE_LINKS.appStore" :href="STORE_LINKS.appStore" target="_blank" rel="noopener" class="hh-footer__store">
              <i class="fa-brands fa-apple"></i> App Store
            </a>
            <a v-if="STORE_LINKS.googlePlay" :href="STORE_LINKS.googlePlay" target="_blank" rel="noopener" class="hh-footer__store">
              <i class="fa-brands fa-google-play"></i> Google Play
            </a>
          </div>
        </div>

        <!-- Quick links -->
        <nav aria-labelledby="hh-footer-links">
          <h2 id="hh-footer-links" class="hh-footer__h">Quick links</h2>
          <div class="hh-footer__links">
            <button
              v-for="link in QUICK_LINKS"
              :key="link.key"
              type="button"
              class="hh-footer__link"
              @click="openLink(link)"
            >{{ link.label }}</button>
          </div>
        </nav>

        <!-- Contact -->
        <div>
          <h2 class="hh-footer__h">Contact</h2>
          <div class="hh-footer__lines">
            <a :href="`mailto:${SUPPORT_EMAIL}`" class="hh-footer__plain">{{ SUPPORT_EMAIL }}</a>
            <span>San Francisco Bay Area</span>
          </div>
        </div>

        <!-- Deal hours -->
        <div>
          <h2 class="hh-footer__h">Deal hours</h2>
          <div class="hh-footer__lines hh-footer__lines--muted">
            <span>Mon – Fri: 2 – 5 PM</span>
            <span>Weekends: not included</span>
            <span>Holidays: not included</span>
          </div>
        </div>

        <!-- Legal -->
        <div class="hh-footer__legal">
          <button
            v-for="link in LEGAL"
            :key="link.key"
            type="button"
            class="hh-footer__legal-link"
            @click="openLink(link)"
          >{{ link.label }}</button>
        </div>
      </div>
    </div>

    <ContentModal :show="showContent" :content-key="activeContentKey" @close="showContent = false" />
    <TermsModal :show="showTerms" audience="consumer" @close="showTerms = false" />
  </footer>
</template>

<style scoped>
/* Brand palette (tailwind.config.js): teal-800 #063838, cream-50 #FFFCF6, coral-400 #FF8A7B */
.hh-footer {
  margin-top: 40px;
  background: #063838;
  color: rgba(255, 252, 246, 0.82);
  border-radius: 20px 20px 0 0;
  font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
  line-height: 1.5;
}

/* The query container is this wrapper, capped in width, so the layout follows the
   content width rather than the (possibly full-bleed) footer. */
.hh-footer__wrap {
  container-type: inline-size;
  max-width: 1200px;
  margin: 0 auto;
}

/* ---------- phone: compact, centred, stacked ---------- */

/* Padding lives here, not on <footer>: App.vue adds pb-24 to the root to clear the
   tab bar, and a padding rule on the root would silently override it. */
.hh-footer__inner {
  padding: 28px 20px max(env(safe-area-inset-bottom), 16px);
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  justify-items: center;
  text-align: center;
}

.hh-footer__h {
  margin: 0 0 8px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  font-weight: 650;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #FFFCF6;
}

.hh-footer__brand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: left;
}
.hh-footer__mark {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 9px;
  background: #FFFCF6;
  color: #063838;
  display: grid;
  place-items: center;
}
.hh-footer__mark svg { width: 17px; height: 17px; }
.hh-footer__name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.1;
  color: #FFFCF6;
  letter-spacing: -0.01em;
}
.hh-footer__since {
  margin-top: 3px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 252, 246, 0.55);
}
.hh-footer__stores {
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}
.hh-footer__store {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid rgba(255, 252, 246, 0.22);
  border-radius: 8px;
  font-size: 12px;
  color: #FFFCF6;
  transition: border-color 0.15s ease;
}
.hh-footer__store:hover { border-color: #FF8A7B; }

.hh-footer__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 12px;
}
.hh-footer__link {
  padding: 0;
  background: none;
  border: 0;
  border-bottom: 1px solid rgba(255, 252, 246, 0.22);
  font: inherit;
  font-size: 13.5px;
  line-height: 1.55;
  color: rgba(255, 252, 246, 0.88);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.hh-footer__link:hover { color: #FFFCF6; border-color: #FF8A7B; }

.hh-footer__lines {
  display: grid;
  justify-items: center;
  gap: 1px;
  font-size: 12.5px;
  line-height: 1.5;
}
.hh-footer__lines--muted { color: rgba(255, 252, 246, 0.74); }
.hh-footer__plain {
  color: rgba(255, 252, 246, 0.82);
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: color 0.15s ease;
}
.hh-footer__plain:hover { color: #FFFCF6; }

.hh-footer__legal {
  width: 100%;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 252, 246, 0.16);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 16px;
}
.hh-footer__legal-link {
  padding: 0;
  background: none;
  border: 0;
  font: inherit;
  font-size: 11.5px;
  color: rgba(255, 252, 246, 0.62);
  cursor: pointer;
  transition: color 0.15s ease;
}
.hh-footer__legal-link:hover { color: #FFFCF6; }

.hh-footer button:focus-visible,
.hh-footer a:focus-visible {
  outline: 2px solid #FF8A7B;
  outline-offset: 3px;
  border-radius: 3px;
}

/* ---------- tablet: compact, four columns in one row ---------- */
@container (min-width: 560px) {
  .hh-footer__inner {
    grid-template-columns: 0.8fr 1.5fr 1.1fr 1fr;
    gap: 22px 26px;
    padding: 30px 28px max(env(safe-area-inset-bottom), 18px);
    justify-items: stretch;
    text-align: left;
  }
  .hh-footer__brand {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 8px;
  }
  .hh-footer__stores { justify-content: flex-start; }
  .hh-footer__links { justify-content: flex-start; gap: 2px 10px; }
  .hh-footer__link { font-size: 13px; }
  .hh-footer__lines { justify-items: start; font-size: 12px; }
  .hh-footer__legal { grid-column: 1 / -1; justify-content: space-between; }
}

/* ---------- desktop website: the full-size layout ---------- */
@container (min-width: 900px) {
  .hh-footer__inner {
    grid-template-columns: 0.9fr 1.5fr 1fr 0.9fr;
    gap: 34px 56px;
    padding: 72px 56px 38px;
  }
  .hh-footer__brand { flex-direction: row; align-items: center; gap: 12px; }
  .hh-footer__mark { width: 44px; height: 44px; border-radius: 12px; }
  .hh-footer__mark svg { width: 24px; height: 24px; }
  .hh-footer__name { font-size: 22px; }
  .hh-footer__since { font-size: 10px; margin-top: 5px; }
  .hh-footer__h { font-size: 12px; margin-bottom: 12px; }
  .hh-footer__links { gap: 8px 16px; }
  .hh-footer__link { font-size: 16px; line-height: 1.6; }
  .hh-footer__lines { font-size: 14px; gap: 5px; }
  .hh-footer__legal { padding-top: 14px; }
  .hh-footer__legal-link { font-size: 12.5px; }
}

@media (prefers-reduced-motion: reduce) {
  .hh-footer * { transition: none !important; }
}
</style>
