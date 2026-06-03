<script setup>
// Lists every footer content block (Membership, VIP Key, Become a Partner,
// Corporate, Careers, About, FAQs, Rules of Use, Contact Us, End User
// License, Privacy Policy) and lets the admin edit each one inline with
// markdown + Preview. Save bumps the version + records an audit log.

import { onMounted, ref, computed } from 'vue';
import client from '../../api/client';

const items = ref([]);
const loading = ref(true);
const selectedKey = ref('');
const draft = ref({ title: '', content: '' });
const saving = ref(false);
const savedAt = ref(null);
const preview = ref(false);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/admin/site-content');
    items.value = data.items || [];
    if (!selectedKey.value && items.value.length) {
      selectFor(items.value[0]);
    }
  } finally { loading.value = false; }
}

function selectFor(item) {
  selectedKey.value = item.key;
  draft.value = { title: item.title || '', content: item.content || '' };
  savedAt.value = null;
}

async function save() {
  if (!selectedKey.value) return;
  const current = items.value.find((i) => i.key === selectedKey.value);
  if (!confirm(`Save "${draft.value.title}" — will bump from v${current?.version || 1} to v${(current?.version || 1) + 1}. Continue?`)) return;
  saving.value = true;
  try {
    const { data } = await client.put(`/admin/site-content/${selectedKey.value}`, {
      title: draft.value.title,
      content: draft.value.content,
    });
    // refresh local list
    await load();
    selectedKey.value = data.key;
    draft.value = { title: data.title, content: data.content };
    savedAt.value = new Date();
  } catch (e) {
    alert(e.response?.data?.error?.message || 'Save failed');
  } finally { saving.value = false; }
}

function reset() {
  const current = items.value.find((i) => i.key === selectedKey.value);
  if (current) draft.value = { title: current.title, content: current.content };
}

const dirty = computed(() => {
  const current = items.value.find((i) => i.key === selectedKey.value);
  if (!current) return false;
  return draft.value.title !== current.title || draft.value.content !== current.content;
});

const grouped = computed(() => {
  const g = {};
  for (const it of items.value) {
    if (!g[it.section]) g[it.section] = [];
    g[it.section].push(it);
  }
  return g;
});

function sectionLabel(s) {
  return { membership: 'Membership', company: 'Company', help: 'Help & Support', legal: 'Legal' }[s] || s;
}

const wordCount = computed(() => draft.value.content.trim().split(/\s+/).filter(Boolean).length);

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
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Site Content</h1>
    <p class="text-ink-500 mt-1">All clickable links in the customer-app footer. Pick a block on the left to edit its content. Saving bumps that block's version.</p>

    <div v-if="loading" class="mt-6 ios-card h-96 animate-pulse"></div>

    <div v-else class="mt-5 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
      <!-- LEFT — list of blocks, grouped by section -->
      <div class="ios-card overflow-hidden">
        <div v-for="(section, name) in grouped" :key="name" class="border-b border-cream-200 last:border-0">
          <div class="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-ink-500 bg-cream-50">{{ sectionLabel(name) }}</div>
          <button
            v-for="b in section"
            :key="b.key"
            @click="selectFor(b)"
            class="w-full text-left px-4 py-2.5 hover:bg-cream-100 transition flex items-center justify-between gap-2"
            :class="selectedKey === b.key ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-ink-700'"
          >
            <span class="text-sm truncate">{{ b.title }}</span>
            <span class="text-[10px] text-ink-500 flex-shrink-0">v{{ b.version }}</span>
          </button>
        </div>
      </div>

      <!-- RIGHT — editor -->
      <div v-if="selectedKey" class="ios-card overflow-hidden">
        <div class="border-b border-cream-200 px-4 py-3 flex flex-wrap items-center gap-3 bg-cream-50">
          <input
            v-model="draft.title"
            placeholder="Title"
            class="flex-1 min-w-[200px] bg-white border border-ink-300/20 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-teal-600"
          />
          <div class="flex gap-1">
            <button @click="preview = false" class="px-3 py-1.5 rounded-full text-xs font-semibold" :class="!preview ? 'bg-teal-600 text-white' : 'text-ink-500'">Edit</button>
            <button @click="preview = true" class="px-3 py-1.5 rounded-full text-xs font-semibold" :class="preview ? 'bg-teal-600 text-white' : 'text-ink-500'">Preview</button>
          </div>
          <div class="text-[11px] text-ink-500">{{ wordCount }} words · {{ draft.content.length }} chars · <span class="font-mono">{{ selectedKey }}</span></div>
        </div>

        <textarea
          v-if="!preview"
          v-model="draft.content"
          class="w-full p-4 font-mono text-sm focus:outline-none"
          rows="22"
          placeholder="Markdown — use # heading, ## subheading, - list, > quote, [link](url), **bold**, *italic*"
        ></textarea>

        <div v-else class="p-5 prose-sm" v-html="renderMd(draft.content)"></div>

        <div class="border-t border-cream-200 px-4 py-3 flex items-center gap-2 flex-wrap bg-white">
          <button :disabled="!dirty || saving" @click="save" class="ios-button-primary">
            {{ saving ? 'Saving…' : dirty ? 'Save & bump version' : 'No changes' }}
          </button>
          <button :disabled="!dirty" @click="reset" class="ios-card px-4 py-2.5 text-sm font-semibold text-ink-700">Reset</button>
          <span v-if="savedAt" class="text-xs text-teal-700 font-semibold">✓ Saved {{ savedAt.toLocaleTimeString() }}</span>
        </div>
      </div>

      <div v-else class="ios-card p-6 text-center text-ink-500 text-sm">
        ← Pick a block from the left to start editing.
      </div>
    </div>

    <div class="mt-8 ios-card p-5 bg-cream-100 border border-ink-300/20">
      <div class="text-sm font-bold mb-1">ℹ️ How site content works</div>
      <ul class="text-sm text-ink-700 space-y-1 list-disc list-inside">
        <li>The customer-app footer fetches each block on demand when the user clicks the link.</li>
        <li>Every save bumps that one block's version (Membership and Careers don't affect each other).</li>
        <li>Every save is audit-logged with previous + new content.</li>
        <li>Footer link <strong>"Terms of Use"</strong> opens the existing Consumer Terms document (Admin → Terms → Consumer tab), not edited here.</li>
      </ul>
    </div>
  </div>
</template>
