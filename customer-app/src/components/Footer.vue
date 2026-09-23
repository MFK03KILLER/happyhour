<script setup>
// Site footer, modelled on therotihut.com: near-black, rounded top, mono headings,
// serif body, underlined inline links and a ruled legal row.
//
// Every link opens a ContentModal that loads its SiteSetting block, so the copy
// stays editable from the admin panel.
//
// The layout responds to the footer's own width (container queries), not the
// viewport: it renders inside a 420px phone frame on desktop, in a column on
// tablets, and full width on the landing page.

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
    <div class="hh-footer__inner">
      <!-- Brand -->
      <div class="hh-footer__brand">
        <div class="hh-footer__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
        </div>
        <div>
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
          <span>San Francisco Bay Area, CA</span>
          <button type="button" class="hh-footer__plain hh-footer__text-btn" @click="openLink({ key: 'content_help_contact' })">
            Contact us
          </button>
        </div>
      </div>

      <!-- Deal hours -->
      <div>
        <h2 class="hh-footer__h">Deal hours</h2>
        <div class="hh-footer__lines hh-footer__lines--muted">
          <span>Mon – Fri: 2 – 5 PM</span>
          <span>Weekends: not included</span>
          <span>Public holidays: not included</span>
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

    <ContentModal :show="showContent" :content-key="activeContentKey" @close="showContent = false" />
    <TermsModal :show="showTerms" audience="consumer" @close="showTerms = false" />
  </footer>
</template>

<style scoped>
.hh-footer {
  container-type: inline-size;
  margin-top: 56px;
  background: #111111;
  color: rgba(255, 255, 255, 0.82);
  border-radius: 24px 24px 0 0;
  font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.6;
}

/* Padding lives here, not on <footer>: App.vue adds pb-24 to the root to clear the
   tab bar, and a padding rule on the root would silently override it. */
.hh-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 52px 20px max(env(safe-area-inset-bottom), 26px);
  display: grid;
  grid-template-columns: 1fr;
  gap: 34px;
  align-items: start;
}

.hh-footer__h {
  margin: 0 0 12px;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-weight: 650;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #ffffff;
}

/* Brand */
.hh-footer__brand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.hh-footer__mark {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 12px;
  background: #ffffff;
  color: #111111;
  display: grid;
  place-items: center;
}
.hh-footer__mark svg { width: 24px; height: 24px; }
.hh-footer__name {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
  color: #ffffff;
  letter-spacing: -0.01em;
}
.hh-footer__since {
  margin-top: 5px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}
.hh-footer__stores {
  flex-basis: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.hh-footer__store {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 10px;
  font-size: 13px;
  color: #ffffff;
  transition: border-color 0.15s ease;
}
.hh-footer__store:hover { border-color: rgba(255, 255, 255, 0.6); }

/* Quick links: inline, each with a hairline underline */
.hh-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.hh-footer__link {
  padding: 0;
  background: none;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
  font: inherit;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.hh-footer__link:hover { color: #ffffff; border-color: rgba(255, 255, 255, 0.7); }

/* Contact / hours */
.hh-footer__lines {
  display: grid;
  gap: 5px;
  font-size: 14px;
  line-height: 1.45;
}
.hh-footer__lines--muted { color: rgba(255, 255, 255, 0.74); }
.hh-footer__plain {
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: color 0.15s ease;
}
.hh-footer__plain:hover { color: #ffffff; }
.hh-footer__text-btn {
  justify-self: start;
  padding: 0;
  background: none;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
  font: inherit;
  cursor: pointer;
}

/* Legal row: ruled, spread across the full width */
.hh-footer__legal {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 14px;
}
.hh-footer__legal-link {
  padding: 0;
  background: none;
  border: 0;
  font: inherit;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.64);
  cursor: pointer;
  transition: color 0.15s ease;
}
.hh-footer__legal-link:hover { color: #ffffff; }

.hh-footer button:focus-visible,
.hh-footer a:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 3px;
  border-radius: 3px;
}

/* Two columns once there is room: brand + links, contact + hours */
@container (min-width: 560px) {
  .hh-footer__inner {
    grid-template-columns: 1fr 1fr;
    gap: 36px 40px;
    padding-left: 32px;
    padding-right: 32px;
  }
}

/* The reference layout: four columns in one row */
@container (min-width: 900px) {
  .hh-footer__inner {
    grid-template-columns: 0.9fr 1.5fr 1fr 0.9fr;
    gap: 34px 56px;
    padding: 90px 56px 42px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hh-footer * { transition: none !important; }
}
</style>
