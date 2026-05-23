<script setup>
import { computed } from 'vue';

const props = defineProps({
  coupon: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  variant: { type: String, default: 'today' },
});
const emit = defineEmits(['claim']);

const colorPalette = {
  today: { from: 'from-coral-500', to: 'to-coral-600', text: 'text-white', accent: 'bg-coral-500', dotShadow: 'shadow-coral-500/30' },
  popup: { from: 'from-purple-500', to: 'to-purple-700', text: 'text-white', accent: 'bg-purple-500', dotShadow: 'shadow-purple-500/30' },
  always: { from: 'from-teal-500', to: 'to-teal-700', text: 'text-white', accent: 'bg-teal-500', dotShadow: 'shadow-teal-500/30' },
};
const colors = computed(() => colorPalette[props.variant] || colorPalette.today);

const offerTypeLabel = computed(() => ({
  BOGO: 'BUY 1 GET 1 FREE',
  PERCENT_OFF: `${props.coupon.discountValue || 0}% OFF`,
  FLAT_OFF: `$${props.coupon.discountValue || 0} OFF`,
  FREE_ITEM: 'FREE ITEM',
  BUNDLE: 'BUNDLE DEAL',
}[props.coupon.offerType] || 'DEAL'));

const variantLabel = computed(() => ({
  today: "Today's Offer",
  popup: 'Pop-up Offer',
  always: 'Always Available',
}[props.variant] || 'Offer'));

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
  const dayText = days.includes('daily') ? 'Daily' : days.map((d) => d.toUpperCase()).join('·');
  return `${dayText} · ${fmt(w.start)}–${fmt(w.end)}`;
});

function onClaim() {
  if (!props.locked) emit('claim', props.coupon);
}
</script>

<template>
  <div class="relative">
    <div class="rounded-2xl overflow-hidden shadow-soft" :class="locked ? 'opacity-90' : ''">
      <div class="relative flex bg-gradient-to-r" :class="[colors.from, colors.to, colors.text]">
        <div class="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 px-2 text-center border-l border-dashed border-white/40">
          <div class="text-[10px] uppercase tracking-widest opacity-90 font-bold leading-tight">{{ offerTypeLabel.split(' ')[0] }}</div>
          <div v-if="coupon.offerType === 'BOGO'" class="text-3xl font-extrabold leading-none mt-1">1+1</div>
          <div v-else-if="coupon.offerType === 'PERCENT_OFF'" class="text-3xl font-extrabold leading-none mt-1">-{{ coupon.discountValue || 0 }}%</div>
          <div v-else-if="coupon.offerType === 'FLAT_OFF'" class="text-2xl font-extrabold leading-none mt-1">-${{ coupon.discountValue || 0 }}</div>
          <div v-else-if="coupon.offerType === 'FREE_ITEM'" class="text-xl font-extrabold leading-none mt-1">FREE</div>
          <div v-else class="text-sm font-extrabold leading-none mt-1">DEAL</div>
          <div class="text-[9px] uppercase tracking-wide opacity-80 mt-1">{{ offerTypeLabel.split(' ').slice(1).join(' ') || 'Offer' }}</div>
        </div>

        <div class="absolute top-1/2 -translate-y-1/2 left-[78px] -translate-x-1/2 w-4 h-4 rounded-full bg-cream-100"></div>
        <div class="absolute top-1/2 -translate-y-1/2 left-[78px] translate-x-1/2 w-4 h-4 rounded-full bg-cream-100" style="left: calc(100% - 78px);"></div>

        <div class="flex-1 p-4 pl-6">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="text-[10px] uppercase tracking-wider font-bold opacity-80">{{ variantLabel }}</div>
              <div class="font-bold text-base leading-tight mt-0.5">{{ coupon.title }}</div>
              <div class="text-xs opacity-80 mt-0.5 line-clamp-1">{{ coupon.subtitle }}</div>
            </div>
            <div v-if="locked" class="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-lock text-xs"></i>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <div v-if="windowText" class="text-[10px] font-semibold opacity-85 flex items-center gap-1">
              <i class="fa-regular fa-clock text-[10px]"></i>
              <span>{{ windowText }}</span>
            </div>
            <button
              v-if="!locked"
              @click="onClaim"
              class="bg-white rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap active:scale-95 transition"
              :class="[colors.text === 'text-white' ? 'text-ink-900' : 'text-ink-900']"
            >Claim →</button>
            <button v-else class="bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-[10px] font-bold whitespace-nowrap">
              Subscribe to unlock
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute top-1/2 -translate-y-1/2 left-[72px] flex flex-col gap-0.5">
      <div v-for="i in 14" :key="i" class="w-px h-1 bg-white/30"></div>
    </div>
  </div>
</template>
