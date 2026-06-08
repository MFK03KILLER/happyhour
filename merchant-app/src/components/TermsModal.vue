<script setup>
import { onMounted, ref } from 'vue';
import client from '../api/client';

const props = defineProps({
  show: Boolean,
  // 'consumer' | 'merchant' — which document to fetch
  audience: { type: String, default: 'merchant' },
  // When true, modal forces the user to tick "I agree" before they can close it,
  // and emits 'accept' with the version so the parent can POST /merchant/accept-terms
  // (or /vendor/accept-terms). Used for the forced first-login / version-bump flow.
  requireAccept: { type: Boolean, default: false },
  // When true, fetch but never show the loading skeleton (renders inline)
  inline: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'accept']);

const terms = ref(null);
const loading = ref(true);
const agreed = ref(false);
const submitting = ref(false);

async function load() {
  loading.value = true;
  try {
    const { data } = await client.get('/public/terms', { params: { audience: props.audience } });
    terms.value = data;
  } finally { loading.value = false; }
}
onMounted(load);

async function accept() {
  if (!agreed.value || !terms.value?.version) return;
  submitting.value = true;
  try {
    emit('accept', terms.value.version);
  } finally { submitting.value = false; }
}

// Minimal markdown renderer (h1/h2/h3, lists, blockquote, paragraphs)
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
  // Light bold / italic post-process
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
  return out;
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center" @click.self="!requireAccept && emit('close')">
    <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-3xl max-h-[92vh] flex flex-col shadow-lift">
      <div class="border-b border-cream-200 px-5 py-3 flex items-center justify-between rounded-t-3xl bg-white sticky top-0">
        <div class="min-w-0">
          <div class="font-bold truncate">{{ audience === 'merchant' ? 'قوانین و شرایط مرچنت' : 'شرایط استفاده' }}</div>
          <div v-if="terms" class="text-xs text-ink-500">نسخه {{ terms.version }} · به‌روز شده {{ new Date(terms.updatedAt).toLocaleDateString('fa-IR-u-ca-persian') }}</div>
        </div>
        <button v-if="!requireAccept" @click="emit('close')" class="w-8 h-8 -mr-2 rounded-full active:bg-cream-200 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="px-5 py-4 text-sm text-ink-700 overflow-y-auto flex-1">
        <div v-if="loading" class="h-40 bg-cream-200 rounded-2xl animate-pulse"></div>
        <div v-else v-html="renderMd(terms?.content)"></div>
      </div>

      <div class="border-t border-cream-200 p-4 bg-white sticky bottom-0">
        <template v-if="requireAccept">
          <label class="flex items-start gap-3 pb-3 cursor-pointer select-none">
            <input v-model="agreed" type="checkbox" class="mt-0.5 w-5 h-5 accent-teal-600 flex-shrink-0" />
            <span class="text-sm text-ink-700 leading-relaxed">
              متن قوانین بالا را خوانده‌ام و می‌پذیرم
              <span v-if="terms" class="text-ink-300">(نسخه {{ terms.version }})</span>.
            </span>
          </label>
          <div class="flex gap-2">
            <button @click="emit('close')" class="ios-card flex-1 py-3 font-semibold text-coral-600">رد و خروج از حساب</button>
            <button @click="accept" :disabled="!agreed || submitting" class="ios-button-primary flex-1">
              {{ submitting ? 'در حال ذخیره…' : 'می‌پذیرم، ادامه' }}
            </button>
          </div>
        </template>
        <button v-else @click="emit('close')" class="ios-button-primary w-full">متوجه شدم</button>
      </div>
    </div>
  </div>
</template>
