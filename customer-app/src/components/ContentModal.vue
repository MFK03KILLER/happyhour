<script setup>
// Generic modal that fetches a single SiteSetting content block by key
// and renders its markdown. Used by Footer.vue to show Membership / VIP Key /
// Become a Partner / Corporate / Careers / About / FAQs / Rules of Use /
// Contact Us / End User License / Privacy Policy.

import { ref, watch } from 'vue';
import client from '../api/client';

const props = defineProps({
  show: Boolean,
  contentKey: { type: String, default: '' },
});
const emit = defineEmits(['close']);

const content = ref(null);
const loading = ref(false);
const error = ref('');

async function load() {
  if (!props.contentKey) return;
  loading.value = true;
  error.value = '';
  content.value = null;
  try {
    const { data } = await client.get(`/public/site-content/${props.contentKey}`);
    content.value = data;
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not load content';
  } finally {
    loading.value = false;
  }
}

// Refetch every time `show` flips on with a new key
watch(() => [props.show, props.contentKey], ([show]) => {
  if (show && props.contentKey) load();
}, { immediate: true });

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
    if (/^### /.test(raw)) { closeLists(); out += `<h3 class="font-bold mt-4 mb-2 text-ink-900">${line.replace(/^### /, '')}</h3>`; continue; }
    if (/^## /.test(raw)) { closeLists(); out += `<h2 class="text-base font-bold mt-5 mb-2 text-ink-900">${line.replace(/^## /, '')}</h2>`; continue; }
    if (/^# /.test(raw)) { closeLists(); out += `<h1 class="text-lg font-bold mt-6 mb-3 text-ink-900">${line.replace(/^# /, '')}</h1>`; continue; }
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
  out = out.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-teal-700 underline">$1</a>');
  return out;
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" @click.self="emit('close')">
    <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[88vh] flex flex-col shadow-lift">
      <div class="sticky top-0 bg-white border-b border-cream-200 px-5 py-3 flex items-center justify-between rounded-t-3xl">
        <div class="min-w-0">
          <div class="font-bold truncate">{{ content?.title || 'در حال بارگذاری…' }}</div>
          <div v-if="content" class="text-xs text-ink-500">به‌روز شده در {{ new Date(content.updatedAt).toLocaleDateString('fa-IR-u-ca-persian') }}</div>
        </div>
        <button @click="emit('close')" class="w-8 h-8 -mr-2 rounded-full active:bg-cream-200 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="px-5 py-4 text-sm text-ink-700 overflow-y-auto flex-1">
        <div v-if="loading" class="h-40 bg-cream-200 rounded-2xl animate-pulse"></div>
        <div v-else-if="error" class="text-coral-600 text-sm py-8 text-center">
          <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 block"></i>
          {{ error }}
        </div>
        <div v-else-if="content" v-html="renderMd(content.content)"></div>
      </div>
      <div class="sticky bottom-0 bg-white border-t border-cream-200 p-4">
        <button @click="emit('close')" class="ios-button-primary w-full">بستن</button>
      </div>
    </div>
  </div>
</template>
