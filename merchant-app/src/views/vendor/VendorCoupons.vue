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
    disabledOnHolidays: true,
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
    disabledOnHolidays: c.disabledOnHolidays !== false,
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

const selected = ref([]);
const selectMode = ref(false);
function toggleSelect(id) {
  const i = selected.value.indexOf(id);
  if (i >= 0) selected.value.splice(i, 1);
  else selected.value.push(id);
}
function clearSelection() { selected.value = []; selectMode.value = false; }

async function bulk(action) {
  if (!selected.value.length) return;
  const map = { pause: 'Pause', activate: 'Activate', delete: 'Delete', feature_on: 'Mark featured', feature_off: 'Unmark featured' };
  if (!confirm(`${map[action] || action} ${selected.value.length} coupon(s)?`)) return;
  await client.post('/vendor/coupons/bulk', { ids: selected.value, action });
  clearSelection();
  await load();
}

const showPerformance = ref(null);
const performance = ref(null);
async function openPerformance(c) {
  showPerformance.value = c;
  performance.value = null;
  const { data } = await client.get(`/vendor/coupons/${c._id}/performance`);
  performance.value = data;
}

function downloadCsv() {
  const url = `${import.meta.env.VITE_API_BASE || '/api/v1'}/vendor/export/redemptions.csv`;
  const token = localStorage.getItem('hh_m_access_token');
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `redemptions-${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
    });
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
      <div class="flex gap-2 flex-wrap">
        <button v-if="can('view_payments')" @click="downloadCsv" class="ios-card px-4 py-2.5 text-sm font-semibold text-teal-700">
          <i class="fa-solid fa-file-csv mr-1"></i>Export CSV
        </button>
        <button v-if="can('manage_coupons')" @click="selectMode = !selectMode; clearSelection()" class="ios-card px-4 py-2.5 text-sm font-semibold" :class="selectMode ? 'text-coral-600' : 'text-ink-700'">
          <i class="fa-solid mr-1" :class="selectMode ? 'fa-xmark' : 'fa-check-double'"></i>{{ selectMode ? 'Cancel' : 'Select' }}
        </button>
        <button v-if="can('manage_coupons')" @click="openNew" class="ios-button-primary"><i class="fa-solid fa-plus mr-2"></i>New coupon</button>
      </div>
    </div>

    <div v-if="selectMode && selected.length" class="mt-4 ios-card p-3 flex items-center gap-2 flex-wrap bg-teal-50">
      <div class="font-bold text-teal-700 mr-2"><i class="fa-solid fa-check-double mr-1"></i>{{ selected.length }} selected</div>
      <button @click="bulk('activate')" class="ios-card px-3 py-1.5 text-xs font-semibold text-green-700 bg-white"><i class="fa-solid fa-play mr-1"></i>Activate</button>
      <button @click="bulk('pause')" class="ios-card px-3 py-1.5 text-xs font-semibold text-amber-700 bg-white"><i class="fa-solid fa-pause mr-1"></i>Pause</button>
      <button @click="bulk('feature_on')" class="ios-card px-3 py-1.5 text-xs font-semibold text-yellow-700 bg-white"><i class="fa-solid fa-star mr-1"></i>Feature</button>
      <button @click="bulk('feature_off')" class="ios-card px-3 py-1.5 text-xs font-semibold text-ink-700 bg-white"><i class="fa-regular fa-star mr-1"></i>Unfeature</button>
      <button @click="bulk('delete')" class="ios-card px-3 py-1.5 text-xs font-semibold text-coral-700 bg-white"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
    </div>

    <div v-if="loading" class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-44 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-6 text-center py-12 text-ink-500">
      <i class="fa-solid fa-ticket text-4xl text-ink-300"></i>
      <div class="mt-3">No coupons yet.</div>
    </div>
    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="c in items" :key="c._id" class="ios-card overflow-hidden relative" :class="selectMode && selected.includes(c._id) ? 'ring-4 ring-teal-500' : ''">
        <button v-if="selectMode" @click="toggleSelect(c._id)" class="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center" :class="selected.includes(c._id) ? 'bg-teal-600 text-white' : 'bg-white text-ink-500 border border-ink-300/30'">
          <i class="fa-solid" :class="selected.includes(c._id) ? 'fa-check' : 'fa-square'"></i>
        </button>
        <div class="relative">
          <img :src="c.heroImageUrl" class="w-full h-32 object-cover" />
          <div class="absolute top-2 left-2 flex gap-1 flex-wrap">
            <span v-if="c.status === 'paused'" class="chip bg-ink-700 text-white text-[10px]"><i class="fa-solid fa-pause text-[9px]"></i> Paused</span>
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
          <div class="flex gap-3 mt-3 pt-3 border-t border-cream-200">
            <button v-if="can('view_stats')" @click="openPerformance(c)" class="text-sm font-semibold text-purple-700"><i class="fa-solid fa-chart-line mr-1"></i>Performance</button>
            <button v-if="can('manage_coupons')" @click="openEdit(c)" class="text-sm font-semibold text-teal-700"><i class="fa-solid fa-pen-to-square mr-1"></i>Edit</button>
            <button v-if="can('manage_coupons')" @click="del(c._id)" class="text-sm font-semibold text-coral-600"><i class="fa-solid fa-trash mr-1"></i>Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPerformance" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6" @click="showPerformance = null">
      <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[90vh]" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-xs uppercase tracking-wider text-ink-500 font-bold">Performance by location</div>
            <div class="text-xl font-bold mt-0.5">{{ showPerformance.title }}</div>
          </div>
          <button @click="showPerformance = null" class="text-ink-500">Close</button>
        </div>
        <div v-if="!performance" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 bg-cream-200 rounded-2xl animate-pulse"></div>
        </div>
        <div v-else-if="performance.breakdown.length === 0" class="text-center py-10 text-ink-500">
          <i class="fa-solid fa-chart-line text-3xl text-ink-300 mb-2"></i>
          <div>No redemptions yet at any location.</div>
        </div>
        <div v-else class="space-y-2">
          <div v-for="(b, idx) in performance.breakdown" :key="b.merchantId" class="ios-card p-4 flex items-center gap-3" :class="b.count === 0 ? 'opacity-60' : ''">
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" :class="idx === 0 && b.count > 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-cream-200 text-ink-700'">{{ idx + 1 }}</div>
            <img :src="b.merchant.coverImageUrl || b.merchant.logoUrl" class="w-11 h-11 rounded-xl object-cover bg-cream-200 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate">{{ b.merchant.name }}</div>
              <div class="text-xs text-ink-500 truncate">{{ b.merchant.address?.city }}</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-bold text-teal-700">{{ b.count }}</div>
              <div class="text-[10px] text-ink-300">redemption{{ b.count !== 1 ? 's' : '' }}</div>
            </div>
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
            <i class="fa-solid fa-calendar-xmark"></i> Holidays
          </div>
          <label class="flex items-center gap-3 p-3 rounded-2xl bg-cream-100 cursor-pointer">
            <input type="checkbox" v-model="form.disabledOnHolidays" class="w-5 h-5" />
            <div>
              <div class="font-semibold">Disable on holidays</div>
              <div class="text-xs text-ink-500">Pause this coupon on US federal holidays + each location's custom holidays. Uncheck to keep it active during holidays (e.g. when you WANT a holiday promo).</div>
            </div>
          </label>

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
