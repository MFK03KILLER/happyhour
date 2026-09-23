<script setup>
// Inbox for venues that applied through the merchant app. Approve a venue here,
// then create its vendor, merchant and staff accounts from their own pages.
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../../api/client';

const router = useRouter();
const items = ref([]);
const counts = ref({});
const loading = ref(true);
const filter = ref('open');
const open = ref(null);
const notes = ref('');
const saving = ref(false);

const STATUS = {
  new: { label: 'New', cls: 'bg-coral-500/10 text-coral-600' },
  contacted: { label: 'Contacted', cls: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', cls: 'bg-cream-200 text-ink-500' },
};
const CATEGORY = {
  dining: 'Restaurant', cafe: 'Cafe', bar: 'Bar', bakery: 'Bakery', activities: 'Activities',
  wellness: 'Wellness', hotels: 'Hotel', services: 'Services', other: 'Other',
};

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/partner-applications');
    items.value = data.items;
    counts.value = data.counts || {};
  } finally { loading.value = false; }
}

const shown = computed(() => {
  if (filter.value === 'open') return items.value.filter((a) => a.status === 'new' || a.status === 'contacted');
  if (filter.value === 'all') return items.value;
  return items.value.filter((a) => a.status === filter.value);
});

function view(a) { open.value = a; notes.value = a.adminNotes || ''; }

async function setStatus(status) {
  if (!open.value) return;
  saving.value = true;
  try {
    const { data } = await client.patch(`/admin/partner-applications/${open.value._id}`, { status, adminNotes: notes.value });
    const i = items.value.findIndex((x) => x._id === data._id);
    if (i > -1) items.value[i] = data;
    open.value = data;
    await load();
  } finally { saving.value = false; }
}

function when(d) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Partner applications</h1>
        <p class="text-ink-500 mt-1">Venues that applied from the merchant app · {{ (counts.new || 0) }} new</p>
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button v-for="f in [['open','Open'],['approved','Approved'],['rejected','Rejected'],['all','All']]" :key="f[0]"
                @click="filter = f[0]"
                class="chip text-xs px-3 py-1.5"
                :class="filter === f[0] ? 'bg-teal-700 text-white' : 'bg-cream-200 text-ink-700'">{{ f[1] }}</button>
      </div>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="ios-card h-20 animate-pulse"></div>
    </div>
    <div v-else-if="shown.length === 0" class="mt-12 text-center text-ink-500">
      <i class="fa-solid fa-inbox text-4xl text-ink-300"></i>
      <div class="mt-3">No applications here yet.</div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <button v-for="a in shown" :key="a._id" @click="view(a)" class="w-full p-4 flex items-center gap-3 text-left hover:bg-cream-50">
        <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-store"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold truncate">{{ a.businessName }}</span>
            <span class="chip text-[10px]" :class="STATUS[a.status].cls">{{ STATUS[a.status].label }}</span>
          </div>
          <div class="text-sm text-ink-500 truncate">
            {{ a.contactName }} · {{ CATEGORY[a.category] || a.category }}<span v-if="a.city"> · {{ a.city }}</span>
          </div>
        </div>
        <div class="text-xs text-ink-500 flex-shrink-0">{{ when(a.createdAt) }}</div>
      </button>
    </div>

    <!-- Detail -->
    <div v-if="open" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6" @click.self="open = null">
      <div class="bg-cream-50 w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xl font-bold">{{ open.businessName }}</div>
            <span class="chip text-[10px] mt-1" :class="STATUS[open.status].cls">{{ STATUS[open.status].label }}</span>
          </div>
          <button @click="open = null" aria-label="Close" class="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <dl class="mt-5 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
          <dt class="text-ink-500">Contact</dt><dd class="font-medium">{{ open.contactName }}</dd>
          <dt class="text-ink-500">Email</dt><dd><a :href="`mailto:${open.email}`" class="text-teal-700 underline break-all">{{ open.email }}</a></dd>
          <dt class="text-ink-500">Phone</dt><dd>{{ open.phone || '—' }}</dd>
          <dt class="text-ink-500">City</dt><dd>{{ open.city || '—' }}</dd>
          <dt class="text-ink-500">Type</dt><dd>{{ CATEGORY[open.category] || open.category }}</dd>
          <dt class="text-ink-500">Locations</dt><dd>{{ open.locations || 1 }}</dd>
          <dt class="text-ink-500">Applied</dt><dd>{{ when(open.createdAt) }}</dd>
        </dl>
        <p v-if="open.message" class="mt-4 text-sm bg-white rounded-2xl p-3 border border-cream-200 whitespace-pre-line">{{ open.message }}</p>

        <label class="block mt-5 text-xs uppercase font-semibold text-ink-500 tracking-wider">Internal notes</label>
        <textarea v-model="notes" rows="3" class="input mt-1.5 resize-none" placeholder="Call outcome, offer agreed…"></textarea>

        <div class="mt-5 grid grid-cols-3 gap-2">
          <button :disabled="saving" @click="setStatus('contacted')" class="ios-card py-2.5 text-sm font-semibold">Contacted</button>
          <button :disabled="saving" @click="setStatus('approved')" class="py-2.5 text-sm font-semibold rounded-2xl bg-green-600 text-white">Approve</button>
          <button :disabled="saving" @click="setStatus('rejected')" class="py-2.5 text-sm font-semibold rounded-2xl bg-cream-200 text-ink-700">Reject</button>
        </div>
        <button v-if="open.status === 'approved'" @click="router.push('/admin/vendors')"
                class="mt-3 w-full ios-button-primary py-3">
          Create their vendor account →
        </button>
      </div>
    </div>
  </div>
</template>
