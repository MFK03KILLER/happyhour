<script setup>
import { useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import client from '../api/client';
import { toman, persianNumber } from '../composables/useFormat';

const router = useRouter();
const billing = ref('monthly');

// قیمت‌ها از پنل ادمین خوانده می‌شوند (SiteSetting → /public/plans). مقادیر زیر فقط fallback هستند.
const goldMonthly = ref(999000);
const goldYearly = ref(9990000);
const apiBullets = ref([]);

onMounted(loadPlan);
async function loadPlan() {
  try {
    const { data } = await client.get('/public/plans', { params: { audience: 'customer' } });
    const gold = (data.plans || []).find((p) => p.tier === 'gold');
    if (gold) {
      if (gold.price?.monthly != null) goldMonthly.value = Number(gold.price.monthly);
      if (gold.price?.yearly != null) goldYearly.value = Number(gold.price.yearly);
      if (Array.isArray(gold.bullets) && gold.bullets.length) apiBullets.value = gold.bullets;
    }
  } catch { /* fallback به مقادیر پیش‌فرض */ }
}

const priceNow = computed(() => (billing.value === 'monthly' ? goldMonthly.value : goldYearly.value));
const priceLabel = computed(() => toman(priceNow.value));
const monthlyLabel = computed(() => toman(goldMonthly.value));
const perMonthEquivalent = computed(() => toman(Math.round(goldYearly.value / 12)));
const yearlySavingsPct = computed(() => {
  const full = goldMonthly.value * 12;
  if (!full || goldYearly.value >= full) return 0;
  return Math.round((1 - goldYearly.value / full) * 100);
});

const bullets = computed(() => (apiBullets.value.length ? apiBullets.value : [
  'استفاده نامحدود از کوپن‌ها',
  'دسترسی به همه‌ی کسب‌وکارهای شریک',
  'کد QR امن و چرخشی (هر ۶۰ ثانیه)',
  'پرداخت با زیبال، زرین‌پال یا کارت‌به‌کارت',
  'لغو در هر زمان، بدون قید',
]));

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const features = [
  { icon: 'sparkles', title: 'آفرهای دست‌چین‌شده', text: 'بهترین رستوران‌ها و کافه‌های محله، انتخاب‌شده توسط محلی‌ها — نه تخفیف‌های بی‌هویت.' },
  { icon: 'qr', title: 'کد QR لمسی', text: 'سر صندوق کدتان را نشان دهید. هر ۶۰ ثانیه عوض می‌شود — امن و غیرقابل اسکرین‌شات.' },
  { icon: 'star', title: 'تا ۵۰٪ تخفیف', text: 'یکی بخر یکی ببر، قهوه‌ی رایگان، تفریح نیم‌بها. ارزش واقعی، هر روز.' },
  { icon: 'wallet', title: 'یک عضویت، همه‌جا', text: 'ماهی یک‌بار پرداخت کنید و همه‌ی کوپن‌های همه‌ی شریک‌ها را باز کنید — بدون هزینه‌ی پنهان.' },
];

const steps = [
  { n: '۱', title: 'عضو شوید', text: 'با شماره موبایل ثبت‌نام کنید و عضویت را فعال کنید.' },
  { n: '۲', title: 'کوپن انتخاب کنید', text: 'از میان صدها آفر نزدیک شما، مورد دلخواهتان را بردارید.' },
  { n: '۳', title: 'کد را نشان دهید', text: 'سر صندوق QR یا کد ۶ رقمی را نشان دهید — تخفیف اعمال می‌شود.' },
];

const partners = [
  { name: 'کافه نادری', cat: 'کافه', img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=300' },
  { name: 'پیتزا مهر', cat: 'ایتالیایی', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300' },
  { name: 'باشگاه آسمان', cat: 'تفریحی', img: 'https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=300' },
  { name: 'جیم آهنین', cat: 'تناسب اندام', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300' },
  { name: 'سینما غروب', cat: 'سینما', img: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=300' },
  { name: 'تاکو ساحلی', cat: 'فست‌فود', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300' },
];

const testimonials = [
  { name: 'سارا ج.', city: 'تهران', text: 'هفته‌ی اول هزینه‌اش درآمد. فقط آفر «یکی بخر یکی ببر» پیتزا مهر سه ماه عضویتم را پوشش داد.', stars: 5 },
  { name: 'مرتضی ت.', city: 'کرج', text: 'بالاخره یک اپ تخفیف که حس بی‌اعتمادی نمی‌دهد. طراحی تمیز و مکان‌های واقعی محلی.', stars: 5 },
  { name: 'آیدا پ.', city: 'تهران', text: 'تقریباً هر آخر هفته استفاده می‌کنم. اسکن QR سر صندوق فروشگاه‌ها فوری است.', stars: 5 },
];

const stats = [
  { value: 'بیش از ۲۰۰', label: 'کسب‌وکار محلی' },
  { value: 'تا ۵۰٪', label: 'تخفیف روی هر سفارش' },
  { value: '۴٫۹★', label: 'امتیاز کاربران' },
  { value: 'بیش از ۱۲٬۴۰۰', label: 'عضو فعال' },
];
</script>

<template>
  <div class="min-h-screen bg-cream-100 text-ink-900 overflow-x-hidden">
    <!-- نوار بالا (چسبان) -->
    <nav class="sticky top-0 z-50 glass border-b border-white/40">
      <div class="max-w-6xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-soft">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <span class="font-bold text-lg tracking-tight">هپی‌اَور</span>
        </div>
        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-ink-700">
          <a href="#features" @click.prevent="scrollTo('features')" class="hover:text-teal-700 transition">ویژگی‌ها</a>
          <a href="#how" @click.prevent="scrollTo('how')" class="hover:text-teal-700 transition">چطور کار می‌کند</a>
          <a href="#partners" @click.prevent="scrollTo('partners')" class="hover:text-teal-700 transition">شرکا</a>
          <a href="#pricing" @click.prevent="scrollTo('pricing')" class="hover:text-teal-700 transition">قیمت‌ها</a>
          <a href="#faq" @click.prevent="scrollTo('faq')" class="hover:text-teal-700 transition">سوالات</a>
        </div>
        <div class="flex items-center gap-2">
          <button @click="router.push('/login')" class="text-sm font-semibold px-3 py-2 rounded-full hover:bg-cream-200 transition">ورود</button>
          <button @click="router.push('/register')" class="text-sm font-semibold px-4 py-2 rounded-full bg-ink-900 text-white active:scale-95 transition">شروع کنید</button>
        </div>
      </div>
    </nav>

    <!-- قهرمان (Hero) -->
    <section class="relative">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-32 -left-24 w-[500px] h-[500px] rounded-full bg-coral-500/10 blur-3xl"></div>
        <div class="absolute top-40 -right-32 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-3xl"></div>
      </div>

      <div class="relative max-w-6xl mx-auto px-5 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span class="chip bg-coral-500/10 text-coral-600 font-bold">
            <span class="inline-block w-2 h-2 rounded-full bg-coral-500 animate-pulse"></span>
            هم‌اکنون در تهران فعال است
          </span>
          <h1 class="mt-5 text-4xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
            تا <span class="text-coral-500">۵۰٪</span> صرفه‌جویی کنید<br />
            در مکان‌های محبوبتان.
          </h1>
          <p class="mt-5 text-lg text-ink-500 leading-relaxed max-w-md">
            هپی‌اَور باشگاه تخفیف دوستانه‌ی ایران است. با یک عضویت ماهانه، صدها کوپن از رستوران‌ها،
            کافه‌ها و مراکز تفریحی سراسر شهر را باز کنید — بدون شرط و شروط پنهان.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row gap-3">
            <button @click="router.push('/register')" class="rounded-full font-semibold text-white bg-coral-500 px-7 py-4 active:scale-[.97] transition shadow-lift">
              شروع کنید — ماهی {{ monthlyLabel }}
            </button>
            <button @click="router.push('/login')" class="rounded-full font-semibold text-ink-900 bg-white border border-ink-300/40 px-7 py-4 active:scale-[.97] transition">
              قبلاً حساب ساخته‌ام
            </button>
          </div>
          <div class="mt-6 flex items-center gap-2 text-sm text-ink-500">
            <div class="flex -space-x-2 space-x-reverse">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 border-2 border-cream-100"></div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-700 border-2 border-cream-100"></div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 border-2 border-cream-100"></div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-cream-100"></div>
            </div>
            <span>بیش از <span class="font-semibold text-ink-700">۱۲٬۴۰۰</span> نفر هر هفته صرفه‌جویی می‌کنند</span>
          </div>
        </div>

        <!-- ماکت موبایل -->
        <div class="flex justify-center lg:justify-start">
          <div class="relative">
            <div class="absolute -inset-6 bg-gradient-to-br from-teal-500/20 to-coral-500/20 rounded-[60px] blur-2xl"></div>
            <div class="relative w-[300px] h-[620px] rounded-[44px] border-[10px] border-ink-900 shadow-[0_30px_80px_rgba(0,0,0,.3)] overflow-hidden bg-cream-100">
              <div class="absolute top-2 inset-x-0 z-10 flex justify-center">
                <div class="h-6 w-28 rounded-full bg-ink-900"></div>
              </div>
              <div class="h-full pt-8 px-4 pb-4 overflow-hidden">
                <div class="text-xs text-ink-500 font-medium px-1">جمعه، ۳۱ خرداد</div>
                <div class="text-xl font-bold mt-0.5 px-1">سلام، سارا 👋</div>

                <div class="mt-4 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 text-white p-5 shadow-lift relative overflow-hidden">
                  <div class="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-white/10"></div>
                  <div class="text-[10px] uppercase tracking-wider opacity-80 font-semibold">صرفه‌جویی تا</div>
                  <div class="text-3xl font-bold mt-1">۵۰٪ تخفیف</div>
                  <div class="text-xs opacity-90 mt-1">در مکان‌های محبوبتان.</div>
                </div>

                <div class="mt-4 ios-card overflow-hidden">
                  <div class="relative aspect-[16/10]">
                    <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-2 left-3 right-3 text-white">
                      <div class="text-[10px] uppercase font-bold tracking-wider opacity-90">پیتزا مهر</div>
                      <div class="text-base font-bold leading-tight">اسلایس صبحگاهی</div>
                    </div>
                  </div>
                  <div class="px-3 py-2.5 flex items-center justify-between">
                    <div class="text-xs text-ink-500">دو اسلایس + نوشیدنی</div>
                    <div class="text-sm font-bold text-teal-700">رایگان برای اعضا</div>
                  </div>
                </div>

                <div class="mt-3 ios-card overflow-hidden">
                  <div class="relative aspect-[16/10]">
                    <img src="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-2 left-3 right-3 text-white">
                      <div class="text-[10px] uppercase font-bold tracking-wider opacity-90">کافه نادری</div>
                      <div class="text-base font-bold leading-tight">فلایت کولد برو</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- نوار اعتماد (آمار) -->
    <section class="py-8 bg-white border-y border-cream-200">
      <div class="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div v-for="s in stats" :key="s.label">
          <div class="text-2xl md:text-3xl font-bold text-teal-700">{{ s.value }}</div>
          <div class="text-xs text-ink-500 mt-1">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- ویژگی‌ها -->
    <section id="features" class="py-20 max-w-6xl mx-auto px-5 lg:px-8">
      <div class="text-center max-w-xl mx-auto">
        <span class="chip bg-teal-50 text-teal-700">چه چیزی می‌گیرید</span>
        <h2 class="mt-4 text-3xl lg:text-4xl font-bold tracking-tight">ساخته‌شده برای زندگی واقعی.</h2>
        <p class="mt-3 text-ink-500">بدون جست‌وجوی کوپن، بدون شرط ریز. فقط یک اپ برای هر جایی که می‌روید.</p>
      </div>

      <div class="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="f in features" :key="f.title" class="ios-card p-6">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-soft">
            <svg v-if="f.icon==='sparkles'" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            <svg v-if="f.icon==='qr'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M20 14v3M14 20h3M20 20v.01"/></svg>
            <svg v-if="f.icon==='star'" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            <svg v-if="f.icon==='wallet'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><circle cx="17" cy="14" r="1.4"/></svg>
          </div>
          <h3 class="mt-5 font-bold text-lg">{{ f.title }}</h3>
          <p class="mt-2 text-sm text-ink-500 leading-relaxed">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <!-- چطور کار می‌کند -->
    <section id="how" class="py-20 bg-white border-y border-cream-200">
      <div class="max-w-5xl mx-auto px-5 lg:px-8">
        <div class="text-center max-w-xl mx-auto">
          <span class="chip bg-coral-500/10 text-coral-600">در سه قدم</span>
          <h2 class="mt-4 text-3xl lg:text-4xl font-bold tracking-tight">چطور کار می‌کند؟</h2>
          <p class="mt-3 text-ink-500">از ثبت‌نام تا تخفیف، کمتر از یک دقیقه.</p>
        </div>
        <div class="mt-12 grid md:grid-cols-3 gap-5">
          <div v-for="s in steps" :key="s.n" class="ios-card p-6 text-center">
            <div class="w-12 h-12 mx-auto rounded-full bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-soft">{{ s.n }}</div>
            <h3 class="mt-4 font-bold text-lg">{{ s.title }}</h3>
            <p class="mt-2 text-sm text-ink-500 leading-relaxed">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- شرکا -->
    <section id="partners" class="py-20 max-w-6xl mx-auto px-5 lg:px-8">
      <div class="text-center max-w-xl mx-auto">
        <span class="chip bg-coral-500/10 text-coral-600">شرکای ما</span>
        <h2 class="mt-4 text-3xl lg:text-4xl font-bold tracking-tight">جاهایی که واقعاً دوست دارید بروید.</h2>
        <p class="mt-3 text-ink-500">منتخب مکان‌های محبوب محلی — نه برندهای بی‌روح.</p>
      </div>
      <div class="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="p in partners" :key="p.name" class="ios-card overflow-hidden text-center">
          <div class="aspect-square overflow-hidden">
            <img :src="p.img" :alt="p.name" class="w-full h-full object-cover" />
          </div>
          <div class="p-3">
            <div class="font-semibold text-sm leading-tight">{{ p.name }}</div>
            <div class="text-[11px] text-ink-500 mt-0.5">{{ p.cat }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- قیمت‌گذاری -->
    <section id="pricing" class="py-20 bg-white border-y border-cream-200">
      <div class="max-w-5xl mx-auto px-5 lg:px-8">
        <div class="text-center">
          <span class="chip bg-teal-50 text-teal-700">قیمت‌گذاری</span>
          <h2 class="mt-4 text-3xl lg:text-4xl font-bold tracking-tight">یک پلن. دسترسی کامل.</h2>
          <p class="mt-3 text-ink-500">هر زمان لغو کنید. بدون شرط پنهان.</p>
        </div>

        <div class="mt-10 flex items-center justify-center">
          <div class="inline-flex bg-cream-200 rounded-full p-1">
            <button
              @click="billing='monthly'"
              class="px-5 py-2 rounded-full text-sm font-semibold transition"
              :class="billing==='monthly' ? 'bg-white shadow-soft' : 'text-ink-500'"
            >ماهانه</button>
            <button
              @click="billing='yearly'"
              class="px-5 py-2 rounded-full text-sm font-semibold transition"
              :class="billing==='yearly' ? 'bg-white shadow-soft' : 'text-ink-500'"
            >سالانه<span v-if="yearlySavingsPct"> · {{ persianNumber(yearlySavingsPct) }}٪ تخفیف</span></button>
          </div>
        </div>

        <div class="mt-10 max-w-md mx-auto ios-card p-8 relative overflow-hidden">
          <div class="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-coral-500/10"></div>
          <div class="relative">
            <div class="flex items-center justify-between">
              <span class="chip bg-coral-500 text-white">محبوب‌ترین</span>
              <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">دسترسی کامل</span>
            </div>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-4xl font-bold tracking-tight">{{ priceLabel }}</span>
              <span class="text-ink-500">/ {{ billing==='monthly' ? 'ماه' : 'سال' }}</span>
            </div>
            <div v-if="billing==='yearly' && yearlySavingsPct" class="text-sm text-coral-600 font-semibold mt-1">
              معادل ~{{ perMonthEquivalent }} در ماه · {{ persianNumber(yearlySavingsPct) }}٪ صرفه‌جویی
            </div>

            <ul class="mt-6 space-y-3 text-sm">
              <li v-for="b in bullets" :key="b" class="flex gap-2">
                <span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span>
                {{ b }}
              </li>
            </ul>

            <button @click="router.push('/register')" class="ios-button-primary w-full mt-7 text-base">
              همین حالا شروع کنید
            </button>
            <div class="text-center text-xs text-ink-300 mt-3">۷ روز ضمانت بازگشت وجه</div>
          </div>
        </div>
      </div>
    </section>

    <!-- نظر کاربران -->
    <section class="py-20 max-w-6xl mx-auto px-5 lg:px-8">
      <div class="text-center max-w-xl mx-auto">
        <span class="chip bg-teal-50 text-teal-700">محبوبِ اعضا</span>
        <h2 class="mt-4 text-3xl lg:text-4xl font-bold tracking-tight">صرفه‌جویی واقعی، نظر واقعی.</h2>
      </div>
      <div class="mt-12 grid md:grid-cols-3 gap-5">
        <div v-for="t in testimonials" :key="t.name" class="ios-card p-6">
          <div class="flex gap-0.5 text-yellow-400 mb-3">
            <svg v-for="n in t.stars" :key="n" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <p class="text-ink-700 leading-relaxed">«{{ t.text }}»</p>
          <div class="mt-4 flex items-center gap-2">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold">{{ t.name.charAt(0) }}</div>
            <div>
              <div class="font-semibold text-sm">{{ t.name }}</div>
              <div class="text-xs text-ink-500">{{ t.city }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- سوالات متداول -->
    <section id="faq" class="py-20 max-w-3xl mx-auto px-5 lg:px-8">
      <div class="text-center">
        <h2 class="text-3xl lg:text-4xl font-bold tracking-tight">سوالات شما، پاسخ داده شد.</h2>
      </div>
      <div class="mt-10 space-y-3">
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">چطور کار می‌کند؟ <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">ثبت‌نام کنید، عضویت را فعال کنید و شروع به استفاده کنید. آفرها را ببینید، کوپن دلخواهتان را بردارید و سر صندوق کد QR چرخشی یا کد ۶ رقمی را نشان دهید. متصدی اسکن می‌کند و شما صرفه‌جویی می‌کنید.</p>
        </details>
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">هزینه‌ی عضویت چقدر است؟ <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">عضویت ماهانه {{ monthlyLabel }} است و هر زمان قابل لغو است. با پرداخت سالانه از تخفیف بیشتری بهره‌مند می‌شوید.</p>
        </details>
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">می‌توانم هر زمان لغو کنم؟ <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">بله. از بخش پروفایل هر زمان می‌توانید لغو کنید. تا پایان دوره‌ی پرداخت‌شده دسترسی‌تان حفظ می‌شود.</p>
        </details>
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">در کدام شهرها فعال هستید؟ <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">فعلاً تهران. به‌زودی اصفهان، شیراز و مشهد.</p>
        </details>
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">اطلاعات پرداختم امن است؟ <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">ما هرگز شماره‌ی کارت را ذخیره نمی‌کنیم. تمام پرداخت‌ها از طریق درگاه‌های معتبر زیبال و زرین‌پال یا کارت‌به‌کارت انجام می‌شود.</p>
        </details>
      </div>
    </section>

    <!-- فراخوان نهایی -->
    <section class="relative py-20">
      <div class="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-800 to-ink-900"></div>
      <div class="relative max-w-3xl mx-auto px-5 text-center text-white">
        <h2 class="text-3xl lg:text-5xl font-bold tracking-tight">آماده‌ی صرفه‌جویی هستید؟</h2>
        <p class="mt-4 text-cream-50/80 text-lg">به بیش از ۱۲٬۴۰۰ عضو بپیوندید و از همین آخر هفته صرفه‌جویی کنید.</p>
        <button @click="router.push('/register')" class="mt-8 rounded-full font-semibold text-ink-900 bg-coral-500 hover:bg-coral-400 px-8 py-4 active:scale-[.97] transition shadow-lift">
          شروع کنید — ماهی {{ monthlyLabel }}
        </button>
        <div class="mt-3 text-xs text-white/60">۷ روز ضمانت بازگشت وجه · لغو در هر زمان</div>
      </div>
    </section>

    <!-- پاورقی -->
    <footer class="py-10 bg-ink-900 text-white/70">
      <div class="max-w-6xl mx-auto px-5 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <span class="font-bold text-white">هپی‌اَور</span>
        </div>
        <div class="text-sm">© هپی‌اَور · نسخه‌ی دمو</div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
details summary::-webkit-details-marker { display: none; }
</style>
