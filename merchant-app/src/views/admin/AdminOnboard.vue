<script setup>
// Onboard a restaurant in a few taps: find it, add its locations, pick happy
// hour + offers from presets, create logins, send the contract. One "Create"
// makes everything. A franchise is one restaurant with many locations: the
// shared details are entered once, each location only needs its address.
import { computed, onMounted, reactive, ref, watch } from 'vue';
import client from '../../api/client';
import { notify } from '../../lib/notify';
import { TIER_OPTIONS } from '../../lib/plans';

const step = ref(1);
const STEPS = ['Restaurant', 'Locations', 'Happy hour & offers', 'Logins & contract', 'Review'];

const vendors = ref([]);
const contracts = ref([]);
onMounted(async () => {
  const [v, c] = await Promise.all([
    client.get('/admin/vendors').catch(() => ({ data: { items: [] } })),
    client.get('/admin/contracts/templates').catch(() => ({ data: { items: [] } })),
  ]);
  vendors.value = v.data.items || [];
  contracts.value = c.data.items || [];
  if (contracts.value[0]) form.contractId = contracts.value[0]._id;
  else form.sendContract = false;
});

const CATEGORIES = [
  { value: 'dining', label: 'Restaurant', icon: 'fa-utensils' },
  { value: 'cafe', label: 'Cafe', icon: 'fa-mug-hot' },
  { value: 'bar', label: 'Bar', icon: 'fa-martini-glass' },
  { value: 'activities', label: 'Activities', icon: 'fa-bowling-ball' },
  { value: 'wellness', label: 'Wellness', icon: 'fa-spa' },
];
const CUISINES = ['Pizza', 'Burgers', 'Mexican', 'Sushi', 'Thai', 'Chinese', 'Indian', 'Italian', 'BBQ', 'Seafood', 'Steakhouse', 'Vegan', 'Coffee', 'Bakery', 'Cocktails', 'Brewery', 'Wine bar'];
const HOURS = [
  { label: 'Weekdays 2–5 PM', days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '14:00', end: '17:00' },
  { label: 'Weekdays 3–6 PM', days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '15:00', end: '18:00' },
  { label: 'Weekdays 4–7 PM', days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '16:00', end: '19:00' },
  { label: 'Every day 3–6 PM', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], start: '15:00', end: '18:00' },
];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const OFFER_PRESETS = [
  { title: 'Buy 1, Get 1 Free', subtitle: 'On any entrée', offerType: 'BOGO', priceUSD: 15 },
  { title: '20% Off Your Bill', subtitle: 'Food and drinks', offerType: 'PERCENT_OFF', priceUSD: 10 },
  { title: 'Free Drink With Any Entrée', subtitle: 'Soft drink, beer or house wine', offerType: 'FREE_ITEM', priceUSD: 6 },
  { title: 'Free Appetizer', subtitle: 'With two entrées', offerType: 'FREE_ITEM', priceUSD: 10 },
  { title: '$5 Off $25', subtitle: 'Dine-in or takeout', offerType: 'FLAT_OFF', priceUSD: 5 },
  { title: 'Half-Price Cocktails', subtitle: 'House cocktails', offerType: 'PERCENT_OFF', priceUSD: 7 },
];

const form = reactive({
  mode: 'new',                 // new | existing
  existingVendorId: '',
  name: '', category: 'dining', cuisineTags: [], phone: '', website: '', email: '', description: '', priceLevel: 2,
  locations: [],
  hoursPreset: 0, days: [...HOURS[0].days], start: HOURS[0].start, end: HOURS[0].end,
  offers: [{ ...OFFER_PRESETS[0], requiredPlanTier: 'basic' }],
  ownerName: '', ownerEmail: '', createOwner: true, staffPerLocation: true, canPauseHappyHour: false,
  sendContract: true, contractId: '',
});

// ---------- place search (debounced) ----------
function usePlaceSearch() {
  const q = ref('');
  const results = ref([]);
  const searching = ref(false);
  let timer = null;
  watch(q, (val) => {
    clearTimeout(timer);
    if (val.trim().length < 3) { results.value = []; return; }
    timer = setTimeout(async () => {
      searching.value = true;
      try { results.value = (await client.get('/admin/onboarding/places', { params: { q: val } })).data.items; } catch { results.value = []; } finally { searching.value = false; }
    }, 350);
  });
  return { q, results, searching };
}
const brandSearch = usePlaceSearch();
const addrSearch = usePlaceSearch();

function pickBusiness(p) {
  if (p.name && !form.name) form.name = p.name;
  if (p.name) form.name = p.name;
  if (p.kind === 'cafe') form.category = 'cafe';
  if (['bar', 'pub', 'biergarten'].includes(p.kind)) form.category = 'bar';
  if (/pizza/i.test(p.name) && !form.cuisineTags.includes('Pizza')) form.cuisineTags.push('Pizza');
  addLocation(p);
  brandSearch.q.value = '';
  brandSearch.results.value = [];
}
function addLocation(p) {
  const dup = form.locations.some((l) => l.street === p.street && l.city === p.city);
  if (dup) { notify('That location is already in the list.'); return; }
  form.locations.push({ street: p.street, city: p.city, state: p.state || 'CA', zip: p.zip || '', lat: p.lat, lng: p.lng, phone: '' });
  addrSearch.q.value = '';
  addrSearch.results.value = [];
}
function addManual() { form.locations.push({ street: '', city: '', state: 'CA', zip: '', phone: '' }); }

// Paste several addresses at once (one per line) - handy for franchises.
const bulkText = ref('');
const bulkBusy = ref(false);
async function addBulk() {
  const lines = bulkText.value.split('\n').map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return;
  bulkBusy.value = true;
  let found = 0;
  for (const line of lines) {
    try {
      const r = (await client.get('/admin/onboarding/places', { params: { q: line } })).data.items[0];
      if (r) { addLocation(r); found++; } else {
        const [street, city = '', rest = ''] = line.split(',').map((s) => s.trim());
        form.locations.push({ street, city, state: (rest.split(' ')[0] || 'CA').toUpperCase(), zip: rest.split(' ')[1] || '', phone: '' });
      }
    } catch { /* keep going */ }
  }
  bulkBusy.value = false;
  bulkText.value = '';
  notify(`${lines.length} address${lines.length === 1 ? '' : 'es'} added${found < lines.length ? ` (${lines.length - found} typed by hand — check them)` : ''}.`, 'success');
}

function pickHours(i) {
  form.hoursPreset = i;
  form.days = [...HOURS[i].days];
  form.start = HOURS[i].start;
  form.end = HOURS[i].end;
}
function toggleDay(d) {
  form.hoursPreset = -1;
  form.days = form.days.includes(d) ? form.days.filter((x) => x !== d) : DAYS.filter((x) => form.days.includes(x) || x === d);
}
function toggleOffer(p) {
  const i = form.offers.findIndex((o) => o.title === p.title);
  if (i >= 0) form.offers.splice(i, 1);
  else form.offers.push({ ...p, requiredPlanTier: 'basic' });
}
function toggleCuisine(c) {
  const i = form.cuisineTags.indexOf(c);
  if (i >= 0) form.cuisineTags.splice(i, 1); else if (form.cuisineTags.length < 5) form.cuisineTags.push(c);
}

const existingVendor = computed(() => vendors.value.find((v) => v._id === form.existingVendorId));
watch(() => form.existingVendorId, () => {
  const v = existingVendor.value;
  if (v) { form.name = v.name; form.createOwner = false; form.sendContract = false; }
});
watch(() => form.email, (e) => { if (e && !form.ownerEmail) form.ownerEmail = e; });

const errors = computed(() => {
  if (step.value === 1) {
    if (form.mode === 'existing' && !form.existingVendorId) return 'Choose the restaurant';
    if (form.name.trim().length < 2) return 'Enter the restaurant name';
  }
  if (step.value === 2) {
    if (!form.locations.length) return 'Add at least one location';
    const bad = form.locations.find((l) => !l.street.trim() || !l.city.trim());
    if (bad) return 'Every location needs a street and city';
  }
  if (step.value === 3 && !form.days.length) return 'Pick at least one happy-hour day';
  if (step.value === 4 && form.createOwner && (!form.ownerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail))) return 'Enter the owner name and email (or turn off the owner login)';
  return '';
});
function next() { if (!errors.value) step.value = Math.min(5, step.value + 1); else notify(errors.value); }

const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'PM' : 'AM'}`; };
const hoursLabel = computed(() => `${form.days.length === 7 ? 'Every day' : form.days.length === 5 && !form.days.includes('sat') && !form.days.includes('sun') ? 'Weekdays' : form.days.map((d) => d[0].toUpperCase() + d.slice(1)).join(', ')} · ${fmtTime(form.start)}–${fmtTime(form.end)}`);

const creating = ref(false);
const result = ref(null);
async function create() {
  creating.value = true;
  try {
    const body = {
      ...(form.mode === 'existing' ? { existingVendorId: form.existingVendorId } : {}),
      restaurant: {
        name: form.name.trim(), category: form.category, cuisineTags: form.cuisineTags, phone: form.phone || undefined,
        website: form.website || undefined, email: form.email || '', description: form.description || undefined, priceLevel: form.priceLevel,
      },
      locations: form.locations.map((l) => ({ ...l, zip: l.zip || undefined, phone: l.phone || undefined })),
      happyHour: { days: form.days, start: form.start, end: form.end },
      offers: form.offers.map((o) => ({ ...o, priceUSD: Number(o.priceUSD) || 0 })),
      ...(form.createOwner ? { owner: { fullName: form.ownerName.trim(), email: form.ownerEmail.trim() } } : {}),
      staffPerLocation: form.staffPerLocation,
      canPauseHappyHour: form.canPauseHappyHour,
      ...(form.sendContract && form.contractId ? { contract: { contractId: form.contractId, sendEmail: true } } : {}),
    };
    result.value = (await client.post('/admin/onboarding', body)).data;
    window.scrollTo({ top: 0 });
  } finally { creating.value = false; }
}

const summaryText = computed(() => {
  const r = result.value;
  if (!r) return '';
  const lines = [`Welcome to Happy Hour, ${r.vendor.name}!`, '', 'Your logins (Happy Hour Merchant app or happyhourz.org/merchant):'];
  for (const l of r.logins) lines.push(`• ${l.role}: ${l.email} / ${l.password}`);
  lines.push('', 'Please change your password after signing in (Account → Change password).');
  if (r.contract) lines.push('', `Please sign your agreement: ${r.contract.link}`);
  return lines.join('\n');
});
async function copySummary() {
  try { await navigator.clipboard.writeText(summaryText.value); notify('Copied. Paste it into a text or email to the owner.', 'success'); } catch { window.prompt('Copy:', summaryText.value); }
}
async function shareSummary() {
  if (navigator.share) { try { await navigator.share({ title: 'Happy Hour logins', text: summaryText.value }); return; } catch { /* closed */ } }
  copySummary();
}
function startOver() { window.location.reload(); }
</script>

<template>
  <div class="p-5 md:p-8 max-w-3xl">
    <!-- Done -->
    <template v-if="result">
      <div class="ios-card p-6 border-2 border-green-300">
        <div class="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><i class="fa-solid fa-check text-2xl"></i></div>
        <h1 class="mt-4 text-2xl font-bold">{{ result.vendor.name }} is live</h1>
        <p class="text-ink-500 mt-1">{{ result.locations.length }} location{{ result.locations.length === 1 ? '' : 's' }} · {{ result.offers.length }} offer{{ result.offers.length === 1 ? '' : 's' }} · {{ result.logins.length }} login{{ result.logins.length === 1 ? '' : 's' }}</p>
        <div v-if="result.locations.some((l) => !l.mapped)" class="mt-3 text-sm text-amber-700 bg-amber-50 rounded-2xl px-4 py-2">Some addresses couldn't be found on the map. Fix them in Merchants so they show on the map.</div>

        <div v-if="result.logins.length" class="mt-5">
          <div class="text-xs uppercase tracking-wider font-semibold text-ink-500">Logins — send these to the owner</div>
          <div class="mt-2 rounded-2xl bg-cream-100 divide-y divide-cream-200">
            <div v-for="l in result.logins" :key="l.email" class="px-4 py-3 text-sm flex flex-wrap gap-x-3">
              <span class="font-semibold w-full md:w-48">{{ l.role }}</span>
              <code class="break-all">{{ l.email }}</code><code class="font-bold">{{ l.password }}</code>
            </div>
          </div>
        </div>
        <div v-if="result.contract" class="mt-4 text-sm">
          <div class="text-xs uppercase tracking-wider font-semibold text-ink-500">Contract</div>
          <div class="mt-1">{{ result.contract.title }}<template v-if="result.contract.emailed"> — emailed</template>: <code class="break-all">{{ result.contract.link }}</code></div>
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          <button class="ios-button-primary" @click="shareSummary"><i class="fa-solid fa-share-nodes mr-2"></i>Send to owner</button>
          <button class="ios-card px-5 font-semibold text-teal-700" @click="copySummary">Copy all</button>
          <button class="ios-card px-5 font-semibold text-ink-700" @click="startOver">Onboard another</button>
        </div>
        <p class="mt-3 text-xs text-ink-500">Passwords are shown only now. The owner can change theirs in the app; you can reset any login in Users.</p>
      </div>
    </template>

    <template v-else>
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Onboard a restaurant</h1>
      <p class="text-ink-500 mt-1">Five quick steps. Everything is created when you tap Create.</p>

      <div class="mt-5 flex gap-1.5">
        <div v-for="(s, i) in STEPS" :key="s" class="flex-1">
          <div class="h-1.5 rounded-full" :class="i + 1 <= step ? 'bg-teal-600' : 'bg-cream-200'"></div>
          <div class="mt-1 text-[11px] font-semibold truncate" :class="i + 1 === step ? 'text-teal-700' : 'text-ink-300'">{{ s }}</div>
        </div>
      </div>

      <!-- 1. Restaurant -->
      <section v-if="step === 1" class="mt-6 space-y-4">
        <div class="inline-flex bg-cream-200 rounded-full p-1">
          <button class="px-4 py-1.5 rounded-full text-sm font-semibold" :class="form.mode === 'new' ? 'bg-white shadow-soft' : 'text-ink-500'" @click="form.mode = 'new'; form.existingVendorId = ''">New restaurant</button>
          <button class="px-4 py-1.5 rounded-full text-sm font-semibold" :class="form.mode === 'existing' ? 'bg-white shadow-soft' : 'text-ink-500'" @click="form.mode = 'existing'">Add locations to an existing one</button>
        </div>

        <template v-if="form.mode === 'existing'">
          <select v-model="form.existingVendorId" class="input">
            <option value="">Choose the restaurant…</option>
            <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
          </select>
          <p class="text-sm text-ink-500">New locations get the restaurant's name, category and offers you choose next. Only the address is different.</p>
        </template>

        <template v-else>
          <div class="ios-card p-4">
            <div class="text-sm font-semibold">Find it</div>
            <p class="text-xs text-ink-500">Type the name and city — we fill in the address for you.</p>
            <div class="relative mt-2">
              <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-ink-300"></i>
              <input v-model="brandSearch.q.value" class="input pl-10" placeholder="e.g. Pizza My Heart Palo Alto" />
            </div>
            <div v-if="brandSearch.searching.value" class="text-xs text-ink-300 mt-2">Searching…</div>
            <button v-for="p in brandSearch.results.value" :key="p.lat + ',' + p.lng" class="w-full text-left mt-2 rounded-2xl px-4 py-3 bg-cream-100 active:bg-cream-200" @click="pickBusiness(p)">
              <div class="font-semibold">{{ p.name || p.street }}</div>
              <div class="text-xs text-ink-500">{{ p.street }}, {{ p.city }}, {{ p.state }} {{ p.zip }}</div>
            </button>
          </div>

          <input v-model="form.name" class="input" placeholder="Restaurant name" />
          <div>
            <div class="text-xs uppercase font-semibold text-ink-500">Type</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <button v-for="c in CATEGORIES" :key="c.value" class="rounded-full px-4 py-2 text-sm font-semibold border-2" :class="form.category === c.value ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20'" @click="form.category = c.value"><i class="fa-solid mr-1.5" :class="c.icon"></i>{{ c.label }}</button>
            </div>
          </div>
          <div>
            <div class="text-xs uppercase font-semibold text-ink-500">Food & drink (up to 5)</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <button v-for="c in CUISINES" :key="c" class="rounded-full px-3 py-1.5 text-sm border" :class="form.cuisineTags.includes(c) ? 'border-teal-600 bg-teal-600 text-white' : 'border-ink-300/30'" @click="toggleCuisine(c)">{{ c }}</button>
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-3">
            <input v-model="form.phone" type="tel" class="input" placeholder="Phone (optional)" />
            <input v-model="form.email" type="email" class="input" placeholder="Business email (optional)" />
            <input v-model="form.website" class="input" placeholder="Website (optional)" />
            <div class="flex gap-1">
              <button v-for="n in 4" :key="n" class="flex-1 rounded-2xl border-2 font-bold" :class="form.priceLevel === n ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20'" @click="form.priceLevel = n">{{ '$'.repeat(n) }}</button>
            </div>
          </div>
          <textarea v-model="form.description" rows="2" class="input" placeholder="One line about the place (optional)"></textarea>
        </template>
      </section>

      <!-- 2. Locations -->
      <section v-if="step === 2" class="mt-6 space-y-4">
        <p class="text-sm text-ink-500">Everything else is shared. For a franchise, just add each address.</p>
        <div v-for="(l, i) in form.locations" :key="i" class="ios-card p-4">
          <div class="flex items-center justify-between">
            <div class="font-semibold"><i class="fa-solid fa-location-dot text-coral-500 mr-1.5"></i>Location {{ i + 1 }}<span v-if="l.lat != null" class="ml-2 chip bg-green-100 text-green-700 text-[10px]">On the map</span></div>
            <button class="text-sm text-coral-600 font-semibold" @click="form.locations.splice(i, 1)">Remove</button>
          </div>
          <div class="mt-2 grid grid-cols-6 gap-2">
            <input v-model="l.street" class="input col-span-6" placeholder="Street" @input="l.lat = undefined" />
            <input v-model="l.city" class="input col-span-3" placeholder="City" @input="l.lat = undefined" />
            <input v-model="l.state" class="input col-span-1 uppercase" maxlength="2" placeholder="CA" />
            <input v-model="l.zip" class="input col-span-2" placeholder="ZIP" />
            <input v-model="l.phone" type="tel" class="input col-span-6" placeholder="Phone for this location (optional)" />
          </div>
        </div>

        <div class="ios-card p-4">
          <div class="text-sm font-semibold"><i class="fa-solid fa-plus mr-1.5"></i>Add a location</div>
          <input v-model="addrSearch.q.value" class="input mt-2" placeholder="Start typing the address…" />
          <div v-if="addrSearch.searching.value" class="text-xs text-ink-300 mt-2">Searching…</div>
          <button v-for="p in addrSearch.results.value" :key="p.lat + ',' + p.lng" class="w-full text-left mt-2 rounded-2xl px-4 py-3 bg-cream-100 active:bg-cream-200" @click="addLocation(p)">
            <div class="font-semibold">{{ p.street }}</div>
            <div class="text-xs text-ink-500">{{ p.name ? p.name + ' · ' : '' }}{{ p.city }}, {{ p.state }} {{ p.zip }}</div>
          </button>
          <button class="mt-2 text-sm font-semibold text-teal-700" @click="addManual">Type an address by hand</button>
        </div>

        <details class="ios-card p-4">
          <summary class="text-sm font-semibold cursor-pointer">Many locations? Paste them all</summary>
          <textarea v-model="bulkText" rows="4" class="input mt-2 text-sm" placeholder="One address per line, e.g.&#10;831 Middlefield Rd, Redwood City, CA 94063&#10;407 University Ave, Palo Alto, CA"></textarea>
          <button class="mt-2 ios-button-primary text-sm py-2 disabled:opacity-60" :disabled="bulkBusy || !bulkText.trim()" @click="addBulk">{{ bulkBusy ? 'Finding addresses…' : 'Add all' }}</button>
        </details>
      </section>

      <!-- 3. Happy hour & offers -->
      <section v-if="step === 3" class="mt-6 space-y-5">
        <div>
          <div class="text-xs uppercase font-semibold text-ink-500">Happy hour</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <button v-for="(h, i) in HOURS" :key="h.label" class="rounded-full px-4 py-2 text-sm font-semibold border-2" :class="form.hoursPreset === i ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-ink-300/20'" @click="pickHours(i)">{{ h.label }}</button>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <button v-for="d in DAYS" :key="d" class="w-11 h-9 rounded-xl text-xs font-bold uppercase" :class="form.days.includes(d) ? 'bg-teal-600 text-white' : 'bg-cream-200 text-ink-500'" @click="toggleDay(d)">{{ d }}</button>
            <input v-model="form.start" type="time" class="input w-auto ml-2" @input="form.hoursPreset = -1" />
            <span class="text-ink-500">to</span>
            <input v-model="form.end" type="time" class="input w-auto" @input="form.hoursPreset = -1" />
          </div>
        </div>

        <div>
          <div class="text-xs uppercase font-semibold text-ink-500">Offers — tap to add</div>
          <div class="mt-2 grid md:grid-cols-2 gap-2">
            <button v-for="p in OFFER_PRESETS" :key="p.title" class="text-left rounded-2xl px-4 py-3 border-2" :class="form.offers.some((o) => o.title === p.title) ? 'border-teal-600 bg-teal-50' : 'border-ink-300/20 bg-white'" @click="toggleOffer(p)">
              <div class="font-semibold"><i class="fa-solid mr-1.5" :class="form.offers.some((o) => o.title === p.title) ? 'fa-circle-check text-teal-600' : 'fa-circle-plus text-ink-300'"></i>{{ p.title }}</div>
              <div class="text-xs text-ink-500">{{ p.subtitle }}</div>
            </button>
          </div>
        </div>

        <div v-if="form.offers.length" class="space-y-2">
          <div class="text-xs uppercase font-semibold text-ink-500">Fine-tune (optional)</div>
          <div v-for="(o, i) in form.offers" :key="i" class="ios-card p-3 grid grid-cols-6 gap-2">
            <input v-model="o.title" class="input col-span-6 md:col-span-3" />
            <input v-model="o.subtitle" class="input col-span-6 md:col-span-3" placeholder="Details" />
            <label class="col-span-2 relative"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm">$</span><input v-model.number="o.priceUSD" type="number" min="0" class="input pl-6" title="Typical saving" /></label>
            <select v-model="o.requiredPlanTier" class="input col-span-4">
              <option v-for="t in TIER_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <p class="text-xs text-ink-500">The $ amount is the typical saving shown to staff after a scan.</p>
        </div>
      </section>

      <!-- 4. Logins & contract -->
      <section v-if="step === 4" class="mt-6 space-y-4">
        <label class="ios-card p-4 flex items-start gap-3 cursor-pointer">
          <input v-model="form.createOwner" type="checkbox" class="mt-1 w-5 h-5 accent-teal-700" />
          <span><b>Owner login</b><br><span class="text-sm text-ink-500">Manager portal: offers, team, analytics. We create a password; they can change it.</span></span>
        </label>
        <div v-if="form.createOwner" class="grid md:grid-cols-2 gap-3">
          <input v-model="form.ownerName" class="input" placeholder="Owner's full name" />
          <input v-model="form.ownerEmail" type="email" class="input" placeholder="Owner's email" />
        </div>
        <label class="ios-card p-4 flex items-start gap-3 cursor-pointer">
          <input v-model="form.staffPerLocation" type="checkbox" class="mt-1 w-5 h-5 accent-teal-700" />
          <span><b>A scanner login for each location</b><br><span class="text-sm text-ink-500">For the counter staff. Usernames are made for you.</span></span>
        </label>
        <label class="ios-card p-4 flex items-start gap-3 cursor-pointer">
          <input v-model="form.canPauseHappyHour" type="checkbox" class="mt-1 w-5 h-5 accent-teal-700" />
          <span><b>Let them pause happy hour</b><br><span class="text-sm text-ink-500">For busy moments (1 hour, 2 hours or the rest of the day).</span></span>
        </label>
        <label class="ios-card p-4 flex items-start gap-3 cursor-pointer" :class="!contracts.length && 'opacity-60'">
          <input v-model="form.sendContract" type="checkbox" :disabled="!contracts.length" class="mt-1 w-5 h-5 accent-teal-700" />
          <span class="flex-1"><b>Send the contract to sign</b><br>
            <span v-if="!contracts.length" class="text-sm text-ink-500">Add a contract text in Contracts first.</span>
            <select v-else v-model="form.contractId" class="input mt-2"><option v-for="c in contracts" :key="c._id" :value="c._id">{{ c.title }}</option></select>
          </span>
        </label>
      </section>

      <!-- 5. Review -->
      <section v-if="step === 5" class="mt-6 ios-card p-5 space-y-3 text-sm">
        <div class="text-lg font-bold">{{ form.name }}</div>
        <div><b>Locations ({{ form.locations.length }}):</b><ul class="mt-1 list-disc pl-5 text-ink-700"><li v-for="(l, i) in form.locations" :key="i">{{ l.street }}, {{ l.city }}, {{ l.state }} {{ l.zip }}</li></ul></div>
        <div><b>Happy hour:</b> {{ hoursLabel }}</div>
        <div><b>Offers:</b> {{ form.offers.map((o) => o.title).join(' · ') || 'none' }}</div>
        <div><b>Logins:</b> {{ [form.createOwner ? `owner (${form.ownerEmail})` : '', form.staffPerLocation ? `${form.locations.length} scanner` : ''].filter(Boolean).join(' + ') || 'none' }}</div>
        <div v-if="form.sendContract && form.contractId"><b>Contract:</b> {{ contracts.find((c) => c._id === form.contractId)?.title }}</div>
      </section>

      <div class="mt-6 flex items-center gap-3">
        <button v-if="step > 1" class="ios-card px-5 py-3 font-semibold text-ink-700" @click="step--">Back</button>
        <button v-if="step < 5" class="ios-button-primary flex-1" @click="next">Continue</button>
        <button v-else class="ios-button-primary flex-1 disabled:opacity-60" :disabled="creating" @click="create">{{ creating ? 'Creating…' : `Create ${form.name}` }}</button>
      </div>
    </template>
  </div>
</template>
