<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const items = ref([]);
const merchants = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref(null);

function blankForm() {
  return {
    title: '', subtitle: '', description: '',
    heroImageUrl: '', offerType: 'BOGO', discountValue: 0,
    maxUsesPerCustomer: 1, categorySlug: 'dining',
    merchantIds: [],
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    featured: false,
    todaysOffer: false,
    popupOffer: false,
    activeWindow: { days: ['daily'], start: '14:00', end: '17:00' },
  };
}
const form = ref(blankForm());

const DAYS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' }, { key: 'sun', label: 'Sun' },
];

function can(p) { return (auth.user?.permissions || []).includes(p); }

async function load() {
  loading.value = true;
  try {
    const [c, m] = await Promise.all([
      client.get('/vendor/coupons'),
      client.get('/vendor/merchants'),
    ]);
    items.value = c.data.items;
    merchants.value = m.data.items;
  } finally { loading.value = false; }
}

function openNew() { editing.value = null; form.value = blankForm(); showForm.value = true; }

function openEdit(c) {
  editing.value = c;
  form.value = {
    title: c.title || '', subtitle: c.subtitle || '', description: c.description || '',
    heroImageUrl: c.heroImageUrl || '',
    offerType: c.offerType || 'BOGO', discountValue: c.discountValue || 0,
    maxUsesPerCustomer: c.maxUsesPerCustomer || 1,
    categorySlug: c.categorySlug || 'dining',
    merchantIds: (c.merchantIds || []).map((x) => typeof x === 'object' ? x._id : x),
    validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
    validUntil: c.validUntil ? new Date(c.validUntil).toISOString().slice(0,10) : new Date(Date.now()+90*24*60*60*1000).toISOString().slice(0,10),
    featured: !!c.featured,
    todaysOffer: !!c.todaysOffer,
    popupOffer: !!c.popupOffer,
    activeWindow: c.activeWindow || { days: ['daily'], start: '14:00', end: '17:00' },
  };
  showForm.value = true;
}

async function save() {
  const payload = { ...form.value, offerKind: 'member_perk', priceUSD: 0 };
  if (editing.value) await client.put(`/vendor/coupons/${editing.value._id}`, payload);
  else await client.post('/vendor/coupons', payload);
  showForm.value = false;
  await load();
}

async function del(id) {
  if (!confirm('Delete this coupon?')) return;
  await client.delete(`/vendor/coupons/${id}`);
  await load();
}

function toggleDay(d) {
  const days = form.value.activeWindow.days || [];
  if (d === 'daily') { form.value.activeWindow.days = ['daily']; return; }
  let next = days.filter((x) => x !== 'daily');
  if (next.includes(d)) next = next.filter((x) => x !== d);
  else next.push(d);
  if (next.length === 0) next = ['daily'];
  form.value.activeWindow.days = next;
}

function offerTypeLabel(t) {
  return { BOGO: 'Buy 1 Get 1', PERCENT_OFF: '% Off', FLAT_OFF: '$ Off', FREE_ITEM: 'Free Item', BUNDLE: 'Bundle' }[t] || t;
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Coupons</h1>
        <p class="text-ink-500 mt-1">Offers customers can claim during your happy hour</p>
      </div>
      <button v-if="can('manage_coupons')" @click="openNew" class="ios-button-primary"><i class="fa-solid fa-plus mr-2"></i>New coupon</button>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-44 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-center py-12 text-ink-500">
      <i class="fa-solid fa-ticket text-4xl text-ink-300"></i>
      <div class="mt-3">No coupons yet.</div>
    </div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="c in items" :key="c._id" class="ios-card overflow-hidden">
        <div class="relative">
          <img :src="c.heroImageUrl" class="w-full h-32 object-cover" />
          <div class="absolute top-2 left-2 flex gap-1 flex-wrap">
            <span v-if="c.todaysOffer" class="chip bg-coral-500 text-white text-[10px]"><i class="fa-solid fa-fire text-[9px]"></i> Today</span>
            <span v-if="c.popupOffer" class="chip bg-purple-500 text-white text-[10px]"><i class="fa-solid fa-bolt text-[9px]"></i> Pop-up</span>
            <span v-if="c.featured" class="chip bg-yellow-400 text-yellow-900 text-[10px]"><i class="fa-solid fa-star text-[9px]"></i> Featured</span>
          </div>
        </div>
        <div class="p-4">
          <div class="font-bold truncate">{{ c.title }}</div>
          <div class="text-xs text-ink-500 truncate mt-0.5">{{ c.subtitle }}</div>
          <div class="mt-2 flex gap-1.5">
            <span class="chip bg-teal-50 text-teal-700 text-[10px]">{{ offerTypeLabel(c.offerType) }}</span>
            <span v-if="c.activeWindow?.start" class="chip bg-cream-200 text-ink-700 text-[10px]">
              <i class="fa-regular fa-clock text-[9px]"></i>
              {{ c.activeWindow.start }}–{{ c.activeWindow.end }}
            </span>
          </div>
          <div v-if="can('manage_coupons')" class="flex gap-3 mt-3 pt-3 border-t border-cream-200">
            <button @click="openEdit(c)" class="text-sm font-semibold text-teal-700"><i class="fa-solid fa-pen-to-square mr-1"></i>Edit</button>
            <button @click="del(c._id)" class="text-sm font-semibold text-coral-600"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xl font-bold">{{ editing ? 'Edit coupon' : 'New coupon' }}</div>
          <button @click="showForm = false" class="text-ink-500">Cancel</button>
        </div>

        <form @submit.prevent="save" class="space-y-3">
          <input v-model="form.title" class="input" placeholder="Title (e.g. Buy 1 Pizza, Get 1 Free)" required />
          <input v-model="form.subtitle" class="input" placeholder="Short subtitle" />
          <textarea v-model="form.description" class="input" rows="2" placeholder="Description / terms"></textarea>
          <input v-model="form.heroImageUrl" class="input" placeholder="Hero image URL (Unsplash etc)" />

          <div>
            <div class="text-xs uppercase font-semibold text-ink-500 mb-1.5">Offer type</div>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" v-for="t in ['BOGO','PERCENT_OFF','FREE_ITEM','FLAT_OFF','BUNDLE']" :key="t" @click="form.offerType = t" class="rounded-2xl py-2.5 border-2 text-xs font-bold transition active:scale-95" :class="form.offerType === t ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20 text-ink-700'">
                {{ offerTypeLabel(t) }}
              </button>
            </div>
          </div>

          <input v-if="['PERCENT_OFF','FLAT_OFF'].includes(form.offerType)" v-model.number="form.discountValue" type="number" min="0" class="input" :placeholder="form.offerType === 'PERCENT_OFF' ? 'Discount %' : 'Discount $'" />

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">Highlights</div>
          <div class="space-y-2">
            <label class="flex items-center gap-3 p-3 rounded-2xl bg-coral-500/5 cursor-pointer">
              <input type="checkbox" v-model="form.todaysOffer" class="w-5 h-5" />
              <div>
                <div class="font-semibold flex items-center gap-1.5"><i class="fa-solid fa-fire text-coral-500"></i> Today's Offer</div>
                <div class="text-xs text-ink-500">Highlight as a daily offer (top of merchant page)</div>
              </div>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-2xl bg-purple-500/5 cursor-pointer">
              <input type="checkbox" v-model="form.popupOffer" class="w-5 h-5" />
              <div>
                <div class="font-semibold flex items-center gap-1.5"><i class="fa-solid fa-bolt text-purple-500"></i> Pop-up Offer</div>
                <div class="text-xs text-ink-500">Limited-time special with extra emphasis</div>
              </div>
            </label>
            <label class="flex items-center gap-3 p-3 rounded-2xl bg-yellow-400/10 cursor-pointer">
              <input type="checkbox" v-model="form.featured" class="w-5 h-5" />
              <div>
                <div class="font-semibold flex items-center gap-1.5"><i class="fa-solid fa-star text-yellow-500"></i> Featured</div>
                <div class="text-xs text-ink-500">Show in homepage trending section</div>
              </div>
            </label>
          </div>

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">
            <i class="fa-regular fa-clock"></i> Active window
          </div>
          <p class="text-xs text-ink-500">Customers can only claim during these hours. Set this to your slow times to drive traffic.</p>

          <div class="flex gap-1 flex-wrap">
            <button type="button" @click="toggleDay('daily')" class="chip transition" :class="(form.activeWindow.days || []).includes('daily') ? 'bg-teal-600 text-white' : 'bg-cream-200 text-ink-700'">Daily</button>
            <button type="button" v-for="d in DAYS" :key="d.key" @click="toggleDay(d.key)" class="chip transition" :class="(form.activeWindow.days || []).includes(d.key) ? 'bg-teal-600 text-white' : 'bg-cream-200 text-ink-700'">
              {{ d.label }}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <div class="text-[10px] uppercase text-ink-500 mb-1">Start</div>
              <input v-model="form.activeWindow.start" type="time" class="input" />
            </div>
            <div>
              <div class="text-[10px] uppercase text-ink-500 mb-1">End</div>
              <input v-model="form.activeWindow.end" type="time" class="input" />
            </div>
          </div>

          <div class="text-xs uppercase font-semibold text-ink-500 pt-2 border-t border-cream-200">Locations</div>
          <p class="text-xs text-ink-500">Leave empty to allow all your locations.</p>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <label v-for="m in merchants" :key="m._id" class="flex items-center gap-2 p-2 rounded-xl hover:bg-cream-100 cursor-pointer">
              <input type="checkbox" :value="m._id" v-model="form.merchantIds" />
              <span class="text-sm">{{ m.name }}</span>
            </label>
          </div>

          <button type="submit" class="ios-button-primary w-full mt-2">{{ editing ? 'Save changes' : 'Create coupon' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>
