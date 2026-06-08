<script setup>
// فوتر چهارستونه با دکمه‌های دانلود اپلیکیشن، آیکن شبکه‌های اجتماعی و کپی‌رایت.
// هر لینک یک ContentModal باز می‌کند که محتوای فارسی را از SiteSetting بک‌اند بار می‌کند،
// تا متن هر بخش از پنل ادمین قابل ویرایش باشد.

import { ref } from 'vue';
import ContentModal from './ContentModal.vue';
import TermsModal from './TermsModal.vue';

// نقشه ستون‌ها — هر لینک یک contentKey دارد که با کلید SiteSetting بک‌اند مطابقت می‌کند.
// لینک «شرایط استفاده» همان TOS بلند را که قبلاً در سیستم موجود است باز می‌کند.
const COLUMNS = [
  {
    title: 'اشتراک',
    links: [
      { label: 'عضویت ۲۰۲۶',  key: 'content_membership_2026' },
      { label: 'کلید VIP',     key: 'content_membership_vip'  },
    ],
  },
  {
    title: 'شرکت',
    links: [
      { label: 'همکاری با ما',     key: 'content_company_partner'   },
      { label: 'مشتریان سازمانی',  key: 'content_company_corporate' },
      { label: 'فرصت‌های شغلی',    key: 'content_company_careers'   },
      { label: 'درباره ما',        key: 'content_company_about'     },
    ],
  },
  {
    title: 'راهنما و پشتیبانی',
    links: [
      { label: 'سوالات متداول', key: 'content_help_faqs'    },
      { label: 'قوانین استفاده', key: 'content_help_rules'   },
      { label: 'تماس با ما',     key: 'content_help_contact' },
    ],
  },
  {
    title: 'قوانین',
    links: [
      { label: 'قرارداد کاربری',  key: 'content_legal_eula'    },
      { label: 'شرایط استفاده',   key: '__terms_consumer__'    }, // ویژه: TermsModal باز می‌کند
      { label: 'حریم خصوصی',     key: 'content_legal_privacy' },
    ],
  },
];

const SOCIAL = [
  { icon: 'fa-brands fa-instagram', href: 'https://instagram.com/happyhour', label: 'اینستاگرام' },
  { icon: 'fa-brands fa-telegram',  href: 'https://t.me/happyhour',          label: 'تلگرام'     },
  { icon: 'fa-brands fa-youtube',   href: 'https://youtube.com/@happyhour',  label: 'یوتیوب'     },
  { icon: 'fa-brands fa-x-twitter', href: 'https://x.com/happyhour',         label: 'ایکس'      },
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

// سال شمسی برای کپی‌رایت
const persianYear = new Date().toLocaleDateString('fa-IR-u-ca-persian', { year: 'numeric' });
</script>

<template>
  <footer class="bg-teal-800 text-cream-50 mt-12 pb-[max(env(safe-area-inset-bottom),24px)]">
    <div class="max-w-6xl mx-auto px-5 md:px-8 py-10">
      <!-- بالا: ۴ ستون لینک + دکمه‌های دانلود -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-8">
        <div v-for="col in COLUMNS" :key="col.title">
          <div class="font-bold text-sm uppercase tracking-wider text-cream-50 mb-3">{{ col.title }}</div>
          <ul class="space-y-2">
            <li v-for="link in col.links" :key="link.label">
              <button
                @click="openLink(link)"
                class="text-sm text-cream-100/85 hover:text-white hover:underline text-right transition"
              >{{ link.label }}</button>
            </li>
          </ul>
        </div>

        <!-- دانلود اپلیکیشن -->
        <div class="col-span-2 md:col-span-1">
          <div class="font-bold text-sm uppercase tracking-wider text-cream-50 mb-3">دانلود اپلیکیشن</div>
          <div class="space-y-2">
            <a href="#" class="flex items-center gap-2 bg-black rounded-xl px-3 py-2 hover:bg-black/80 transition w-fit">
              <i class="fa-brands fa-google-play text-white text-xl"></i>
              <div class="leading-tight">
                <div class="text-[9px] uppercase tracking-wider text-cream-100/70">دریافت از</div>
                <div class="text-sm font-bold text-white">گوگل پلی</div>
              </div>
            </a>
            <a href="#" class="flex items-center gap-2 bg-black rounded-xl px-3 py-2 hover:bg-black/80 transition w-fit">
              <i class="fa-brands fa-apple text-white text-xl"></i>
              <div class="leading-tight">
                <div class="text-[9px] uppercase tracking-wider text-cream-100/70">دریافت از</div>
                <div class="text-sm font-bold text-white">اپ استور</div>
              </div>
            </a>
            <a href="#" class="flex items-center gap-2 bg-black rounded-xl px-3 py-2 hover:bg-black/80 transition w-fit">
              <i class="fa-solid fa-cube text-white text-xl"></i>
              <div class="leading-tight">
                <div class="text-[9px] uppercase tracking-wider text-cream-100/70">دریافت از</div>
                <div class="text-sm font-bold text-white">کافه بازار</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- پایین: لوگو + کپی‌رایت + شبکه‌های اجتماعی -->
      <div class="mt-10 pt-6 border-t border-cream-50/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-cream-50 text-teal-800 flex items-center justify-center">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <div class="text-sm text-cream-100/80">© هپی اَور — تمامی حقوق محفوظ است · {{ persianYear }}</div>
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
