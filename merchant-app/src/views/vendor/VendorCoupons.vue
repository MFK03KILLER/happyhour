<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { useFlagsStore } from '../../stores/flags';

const auth = useAuthStore();
const flags = useFlagsStore();
const items = ref([]);
const merchants = ref([]);
const loading = ref(true);
const showForm = ref(false);
const form = ref({
  offerKind: 'member_perk',
  title: '', subtitle: '', description: '',
  heroImageUrl: '', offerType: 'BUNDLE', priceUSD: 0,
  maxUsesPerCustomer: 1, categorySlug: 'restaurants',
  merchantIds: [],
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  originalValueUSD: null,
  inventoryCount: null,
  pickupWindowStart: '',
  pickupWindowEnd: '',
  deliveryAvailable: false,
  deliveryFeeUSD: 0,
  requiredPlanTier: 'lite',
});

const isSurpriseBag = computed(() => form.value.offerKind === 'surprise_bag');

function can(p) { return (auth.user?.permissions || []).includes(p); }

async function load() {
  loading.value = true;
  try {
    await flags.load();
    const [c, m] = await Promise.all([
      client.get('/vendor/coupons'),
      client.get('/vendor/merchants'),
    ]);
    items.value = c.data.items;
    merchants.value = m.data.items;
  } finally { loading.value = false; }
}

async function save() {
  const payload = { ...form.value };
  if (payload.offerKind === 'surprise_bag') {
    payload.validFrom = payload.pickupWindowStart;
    payload.validUntil = payload.pickupWindowEnd;
    payload.maxUsesPerCustomer = 1;
    payload.offerType = 'BUNDLE';
  }
  await client.post('/vendor/coupons', payload);
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('Delete this coupon?')) return;
  await client.delete(`/vendor/coupons/${id}`);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Coupons</h1>
        <p class="text-ink-500 mt-1">Offers customers can claim</p>
      </div>
      <button v-if="can('manage_coupons')" @click="showForm = true" class="ios-button-primary">+ New coupon</button>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-44 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-ink-500">No coupons yet.</div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="c in items" :key="c._id" class="ios-card overflow-hidden">
        <img v-if="c.heroImageUrl" :src="c.heroImageUrl" class="w-full h-32 object-cover" />
        <div class="p-4">
          <div class="font-bold truncate">{{ c.title }}</div>
          <div class="text-sm text-ink-500 truncate">{{ c.subtitle }}</div>
          <div class="flex items-center justify-between mt-3">
            <span class="text-sm font-semibold text-teal-700">{{ c.maxUsesPerCustomer }}× use</span>
            <button v-if="can('manage_coupons')" @click="del(c._id)" class="text-sm text-coral-600 font-semibold">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">New coupon</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>
        <form @submit.prevent="save" class="space-y-3">
          <div v-if="flags.isOn('surprise_bag')" class="grid grid-cols-2 gap-2">
            <button type="button" @click="form.offerKind = 'member_perk'"
              class="rounded-2xl p-3 border-2 transition active:scale-95 text-left"
              :class="form.offerKind === 'member_perk' ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'">
              <div class="font-bold text-sm">Member Perk</div>
              <div class="text-[10px] text-ink-500">BOGO / % off · Subscriber-only</div>
            </button>
            <button type="button" @click="form.offerKind = 'surprise_bag'"
              class="rounded-2xl p-3 border-2 transition active:scale-95 text-left"
              :class="form.offerKind === 'surprise_bag' ? 'border-coral-500 bg-coral-500/10' : 'border-ink-300/20 bg-white'">
              <div class="font-bold text-sm">🔥 Surprise Bag</div>
              <div class="text-[10px] text-ink-500">Limited stock · Pay per item</div>
            </button>
          </div>

          <input v-model="form.title" class="input" placeholder="Title (e.g. Morning Slices)" required />
          <input v-model="form.subtitle" class="input" placeholder="Short subtitle" />
          <textarea v-model="form.description" class="input" rows="3" placeholder="Description"></textarea>
          <input v-model="form.heroImageUrl" class="input" placeholder="Hero image URL (Unsplash etc.)" />
          <div class="grid grid-cols-2 gap-2">
            <select v-model="form.offerType" class="input">
              <option value="BUNDLE">Bundle</option>
              <option value="BOGO">BOGO</option>
              <option value="PERCENT_OFF">% off</option>
              <option value="FLAT_OFF">Flat $ off</option>
              <option value="FREE_ITEM">Free item</option>
            </select>
            <select v-model="form.categorySlug" class="input">
              <option value="restaurants">Restaurants</option>
              <option value="cafes">Cafés</option>
              <option value="bars">Bars</option>
              <option value="entertainment">Entertainment</option>
              <option value="fitness">Fitness</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model.number="form.priceUSD" type="number" min="0" step="0.5" class="input" :placeholder="isSurpriseBag ? 'Sale price USD' : 'Price USD (0 = free)'" />
            <input v-if="!isSurpriseBag" v-model.number="form.maxUsesPerCustomer" type="number" min="1" class="input" placeholder="Max uses per customer" />
            <input v-else v-model.number="form.originalValueUSD" type="number" min="0" step="0.5" class="input" placeholder="Original value USD" />
          </div>

          <template v-if="isSurpriseBag">
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider pt-2">Inventory & pickup</div>
            <input v-model.number="form.inventoryCount" type="number" min="1" class="input" placeholder="How many bags available" required />
            <div class="grid grid-cols-2 gap-2">
              <input v-model="form.pickupWindowStart" type="datetime-local" class="input" placeholder="Pickup start" required />
              <input v-model="form.pickupWindowEnd" type="datetime-local" class="input" placeholder="Pickup end" required />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="form.deliveryAvailable" />
              Offer delivery
            </label>
            <input v-if="form.deliveryAvailable" v-model.number="form.deliveryFeeUSD" type="number" min="0" step="0.5" class="input" placeholder="Delivery fee USD" />
          </template>

          <template v-else>
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider pt-2">Validity</div>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="form.validFrom" type="date" class="input" />
              <input v-model="form.validUntil" type="date" class="input" />
            </div>
          </template>
          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 tracking-wider mb-2">Valid at locations (leave empty = all)</div>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <label v-for="m in merchants" :key="m._id" class="flex items-center gap-2 text-sm">
                <input type="checkbox" :value="m._id" v-model="form.merchantIds" />
                {{ m.name }}
              </label>
            </div>
          </div>
          <button type="submit" class="ios-button-primary w-full">Create coupon</button>
        </form>
      </div>
    </div>
  </div>
</template>
