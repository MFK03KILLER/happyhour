<script setup>
// Public, crawlable legal pages: /privacy, /terms, /eula.
// Linked from the Google Play / App Store listings, so they must work without login.
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';
import { renderMd } from '../utils/markdown';

const props = defineProps({ page: { type: String, required: true } });
const router = useRouter();
const loading = ref(true);
const title = ref('');
const meta = ref('');
const html = ref('');
const error = ref('');

const PAGES = {
  privacy: { title: 'Privacy Policy', kind: 'content', key: 'content_legal_privacy' },
  eula: { title: 'End User License Agreement', kind: 'content', key: 'content_legal_eula' },
  terms: { title: 'Terms of Service', kind: 'terms' },
};
const def = computed(() => PAGES[props.page] || null);

onMounted(async () => {
  if (!def.value) { error.value = 'Page not found'; loading.value = false; return; }
  title.value = def.value.title;
  document.title = `${def.value.title} — Happy Hour`;
  try {
    if (def.value.kind === 'terms') {
      const { data } = await client.get('/public/terms');
      html.value = renderMd(data.content || '');
      meta.value = `Version ${data.version}${data.updatedAt ? ' · Updated ' + new Date(data.updatedAt).toLocaleDateString('en-US') : ''}`;
    } else {
      const { data } = await client.get(`/public/site-content/${def.value.key}`);
      title.value = data.title || title.value;
      html.value = renderMd(data.content || data.markdown || data.body || '');
      meta.value = data.updatedAt ? `Updated ${new Date(data.updatedAt).toLocaleDateString('en-US')}` : '';
    }
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not load this page right now.';
  } finally { loading.value = false; }
});

function goBack() { if (window.history.length > 1) router.back(); else router.push('/welcome'); }
</script>

<template>
  <div class="min-h-screen bg-cream-100 safe-top pb-16">
    <header class="px-5 pt-4 pb-3 flex items-center bg-white border-b border-cream-200">
      <button @click="goBack" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-cream-200" aria-label="Back">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="flex-1 text-center font-semibold -ml-8">{{ title }}</div>
    </header>

    <main class="max-w-2xl mx-auto px-5 mt-5">
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 6" :key="i" class="h-4 bg-cream-200 rounded animate-pulse" :class="i % 3 === 0 ? 'w-2/3' : 'w-full'"></div>
      </div>
      <div v-else-if="error" class="ios-card p-5 text-coral-600 text-sm">{{ error }}</div>
      <article v-else class="ios-card p-5 md:p-7 text-sm text-ink-700">
        <h1 class="text-2xl font-bold tracking-tight text-ink-900">{{ title }}</h1>
        <div v-if="meta" class="text-xs text-ink-500 mt-1">{{ meta }}</div>
        <div class="mt-4" v-html="html"></div>
      </article>
      <div class="mt-6 text-center text-[11px] text-ink-300">
        Happy Hour · <a href="https://happyhourz.org" class="underline">happyhourz.org</a>
        · <router-link to="/privacy" class="underline">Privacy</router-link>
        · <router-link to="/terms" class="underline">Terms</router-link>
        · <router-link to="/delete-account" class="underline">Delete account</router-link>
      </div>
    </main>
  </div>
</template>
