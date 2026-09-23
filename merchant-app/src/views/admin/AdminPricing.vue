<script setup>
// Membership prices for the website and both apps. Saved prices apply to new
// purchases at once; current members keep what they paid until their period ends.
import { onMounted, reactive, ref } from 'vue';
import client from '../../api/client';

const loading = ref(true);
const loadError = ref('');
const sections = ref([]);            // [{ key, title, note, plans: [...] }]
const drafts = reactive({});         // "audience:tier" -> { monthly, yearly }
const status = reactive({});         // "audience:tier" -> { saving, msg, error }

const SECTIONS = [
  { key: 'customer', title: 'Customer membership', note: 'What members pay on the website, iPhone and Android apps.' },
  { key: 'merchant', title: 'Merchant plans', note: 'What partner venues pay for their plan.' },
];

const id = (p) => `${p.audience}:${p.tier}`;
const money = (n) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2,
}).format(Number(n) || 0);

function apply(data) {
  sections.value = SECTIONS.map((s) => ({ ...s, plans: data[s.key] || [] }));
  for (const s of sections.value) {
    for (const p of s.plans) {
      drafts[id(p)] = { monthly: p.price.monthly, yearly: p.price.yearly };
      if (!status[id(p)]) status[id(p)] = { saving: false, msg: '', error: '' };
    }
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const { data } = await client.get('/admin/pricing');
    apply(data);
  } catch (e) {
    loadError.value = e.response?.data?.error?.message || 'Could not load prices.';
  } finally {
    loading.value = false;
  }
}

function valid(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0.5;
}
function changed(p) {
  const d = drafts[id(p)];
  return d && (Number(d.monthly) !== p.price.monthly || Number(d.yearly) !== p.price.yearly);
}
function canSave(p) {
  const d = drafts[id(p)];
  return d && changed(p) && valid(d.monthly) && valid(d.yearly) && !status[id(p)].saving;
}
// "Yearly = 10 months of monthly · save 17%"
function yearlyNote(p) {
  const d = drafts[id(p)];
  const m = Number(d?.monthly), y = Number(d?.yearly);
  if (!valid(m) || !valid(y)) return '';
  const months = y / m;
  const save = Math.round((1 - y / (m * 12)) * 100);
  const monthsText = `${Number.isInteger(Math.round(months * 10) / 10) ? Math.round(months) : months.toFixed(1)} months of monthly`;
  return save > 0 ? `Yearly = ${monthsText} · members save ${save}%` : `Yearly = ${monthsText} · no saving vs monthly`;
}

async function save(p) {
  const d = drafts[id(p)];
  const st = status[id(p)];
  const label = `${p.label} (${p.audience})`;
  if (!window.confirm(`Change ${label} to ${money(d.monthly)} a month and ${money(d.yearly)} a year?\n\nNew purchases use this price immediately. Current members keep their price until their period ends.`)) return;
  st.saving = true; st.msg = ''; st.error = '';
  try {
    const { data } = await client.put(`/admin/pricing/${p.audience}/${p.tier}`, {
      monthly: Number(d.monthly), yearly: Number(d.yearly),
    });
    apply(data);
    st.msg = 'Saved - live now';
  } catch (e) {
    st.error = e.response?.data?.error?.message || 'Could not save the price.';
  } finally {
    st.saving = false;
  }
}

async function reset(p) {
  const st = status[id(p)];
  if (!window.confirm(`Reset ${p.label} (${p.audience}) to the default ${money(p.defaultPrice.monthly)} / ${money(p.defaultPrice.yearly)}?`)) return;
  st.saving = true; st.msg = ''; st.error = '';
  try {
    const { data } = await client.delete(`/admin/pricing/${p.audience}/${p.tier}`);
    apply(data);
    st.msg = 'Back to default';
  } catch (e) {
    st.error = e.response?.data?.error?.message || 'Could not reset the price.';
  } finally {
    st.saving = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8 max-w-5xl">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Pricing</h1>
    <p class="text-ink-500 mt-1">Membership prices for the website, the iPhone app and the Android app.</p>

    <div class="mt-5 rounded-2xl border border-teal-600/20 bg-teal-50 px-4 py-3 text-sm text-teal-900 leading-relaxed">
      <b>Changes go live immediately</b> for new purchases everywhere. Current members keep the price they paid
      until their billing period ends.
      <div class="mt-1 text-teal-800/80">
        To show the live price in Site Content, write <code class="px-1 rounded bg-white/70">&#123;&#123;price:gold:monthly&#125;&#125;</code>
        or <code class="px-1 rounded bg-white/70">&#123;&#123;price:gold:yearly&#125;&#125;</code>.
      </div>
    </div>

    <div v-if="loading" class="mt-6 grid md:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="ios-card h-56 animate-pulse"></div>
    </div>
    <div v-else-if="loadError" class="mt-6 ios-card p-5 text-coral-600">
      {{ loadError }} <button class="underline font-semibold ml-2" @click="load">Try again</button>
    </div>

    <template v-else>
      <section v-for="s in sections" :key="s.key" class="mt-8">
        <h2 class="text-lg font-bold">{{ s.title }}</h2>
        <p class="text-sm text-ink-500">{{ s.note }}</p>

        <div class="mt-3 grid md:grid-cols-2 gap-4">
          <form
            v-for="p in s.plans"
            :key="p.tier"
            class="ios-card p-5"
            @submit.prevent="canSave(p) && save(p)"
          >
            <div class="flex items-center gap-2 flex-wrap">
              <div class="text-lg font-bold">{{ p.label }}</div>
              <span v-if="p.badge" class="chip bg-coral-500/10 text-coral-600 text-[10px]">{{ p.badge }}</span>
              <span v-if="p.overridden" class="chip bg-amber-50 text-amber-700 text-[10px]">Custom price</span>
              <span v-else class="chip bg-cream-200 text-ink-500 text-[10px]">Default</span>
            </div>
            <p v-if="s.key === 'customer' && p.tier !== 'gold'" class="text-xs text-ink-500 mt-1">
              Shown to customers only while the “Subscription tiers” feature is on (Admin → Features).
            </p>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Monthly</span>
                <div class="relative mt-1">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500">$</span>
                  <input v-model="drafts[id(p)].monthly" type="number" inputmode="decimal" min="0.5" step="0.01"
                         class="input pl-8" :class="valid(drafts[id(p)].monthly) ? '' : 'border-coral-500'" />
                </div>
              </label>
              <label class="block">
                <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Yearly</span>
                <div class="relative mt-1">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500">$</span>
                  <input v-model="drafts[id(p)].yearly" type="number" inputmode="decimal" min="0.5" step="0.01"
                         class="input pl-8" :class="valid(drafts[id(p)].yearly) ? '' : 'border-coral-500'" />
                </div>
              </label>
            </div>

            <div class="mt-2 text-xs text-ink-500 min-h-[1rem]">{{ yearlyNote(p) }}</div>
            <div class="text-xs text-ink-300">
              Default {{ money(p.defaultPrice.monthly) }} / {{ money(p.defaultPrice.yearly) }}
              <template v-if="p.overridden && p.updatedAt"> · changed {{ new Date(p.updatedAt).toLocaleDateString() }}</template>
            </div>
            <div v-if="!valid(drafts[id(p)].monthly) || !valid(drafts[id(p)].yearly)" class="mt-2 text-xs text-coral-600">
              Prices must be at least $0.50.
            </div>

            <div class="mt-4 flex items-center gap-3 flex-wrap">
              <button type="submit" class="ios-button-primary py-2.5 px-5 text-sm disabled:opacity-40" :disabled="!canSave(p)">
                {{ status[id(p)].saving ? 'Saving…' : 'Save price' }}
              </button>
              <button v-if="p.overridden" type="button" class="text-sm font-semibold text-ink-500 underline" :disabled="status[id(p)].saving" @click="reset(p)">
                Reset to default
              </button>
              <span v-if="status[id(p)].msg" class="text-sm text-green-700 font-semibold">{{ status[id(p)].msg }}</span>
              <span v-if="status[id(p)].error" class="text-sm text-coral-600">{{ status[id(p)].error }}</span>
            </div>
          </form>
        </div>
      </section>
    </template>
  </div>
</template>
