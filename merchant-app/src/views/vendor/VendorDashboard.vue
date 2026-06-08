<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { persianNumber, permissionLabel } from '../../composables/useFormat';

const auth = useAuthStore();
const router = useRouter();
const stats = ref(null);
const best = ref(null);
const loading = ref(true);

onMounted(async () => {
  const canSee = (auth.user?.permissions || []).includes('view_stats');
  if (!canSee) { loading.value = false; return; }
  try {
    const [s, b] = await Promise.all([
      client.get('/vendor/stats'),
      client.get('/vendor/best-now').catch(() => ({ data: null })),
    ]);
    stats.value = s.data;
    best.value = b.data;
  } finally { loading.value = false; }
});

function can(p) { return (auth.user?.permissions || []).includes(p); }

function offerBadge(c) {
  if (c.offerType === 'BOGO') return '1+1';
  if (c.offerType === 'PERCENT_OFF') return `${c.discountValue || 0}% off`;
  if (c.offerType === 'FLAT_OFF') return `$${c.discountValue || 0} off`;
  if (c.offerType === 'FREE_ITEM') return 'Free item';
  return c.offerType;
}

const nowLabel = computed(() => {
  if (!best.value?.now) return '';
  return new Date(best.value.now).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
});
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold">داشبورد بیزنس</h1>
    <p class="text-ink-500 mt-1">عملکرد همه شعب شما</p>

    <div v-if="auth.user?.permissions?.length" class="mt-3 flex gap-1.5 flex-wrap">
      <span v-for="p in auth.user.permissions" :key="p" class="chip bg-teal-50 text-teal-700 text-[10px]">
        {{ permissionLabel(p) }}
      </span>
    </div>

    <template v-else>
      <div v-if="loading" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="ios-card h-28 animate-pulse"></div>
      </div>

      <div v-else-if="stats" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="ios-card p-5 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
          <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">امروز</div>
          <div class="text-3xl font-bold mt-2">{{ stats.today }}</div>
          <div class="text-xs opacity-80 mt-1">استفاده شده</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">این هفته</div>
          <div class="text-3xl font-bold mt-2">{{ stats.week }}</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">این ماه</div>
          <div class="text-3xl font-bold mt-2">{{ stats.month }}</div>
        </div>
        <div class="ios-card p-5">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">شعب</div>
          <div class="text-3xl font-bold mt-2">{{ stats.merchantCount }}</div>
        </div>
      </div>

      <div v-if="best && best.activeNow > 0" class="mt-6 ios-card p-5 bg-gradient-to-br from-coral-500 to-coral-600 text-white relative overflow-hidden">
        <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10"></div>
        <div class="relative">
          <div class="flex items-center gap-2 text-xs uppercase font-bold tracking-wider opacity-90">
            <i class="fa-solid fa-bolt"></i>
            <span>الان فعال · {{ nowLabel }}</span>
          </div>
          <div class="mt-2 text-lg font-bold">{{ best.activeNow }} کوپن همین حالا فعال است</div>
          <div v-if="best.slowMerchantCount" class="text-sm opacity-90 mt-1">
            <i class="fa-solid fa-clock mr-1"></i>
            {{ best.slowMerchantCount }} شعبه‌ی شما در بازه‌ی هپی اَور هستند
          </div>

          <div v-if="best.top?.length" class="mt-4 space-y-2">
            <div class="text-xs uppercase opacity-75 font-bold">بهترین گزینه‌ها برای برجسته‌سازی</div>
            <div v-for="(t, idx) in best.top" :key="t.coupon._id" class="bg-white/15 backdrop-blur rounded-2xl p-3 flex items-center gap-3 active:scale-[.98]" @click="router.push('/vendor/coupons')">
              <div class="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center font-bold text-sm flex-shrink-0">{{ idx + 1 }}</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-sm truncate">{{ t.coupon.title }}</div>
                <div class="text-xs opacity-90 truncate">{{ offerBadge(t.coupon) }} · {{ t.recentScans }} اسکن در ۳۰ روز اخیر</div>
              </div>
              <div class="flex gap-1 flex-shrink-0">
                <span v-if="t.isToday" class="chip bg-white/25 text-white text-[10px]"><i class="fa-solid fa-fire text-[9px]"></i></span>
                <span v-if="t.isPopup" class="chip bg-white/25 text-white text-[10px]"><i class="fa-solid fa-bolt text-[9px]"></i></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="best && best.activeNow === 0" class="mt-6 ios-card p-5 bg-amber-50 border-2 border-amber-300">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <div>
            <div class="font-bold text-amber-900">هیچ کوپنی الان فعال نیست</div>
            <p class="text-sm text-amber-800 mt-1">مشتریان در این لحظه نمی‌توانند هیچ کوپنی دریافت کنند. بازه‌ی فعال کوپن‌ها را بررسی کنید یا کوپنی فعال در همین زمان اضافه کنید.</p>
            <button @click="router.push('/vendor/coupons')" class="mt-3 ios-button-primary bg-amber-600 text-white text-sm">مدیریت کوپن‌ها</button>
          </div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <button @click="router.push('/vendor/analytics')" class="ios-card p-4 text-left active:scale-[.98] transition">
          <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2">
            <i class="fa-solid fa-chart-line"></i>
          </div>
          <div class="font-bold">تحلیل‌ها</div>
          <div class="text-xs text-ink-500">نمودارها، روندها، پیشنهادها</div>
        </button>
        <button @click="router.push('/vendor/coupons')" class="ios-card p-4 text-left active:scale-[.98] transition">
          <div class="w-10 h-10 rounded-xl bg-coral-500/10 text-coral-600 flex items-center justify-center mb-2">
            <i class="fa-solid fa-ticket"></i>
          </div>
          <div class="font-bold">کوپن‌ها</div>
          <div class="text-xs text-ink-500">مدیریت آفرها</div>
        </button>
        <button @click="router.push('/vendor/merchants')" class="ios-card p-4 text-left active:scale-[.98] transition">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2">
            <i class="fa-solid fa-store"></i>
          </div>
          <div class="font-bold">شعب</div>
          <div class="text-xs text-ink-500">هپی اَور، ساعات کاری</div>
        </button>
      </div>

      <div class="mt-6 ios-card p-5">
        <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider">دسترسی‌های شما</div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span v-for="p in (auth.user?.permissions || [])" :key="p" class="chip bg-teal-50 text-teal-700 text-[10px]">{{ p.replace(/_/g, ' ') }}</span>
          <span v-if="!(auth.user?.permissions || []).length" class="text-sm text-ink-500">دسترسی خاصی ندارید</span>
        </div>
      </div>
    </template>
  </div>
</template>
