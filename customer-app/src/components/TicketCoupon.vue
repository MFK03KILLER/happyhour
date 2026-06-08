<script setup>
import { computed } from 'vue';

const props = defineProps({
  coupon: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  variant: { type: String, default: 'today' },
  outsideHours: { type: Boolean, default: false },
});
const emit = defineEmits(['claim']);

const palette = {
  today: 'from-coral-500 to-coral-600',
  popup: 'from-purple-500 to-purple-700',
  always: 'from-teal-500 to-teal-700',
};
const gradient = computed(() => palette[props.variant] || palette.today);

const variantLabel = computed(() => ({
  today: 'آفر امروز',
  popup: 'آفر ویژه',
  always: 'همیشه فعال',
}[props.variant] || 'آفر'));

const badge = computed(() => {
  const t = props.coupon.offerType;
  if (t === 'BOGO') return { big: '1+1', small: 'BOGO' };
  if (t === 'PERCENT_OFF') return { big: `${props.coupon.discountValue || 0}%`, small: 'OFF' };
  if (t === 'FLAT_OFF') return { big: `$${props.coupon.discountValue || 0}`, small: 'OFF' };
  if (t === 'FREE_ITEM') return { big: 'FREE', small: 'ITEM' };
  return { big: 'DEAL', small: '' };
});

const windowText = computed(() => {
  const w = props.coupon.activeWindow;
  if (!w || !w.start || !w.end) return null;
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2,'0')}${ampm}`;
  };
  const days = w.days || ['daily'];
  const dayText = days.includes('daily') ? 'Daily' : days.map((d) => d[0].toUpperCase() + d.slice(1)).join(' · ');
  return `${dayText} · ${fmt(w.start)}–${fmt(w.end)}`;
});

function onClaim() { if (!props.locked) emit('claim', props.coupon); }
</script>

<template>
  <div class="relative">
    <div class="rounded-2xl overflow-hidden shadow-soft text-white bg-gradient-to-r relative" :class="[gradient, locked ? 'opacity-95' : '']">
      <div class="flex items-stretch">
        <div class="w-[92px] flex-shrink-0 relative flex flex-col items-center justify-center py-4 px-2 text-center">
          <div class="text-[9px] uppercase tracking-widest opacity-80 font-bold leading-tight">{{ variantLabel.split(' ')[0] }}</div>
          <div class="font-extrabold leading-none mt-1.5" :class="badge.big.length > 4 ? 'text-lg' : 'text-2xl'">{{ badge.big }}</div>
          <div v-if="badge.small" class="text-[9px] uppercase tracking-wider opacity-90 font-bold mt-0.5">{{ badge.small }}</div>
        </div>

        <div class="absolute top-0 bottom-0 border-l-2 border-dashed border-white/40 pointer-events-none" style="left: 92px;"></div>
        <div class="absolute -top-2 w-4 h-4 rounded-full bg-cream-100 shadow-inner pointer-events-none" style="left: 84px;"></div>
        <div class="absolute -bottom-2 w-4 h-4 rounded-full bg-cream-100 shadow-inner pointer-events-none" style="left: 84px;"></div>

        <div class="flex-1 min-w-0 p-3.5 pl-5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="text-[10px] uppercase tracking-wider font-bold opacity-80">{{ variantLabel }}</div>
              <div class="font-bold text-[15px] leading-tight mt-0.5 break-words">{{ coupon.title }}</div>
              <div class="text-xs opacity-85 mt-0.5 break-words line-clamp-2">{{ coupon.subtitle }}</div>
            </div>
            <div v-if="locked" class="w-7 h-7 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-lock text-xs"></i>
            </div>
          </div>

          <div v-if="windowText || outsideHours || coupon.unavailableToday" class="mt-2 flex items-center gap-1.5 flex-wrap">
            <div v-if="windowText" class="text-[10px] font-semibold opacity-85 inline-flex items-center gap-1">
              <i class="fa-regular fa-clock text-[10px]"></i>
              <span>{{ windowText }}</span>
            </div>
            <span v-if="outsideHours" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 text-[9px] font-bold uppercase">
              <i class="fa-solid fa-hourglass-half text-[8px]"></i>
              خارج از ساعت
            </span>
            <span v-if="coupon.unavailableToday" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 text-[9px] font-bold uppercase">
              <i class="fa-solid fa-calendar-xmark text-[8px]"></i>
              امروز تعطیل · {{ coupon.unavailableToday.name }}
            </span>
          </div>

          <div class="mt-2.5 flex justify-end">
            <button
              v-if="!locked && !coupon.unavailableToday"
              @click="onClaim"
              class="bg-white rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap text-ink-900 active:scale-95 transition shadow-soft inline-flex items-center gap-1"
            >Claim <i class="fa-solid fa-arrow-right text-[10px]"></i></button>
            <button v-else-if="coupon.unavailableToday" disabled class="bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1 opacity-80">
              <i class="fa-solid fa-calendar-xmark text-[9px]"></i> فردا امتحان کنید
            </button>
            <button v-else class="bg-white/25 backdrop-blur rounded-full px-3 py-1.5 text-[10px] font-bold whitespace-nowrap inline-flex items-center gap-1">
              <i class="fa-solid fa-lock text-[9px]"></i> برای دسترسی عضو شوید
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
