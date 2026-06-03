<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';

const props = defineProps({
  show: Boolean,
  audience: { type: String, default: 'consumer' }, // 'consumer' | 'merchant'
});
const emit = defineEmits(['close']);

const terms = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/public/terms', { params: { audience: props.audience } });
    terms.value = data;
  } finally { loading.value = false; }
});

// Very small markdown renderer (headings + paragraphs + lists)
function renderMd(md) {
  if (!md) return '';
  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split(/\n/);
  let out = '';
  let inList = false;
  for (const raw of lines) {
    const line = escape(raw);
    if (/^### /.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<h3 class="font-bold mt-4 mb-2">${line.replace(/^### /, '')}</h3>`; continue; }
    if (/^## /.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<h2 class="text-lg font-bold mt-5 mb-2">${line.replace(/^## /, '')}</h2>`; continue; }
    if (/^# /.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<h1 class="text-xl font-bold mt-6 mb-3">${line.replace(/^# /, '')}</h1>`; continue; }
    if (/^>\s/.test(raw)) { if (inList) { out += '</ul>'; inList = false; } out += `<blockquote class="border-l-4 border-coral-500 pl-3 my-3 text-ink-700 italic">${line.replace(/^&gt;\s?/, '')}</blockquote>`; continue; }
    if (/^[-*]\s/.test(raw)) {
      if (!inList) { out += '<ul class="list-disc list-inside space-y-1 my-2">'; inList = true; }
      out += `<li>${line.replace(/^[-*]\s/, '')}</li>`;
      continue;
    }
    if (inList) { out += '</ul>'; inList = false; }
    if (raw.trim() === '') { out += ''; continue; }
    out += `<p class="my-2 leading-relaxed">${line}</p>`;
  }
  if (inList) out += '</ul>';
  return out;
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" @click.self="emit('close')">
    <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[85vh] overflow-y-auto shadow-lift">
      <div class="sticky top-0 bg-white border-b border-cream-200 px-5 py-3 flex items-center justify-between rounded-t-3xl">
        <div>
          <div class="font-bold">Terms of Service</div>
          <div v-if="terms" class="text-xs text-ink-500">Version {{ terms.version }} · Updated {{ new Date(terms.updatedAt).toLocaleDateString() }}</div>
        </div>
        <button @click="emit('close')" class="w-8 h-8 -mr-2 rounded-full active:bg-cream-200 flex items-center justify-center">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="px-5 py-4 text-sm text-ink-700">
        <div v-if="loading" class="h-40 bg-cream-200 rounded-2xl animate-pulse"></div>
        <div v-else v-html="renderMd(terms?.content)"></div>
      </div>
      <div class="sticky bottom-0 bg-white border-t border-cream-200 p-4">
        <button @click="emit('close')" class="ios-button-primary w-full">Got it</button>
      </div>
    </div>
  </div>
</template>
