<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import client from '../../api/client';

const audience = ref('consumer'); // 'consumer' | 'merchant'
const terms = ref(null);
const draft = ref('');
const loading = ref(true);
const saving = ref(false);
const savedAt = ref(null);
const preview = ref(false);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/site-settings/terms', { params: { audience: audience.value } });
    terms.value = data;
    draft.value = data.content || '';
    savedAt.value = null;
  } finally { loading.value = false; }
}

async function save() {
  const audLabel = audience.value === 'merchant' ? 'Merchant' : 'Consumer';
  if (!confirm(`Save will bump the ${audLabel} terms version. All NEW signups + every active ${audience.value === 'merchant' ? 'vendor/staff' : 'customer'} on next login must re-accept this new version. Continue?`)) return;
  saving.value = true;
  try {
    const { data } = await client.put('/admin/site-settings/terms', { content: draft.value, audience: audience.value });
    terms.value = data;
    savedAt.value = new Date();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Save failed');
  } finally { saving.value = false; }
}

function reset() {
  draft.value = terms.value?.content || '';
}

// Switch audience reloads
watch(audience, () => load());

const dirty = computed(() => draft.value !== (terms.value?.content || ''));
const wordCount = computed(() => draft.value.trim().split(/\s+/).filter(Boolean).length);

function renderMd(md) {
  if (!md) return '';
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split(/\n/);
  let out = ''; let inList = false; let inOl = false;
  for (const raw of lines) {
    const line = escape(raw);
    const closeLists = () => {
      if (inList) { out += '</ul>'; inList = false; }
      if (inOl) { out += '</ol>'; inOl = false; }
    };
    if (/^### /.test(raw)) { closeLists(); out += `<h3 class="font-bold mt-4 mb-2">${line.replace(/^### /, '')}</h3>`; continue; }
    if (/^## /.test(raw)) { closeLists(); out += `<h2 class="text-lg font-bold mt-5 mb-2">${line.replace(/^## /, '')}</h2>`; continue; }
    if (/^# /.test(raw)) { closeLists(); out += `<h1 class="text-xl font-bold mt-6 mb-3">${line.replace(/^# /, '')}</h1>`; continue; }
    if (/^>\s/.test(raw)) { closeLists(); out += `<blockquote class="border-l-4 border-coral-500 pl-3 my-3 text-ink-700 italic">${line.replace(/^&gt;\s?/, '')}</blockquote>`; continue; }
    if (/^[-*]\s/.test(raw)) {
      if (!inList) { closeLists(); out += '<ul class="list-disc list-inside space-y-1 my-2 ml-2">'; inList = true; }
      out += `<li>${line.replace(/^[-*]\s/, '')}</li>`;
      continue;
    }
    if (/^\d+\.\s/.test(raw)) {
      if (!inOl) { closeLists(); out += '<ol class="list-decimal list-inside space-y-1 my-2 ml-2">'; inOl = true; }
      out += `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
      continue;
    }
    closeLists();
    if (raw.trim() === '') continue;
    out += `<p class="my-2 leading-relaxed">${line}</p>`;
  }
  if (inList) out += '</ul>';
  if (inOl) out += '</ol>';
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
  return out;
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p class="text-ink-500 mt-1">Markdown editor. Saving bumps the version — everyone on this audience must re-accept on next signup / login.</p>
      </div>
      <div v-if="terms" class="text-right text-sm">
        <div class="chip bg-teal-50 text-teal-700">Live · v{{ terms.version }}</div>
        <div class="text-xs text-ink-500 mt-1">Updated {{ new Date(terms.updatedAt).toLocaleString() }}</div>
      </div>
    </div>

    <!-- Audience switcher -->
    <div class="mt-5 inline-flex bg-cream-100 rounded-full p-1 border border-ink-300/10">
      <button @click="audience='consumer'" class="px-5 py-1.5 rounded-full text-sm font-semibold transition" :class="audience==='consumer' ? 'bg-teal-600 text-white shadow-soft' : 'text-ink-700 hover:bg-cream-200'">
        <i class="fa-solid fa-user mr-1.5"></i>Consumer
      </button>
      <button @click="audience='merchant'" class="px-5 py-1.5 rounded-full text-sm font-semibold transition" :class="audience==='merchant' ? 'bg-teal-600 text-white shadow-soft' : 'text-ink-700 hover:bg-cream-200'">
        <i class="fa-solid fa-store mr-1.5"></i>Merchant
      </button>
    </div>

    <div v-if="loading" class="mt-5 ios-card h-96 animate-pulse"></div>

    <template v-else>
      <div class="mt-5 ios-card overflow-hidden">
        <div class="border-b border-cream-200 px-4 py-2 flex items-center justify-between bg-cream-50">
          <div class="flex gap-1">
            <button @click="preview = false" class="px-3 py-1.5 rounded-full text-xs font-semibold" :class="!preview ? 'bg-teal-600 text-white' : 'text-ink-500'">Edit</button>
            <button @click="preview = true" class="px-3 py-1.5 rounded-full text-xs font-semibold" :class="preview ? 'bg-teal-600 text-white' : 'text-ink-500'">Preview</button>
          </div>
          <div class="text-xs text-ink-500">{{ wordCount }} words · {{ draft.length }} chars · audience: <span class="font-semibold">{{ audience }}</span></div>
        </div>

        <textarea v-if="!preview" v-model="draft" class="w-full p-4 font-mono text-sm focus:outline-none" rows="26" placeholder="Use markdown. # heading, ## subheading, - list, > quote"></textarea>

        <div v-else class="p-5 prose-sm" v-html="renderMd(draft)"></div>
      </div>

      <div class="mt-4 flex items-center gap-2 flex-wrap">
        <button :disabled="!dirty || saving" @click="save" class="ios-button-primary">
          {{ saving ? 'Saving…' : dirty ? `Save & bump to v${(terms?.version || 0) + 1}` : 'No changes' }}
        </button>
        <button :disabled="!dirty" @click="reset" class="ios-card px-4 py-2.5 text-sm font-semibold text-ink-700">Reset</button>
        <span v-if="savedAt" class="text-xs text-teal-700 font-semibold">✓ Saved {{ savedAt.toLocaleTimeString() }}</span>
      </div>

      <div class="mt-8 ios-card p-5 bg-cream-100 border border-ink-300/20">
        <div class="text-sm font-bold mb-1">ℹ️ How the two documents differ</div>
        <ul class="text-sm text-ink-700 space-y-1 list-disc list-inside">
          <li><strong>Consumer</strong> — shown to customers on the consumer app (Register screen + Login footer). Required at signup.</li>
          <li><strong>Merchant</strong> — shown to vendor owners + merchant_staff. Force-prompted on first login (or after a version bump) and accessible from the merchant-app footer.</li>
          <li>Each audience has its own version counter. Bumping one does not affect the other.</li>
          <li>Every save is recorded in the audit log with the previous and new content.</li>
        </ul>
      </div>
    </template>
  </div>
</template>
