<script setup>
const props = defineProps({
  coupon: { type: Object, required: true },
});
const emit = defineEmits(['click']);
function vendorName() {
  const v = props.coupon.vendorId;
  if (!v) return '';
  return typeof v === 'object' ? v.name : '';
}
function merchantCity() {
  const ms = props.coupon.merchantIds || [];
  const first = ms.find((m) => m && m.address && m.address.city);
  return first ? first.address.city : '';
}
</script>

<template>
  <button
    @click="emit('click', coupon)"
    class="block w-full text-left active:scale-[.985] transition-transform"
  >
    <div class="ios-card overflow-hidden">
      <div class="relative aspect-[16/10] bg-cream-200">
        <img
          v-if="coupon.heroImageUrl"
          :src="coupon.heroImageUrl"
          :alt="coupon.title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
        <div class="absolute top-3 left-3">
          <span class="chip bg-white/95 text-teal-700">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            {{ coupon.maxUsesPerCustomer }}× use
          </span>
        </div>
        <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div class="text-white drop-shadow">
            <div class="text-[11px] uppercase tracking-wider font-semibold opacity-90">{{ vendorName() }}</div>
            <div class="text-lg font-bold leading-tight">{{ coupon.title }}</div>
          </div>
        </div>
      </div>
      <div class="p-4 flex items-center justify-between">
        <div>
          <div class="text-sm text-ink-500">{{ coupon.subtitle }}</div>
          <div class="text-xs text-ink-300 mt-0.5" v-if="merchantCity()">{{ merchantCity() }}</div>
        </div>
        <div class="text-right">
          <div v-if="coupon.priceUSD > 0" class="text-sm text-ink-300">From</div>
          <div class="text-lg font-bold text-teal-700">
            {{ coupon.priceUSD > 0 ? `$${coupon.priceUSD.toFixed(2)}` : 'Free' }}
          </div>
        </div>
      </div>
    </div>
  </button>
</template>
