<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../api/client';
import { useDailyStore } from '../stores/daily';

const items = ref([]);
const loading = ref(true);
const daily = useDailyStore();
const now = ref(new Date());

onMounted(async () => {
  daily.refresh();
  try {
    const { data } = await client.get('/customer/wallet');
    items.value = data.items;
  } finally { loading.value = false; }
  setInterval(() => { now.value = new Date(); }, 60000);
});

const DAYS_ORDER = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_LABEL = { sun:'Sun', mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', daily:'Every day' };

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2,'0')}${ampm}`;
}

function windowDaysLabel(days) {
  if (!days || days.length === 0 || days.includes('daily')) return 'Every day';
  if (days.length === 7) return 'Every day';
  const sorted = DAYS_ORDER.filter((d) => days.includes(d));
  return sorted.map((d) => DAY_LABEL[d]).join(', ');
}

function activeWindow(p) {
  return p.couponId?.activeWindow || null;
}

function isUsableNow(p) {
  const w = activeWindow(p);
  if (!w || !w.start || !w.end) return true;
  const days = w.days || ['daily'];
  const n = now.value;
  const dayName = DAYS_ORDER[n.getDay()];
  if (!days.includes('daily') && !days.includes(dayName)) return false;
  const [sh, sm] = w.start.split(':').map(Number);
  const [eh, em] = w.end.split(':').map(Number);
  const cur = n.getHours() * 60 + n.getMinutes();
  return cur >= sh * 60 + sm && cur <= eh * 60 + em;
}

function nextWindowText(p) {
  const w = activeWindow(p);
  if (!w || !w.start || !w.end) return null;
  const days = w.days || ['daily'];
  const n = now.value;
  const todayName = DAYS_ORDER[n.getDay()];
  const [sh, sm] = w.start.split(':').map(Number);
  const minStart = sh * 60 + sm;
  const cur = n.getHours() * 60 + n.getMinutes();
  if ((days.includes('daily') || days.includes(todayName)) && cur < minStart) {
    return `Opens today at ${fmtTime(w.start)}`;
  }
  for (let i = 1; i <= 7; i++) {
    const dayName = DAYS_ORDER[(n.getDay() + i) % 7];
    if (days.includes('daily') || days.includes(dayName)) {
      const label = i === 1 ? 'tomorrow' : DAY_LABEL[dayName];
      return `Opens ${label} at ${fmtTime(w.start)}`;
    }
  }
  return null;
}

function statusLabel(s) {
  return { active: 'فعال', fully_redeemed: 'مصرف شده', expired: 'منقضی', refunded: 'بازپرداخت' }[s] || s;
}
</script>

<template>
  <div class="pb-28 safe-top">
    <header class="px-5 pt-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Wallet</h1>
        <p class="text-ink-500 mt-1">Your claimed coupons.</p>
      </div>
      <div class="ios-card p-3 text-center">
        <div class="text-[10px] uppercase tracking-wider font-semibold text-ink-500">Today</div>
        <div class="text-xl font-bold text-teal-700">{{ daily.remaining }}<span class="text-sm text-ink-500">/{{ daily.limit }}</span></div>
      </div>
    </header>

    <div class="mx-5 mt-3 ios-card p-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200">
      <i class="fa-solid fa-circle-info text-amber-600 mt-0.5"></i>
      <p class="text-xs text-amber-900 leading-relaxed">
        <strong>Heads up:</strong> Each coupon is only redeemable during its <strong>happy hour window</strong>. The merchant can only accept your coupon during those times. Check the time on each card below before you go!
      </p>
    </div>

    <div v-if="loading" class="px-5 mt-6 space-y-4">
      <div v-for="i in 3" :key="i" class="ios-card h-40 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="px-5 mt-16 text-center">
      <div class="mx-auto w-20 h-20 rounded-3xl bg-cream-200 flex items-center justify-center">
        <i class="fa-solid fa-wallet text-3xl text-ink-300"></i>
      </div>
      <div class="mt-4 font-semibold">No coupons yet</div>
      <p class="text-ink-500 text-sm mt-1">Browse offers and claim your favorites.</p>
      <router-link to="/browse" class="ios-button-primary inline-block mt-5">Browse offers</router-link>
    </div>
    <div v-else class="px-5 mt-4 space-y-4">
      <div v-for="p in items" :key="p._id" class="ios-card overflow-hidden">
        <div class="flex">
          <div class="relative w-28 flex-shrink-0">
            <img :src="p.couponId?.heroImageUrl" class="w-full h-full object-cover bg-cream-200" />
            <div v-if="isUsableNow(p) && p.status === 'active' && p.usesRemaining > 0" class="absolute bottom-1.5 left-1.5 right-1.5">
              <span class="block text-center text-[9px] font-bold uppercase tracking-wider bg-green-500 text-white rounded-full py-0.5">
                Usable now
              </span>
            </div>
            <div v-else-if="!isUsableNow(p) && p.status === 'active'" class="absolute bottom-1.5 left-1.5 right-1.5">
              <span class="block text-center text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-white rounded-full py-0.5">
                Outside hours
              </span>
            </div>
          </div>
          <div class="flex-1 p-4 min-w-0">
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider truncate">{{ p.couponId?.vendorId?.name }}</div>
            <div class="font-bold leading-tight truncate">{{ p.couponId?.title }}</div>

            <div v-if="activeWindow(p)" class="mt-2 p-2 rounded-xl text-xs" :class="isUsableNow(p) ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'">
              <div class="flex items-center gap-1.5">
                <i :class="isUsableNow(p) ? 'fa-solid fa-circle-check' : 'fa-regular fa-clock'"></i>
                <span class="font-bold">
                  {{ isUsableNow(p) ? 'Redeem now' : nextWindowText(p) || 'Outside active hours' }}
                </span>
              </div>
              <div class="mt-0.5 opacity-80">
                Active {{ windowDaysLabel(activeWindow(p).days) }} · {{ fmtTime(activeWindow(p).start) }}–{{ fmtTime(activeWindow(p).end) }}
              </div>
            </div>
            <div v-else class="mt-2 text-xs text-ink-500">
              <i class="fa-solid fa-circle-check text-green-600 mr-1"></i> Anytime
            </div>

            <div class="flex items-center gap-2 mt-2">
              <span class="chip bg-teal-50 text-teal-700 text-[10px]">{{ p.usesRemaining }} / {{ p.couponId?.maxUsesPerCustomer }} use{{ p.couponId?.maxUsesPerCustomer > 1 ? 's' : '' }} left</span>
              <span class="chip bg-cream-200 text-ink-700 text-[10px]">{{ statusLabel(p.status) }}</span>
            </div>
            <div class="mt-3">
              <router-link
                :to="`/wallet/${p._id}/redeem`"
                v-if="p.status === 'active' && p.usesRemaining > 0"
                class="text-sm font-semibold active:opacity-70"
                :class="isUsableNow(p) ? 'text-teal-700' : 'text-amber-700'"
              >Show to merchant <i class="fa-solid fa-arrow-right text-[10px] ml-0.5"></i></router-link>
              <div v-else class="text-sm text-ink-300">Not redeemable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
