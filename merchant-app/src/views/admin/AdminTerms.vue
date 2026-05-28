<script setup>
import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';

const terms = ref(null);
const draft = ref('');
const loading = ref(true);
const saving = ref(false);
const savedAt = ref(null);
const preview = ref(false);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/site-settings/terms');
    terms.value = data;
    draft.value = data.content || '';
  } finally { loading.value = false; }
}

async function save() {
  if (!confirm('Saving will bump the version. All NEW signups must accept this new version. Continue?')) return;
  saving.value = true;
  try {
    const { data } = await client.put('/admin/site-settings/terms', { content: draft.value });
    terms.value = data;
    savedAt.value = new Date();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Save failed');
  } finally { saving.value = false; }
}

function reset() {
  draft.value = terms.value?.content || '';
}

const dirty = computed(() => draft.value !== (terms.value?.content || ''));
const wordCount = computed(() => draft.value.trim().split(/\s+/).filter(Boolean).length);

function renderMd(md) {
  if (!md) return '';
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split(/\n/);
  let out = ''; let inList = false;
  for (const raw of lines) {
    const line = escape(raw);
    if (/^### /.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<h3 class="font-bold mt-4 mb-2">${line.replace(/^### /, '')}</h3>`; continue; }
    if (/^## /.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<h2 class="text-lg font-bold mt-5 mb-2">${line.replace(/^## /, '')}</h2>`; continue; }
    if (/^# /.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<h1 class="text-xl font-bold mt-6 mb-3">${line.replace(/^# /, '')}</h1>`; continue; }
    if (/^>\s/.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<blockquote class="border-l-4 border-coral-500 pl-3 my-3 text-ink-700 italic">${line.replace(/^&gt;\s?/, '')}</blockquote>`; continue; }
    if (/^[-*]\s/.test(raw)) { if (!inList) { out += '<ul class="list-disc list-inside space-y-1 my-2">'; inList = true; } out += `<li>${line.replace(/^[-*]\s/, '')}</li>`; continue; }
    if (inList) { out += '</ul>'; inList = false; }
    if (raw.trim() === '') { continue; }
    out += `<p class="my-2 leading-relaxed">${line}</p>`;
  }
  if (inList) out += '</ul>';
  return out;
}

onMounted(load);
</script>

<template>
  <div class="p-5 md:p-8">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p class="text-ink-500 mt-1">Markdown editor. Saving bumps the version — every new signup must re-accept.</p>
      </div>
      <div v-if="terms" class="text-right text-sm">
        <div class="chip bg-teal-50 text-teal-700">Live · v{{ terms.version }}</div>
        <div class="text-xs text-ink-500 mt-1">Updated {{ new Date(terms.updatedAt).toLocaleString() }}</div>
      </div>
    </div>

    <div v-if="loading" class="mt-6 ios-card h-96 animate-pulse"></div>

    <template v-else>
      <div class="mt-5 ios-card overflow-hidden">
        <div class="border-b border-cream-200 px-4 py-2 flex items-center justify-between bg-cream-50">
          <div class="flex gap-1">
            <button @click="preview = false" class="px-3 py-1.5 rounded-full text-xs font-semibold" :class="!preview ? 'bg-teal-600 text-white' : 'text-ink-500'">Edit</button>
            <button @click="preview = true" class="px-3 py-1.5 rounded-full text-xs font-semibold" :class="preview ? 'bg-teal-600 text-white' : 'text-ink-500'">Preview</button>
          </div>
          <div class="text-xs text-ink-500">{{ wordCount }} words · {{ draft.length }} chars</div>
        </div>

        <textarea v-if="!preview" v-model="draft" class="w-full p-4 font-mono text-sm focus:outline-none" rows="22" placeholder="Use markdown. # heading, ## subheading, - list, > quote"></textarea>

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
        <div class="text-sm font-bold mb-1">ℹ️ How versioning works</div>
        <ul class="text-sm text-ink-700 space-y-1 list-disc list-inside">
          <li>Saving creates a <strong>new version</strong> in the database and shown to all NEW signups.</li>
          <li>Existing users keep the version they accepted (audit-tracked in the user record).</li>
          <li>If you later want to force re-acceptance, you can add that flow — the version field is already stored per user.</li>
        </ul>
      </div>
    </template>
  </div>
</template>
