<script setup>
// Contracts: keep contract texts (paste or import .txt / .docx), send a signing
// link to a merchant, and see signed copies with the drawn signature.
import { computed, onMounted, ref } from 'vue';
import client from '../../api/client';
import { notify } from '../../lib/notify';

const tab = ref('sent');
const templates = ref([]);
const sent = ref([]);
const vendors = ref([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const [t, s, v] = await Promise.all([
      client.get('/admin/contracts/templates'),
      client.get('/admin/contracts/sent'),
      client.get('/admin/vendors').catch(() => ({ data: { items: [] } })),
    ]);
    templates.value = t.data.items;
    sent.value = s.data.items;
    vendors.value = v.data.items || [];
  } finally { loading.value = false; }
}
onMounted(load);

const fmt = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
const STATUS = {
  pending: { label: 'Waiting for signature', cls: 'bg-amber-50 text-amber-700' },
  signed: { label: 'Signed', cls: 'bg-green-100 text-green-700' },
  voided: { label: 'Withdrawn', cls: 'bg-cream-200 text-ink-500' },
};

// ---------- contract texts ----------
const editor = ref(null);          // { _id?, title, body }
const importing = ref(false);
function newTemplate() { editor.value = { title: '', body: '' }; }
function editTemplate(t) { editor.value = { _id: t._id, title: t.title, body: t.body }; }

async function importFile(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  importing.value = true;
  try {
    let text = '';
    if (/\.docx$/i.test(file.name)) {
      const mammoth = (await import('mammoth/mammoth.browser.min.js')).default || window.mammoth;
      const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      text = r.value;
    } else if (/\.(txt|md|text)$/i.test(file.name) || file.type.startsWith('text/')) {
      text = await file.text();
    } else {
      notify('Import a .docx or .txt file. For a PDF, copy the text and paste it here.');
      return;
    }
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!text) { notify('That file has no text in it.'); return; }
    editor.value.body = text;
    if (!editor.value.title) editor.value.title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  } catch {
    notify('Could not read that file. Copy the text and paste it instead.');
  } finally { importing.value = false; }
}

async function saveTemplate() {
  const e = editor.value;
  const body = { title: e.title, body: e.body };
  if (e._id) await client.put(`/admin/contracts/templates/${e._id}`, body);
  else await client.post('/admin/contracts/templates', body);
  editor.value = null;
  notify('Contract saved.', 'success');
  await load();
}

async function archiveTemplate(t) {
  if (!window.confirm(`Remove "${t.title}" from your contracts? Copies already sent keep their text.`)) return;
  await client.delete(`/admin/contracts/templates/${t._id}`);
  await load();
}

// ---------- send ----------
const sendForm = ref(null);
const lastLink = ref(null);
function openSend(t) {
  sendForm.value = { contractId: t?._id || templates.value[0]?._id || '', recipientName: '', recipientEmail: '', vendorId: '', note: '', sendEmail: true };
}
function pickVendor() {
  const v = vendors.value.find((x) => x._id === sendForm.value.vendorId);
  if (v && !sendForm.value.recipientName) sendForm.value.recipientName = v.name;
  if (v && !sendForm.value.recipientEmail && v.email) sendForm.value.recipientEmail = v.email;
}
async function send() {
  const { data } = await client.post('/admin/contracts/sent', sendForm.value);
  sendForm.value = null;
  lastLink.value = { link: data.link, name: data.recipientName, title: data.title, emailed: data.emailed };
  tab.value = 'sent';
  await load();
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); notify('Link copied.', 'success'); } catch { window.prompt('Copy this link:', text); }
}
async function share(item) {
  const text = `Please review and sign "${item.title}" from Happy Hour:`;
  if (navigator.share) {
    try { await navigator.share({ title: item.title, text, url: item.link }); return; } catch { /* closed */ }
  }
  copy(item.link);
}

// ---------- view ----------
const viewing = ref(null);
async function view(item) {
  viewing.value = (await client.get(`/admin/contracts/sent/${item._id}`)).data;
}
async function voidItem(item) {
  if (!window.confirm(`Withdraw the contract sent to ${item.recipientName}? The link will stop working.`)) return;
  await client.post(`/admin/contracts/sent/${item._id}/void`);
  viewing.value = null;
  await load();
}
function printSigned() { window.print(); }

const counts = computed(() => ({
  pending: sent.value.filter((s) => s.status === 'pending').length,
  signed: sent.value.filter((s) => s.status === 'signed').length,
}));
</script>

<template>
  <div class="p-5 md:p-8 max-w-5xl print:hidden">
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Contracts</h1>
        <p class="text-ink-500 mt-1">Send a contract to a merchant to sign on their phone. Signed copies are kept here.</p>
      </div>
      <button class="ios-button-primary" :disabled="!templates.length" @click="openSend()"><i class="fa-solid fa-paper-plane mr-2"></i>Send for signature</button>
    </div>

    <div class="mt-5 inline-flex bg-cream-200 rounded-full p-1">
      <button class="px-4 py-1.5 rounded-full text-sm font-semibold" :class="tab === 'sent' ? 'bg-white shadow-soft' : 'text-ink-500'" @click="tab = 'sent'">Sent · {{ counts.signed }} signed, {{ counts.pending }} waiting</button>
      <button class="px-4 py-1.5 rounded-full text-sm font-semibold" :class="tab === 'templates' ? 'bg-white shadow-soft' : 'text-ink-500'" @click="tab = 'templates'">Contract texts ({{ templates.length }})</button>
    </div>

    <div v-if="lastLink" class="mt-5 ios-card p-5 border-2 border-teal-600/30 bg-teal-50">
      <div class="font-bold text-teal-800"><i class="fa-solid fa-circle-check mr-1"></i>Ready to sign</div>
      <p class="text-sm text-ink-700 mt-1">Send this link to {{ lastLink.name }}<template v-if="lastLink.emailed"> (it was also emailed)</template>. They open it on their phone and sign.</p>
      <div class="mt-3 flex gap-2 flex-wrap">
        <code class="flex-1 min-w-0 truncate rounded-xl bg-white px-3 py-2 text-xs">{{ lastLink.link }}</code>
        <button class="ios-card px-4 text-sm font-semibold text-teal-700" @click="copy(lastLink.link)">Copy</button>
        <button class="ios-card px-4 text-sm font-semibold text-teal-700" @click="share(lastLink)">Share</button>
        <button class="text-sm text-ink-500" @click="lastLink = null">Done</button>
      </div>
    </div>

    <div v-if="loading" class="mt-6 ios-card h-40 animate-pulse"></div>

    <!-- Sent copies -->
    <template v-else-if="tab === 'sent'">
      <div v-if="!sent.length" class="mt-6 ios-card p-8 text-center text-ink-500">
        <template v-if="!templates.length">Start by adding a contract text: <button class="font-semibold text-teal-700 underline" @click="tab = 'templates'; newTemplate()">Add contract</button></template>
        <template v-else>Nothing sent yet.</template>
      </div>
      <div v-else class="mt-6 ios-card divide-y divide-cream-200">
        <div v-for="s in sent" :key="s._id" class="p-4 flex items-center gap-3 flex-wrap">
          <div class="flex-1 min-w-[200px]">
            <div class="font-semibold">{{ s.recipientName }} <span class="text-ink-300 font-normal">· {{ s.title }}</span></div>
            <div class="text-xs text-ink-500 mt-0.5">
              Sent {{ fmt(s.createdAt) }}<template v-if="s.signedAt"> · signed {{ fmt(s.signedAt) }} by {{ s.signer?.name }}</template><template v-else-if="s.viewedAt"> · opened {{ fmt(s.viewedAt) }}</template>
            </div>
          </div>
          <span class="chip text-[11px]" :class="STATUS[s.status].cls">{{ STATUS[s.status].label }}</span>
          <button v-if="s.status === 'pending'" class="text-sm font-semibold text-teal-700" @click="share(s)">Share link</button>
          <button class="text-sm font-semibold text-teal-700" @click="view(s)">View</button>
        </div>
      </div>
    </template>

    <!-- Contract texts -->
    <template v-else>
      <button class="mt-6 ios-card px-4 py-2.5 text-sm font-semibold text-teal-700" @click="newTemplate"><i class="fa-solid fa-plus mr-1.5"></i>Add contract</button>
      <div v-if="templates.length" class="mt-4 ios-card divide-y divide-cream-200">
        <div v-for="t in templates" :key="t._id" class="p-4 flex items-center gap-3 flex-wrap">
          <div class="flex-1 min-w-[200px]">
            <div class="font-semibold">{{ t.title }}</div>
            <div class="text-xs text-ink-500 mt-0.5 line-clamp-1">{{ t.body.slice(0, 140) }}</div>
          </div>
          <button class="text-sm font-semibold text-teal-700" @click="openSend(t)">Send</button>
          <button class="text-sm font-semibold text-ink-500" @click="editTemplate(t)">Edit</button>
          <button class="text-sm font-semibold text-coral-600" @click="archiveTemplate(t)">Remove</button>
        </div>
      </div>
    </template>
  </div>

  <!-- Editor -->
  <div v-if="editor" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center print:hidden" @click.self="editor = null">
    <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-3xl shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between">
        <div class="text-xl font-bold">{{ editor._id ? 'Edit contract' : 'Add contract' }}</div>
        <button class="text-ink-500" @click="editor = null">Cancel</button>
      </div>
      <p v-if="editor._id" class="text-xs text-ink-500 mt-1">Changes apply to copies you send from now on. Copies already sent or signed keep their original text.</p>
      <div class="mt-4 space-y-3">
        <input v-model="editor.title" class="input" placeholder="Title, e.g. Happy Hour Merchant Agreement" />
        <label class="flex items-center gap-2 ios-card px-4 py-3 cursor-pointer text-sm font-semibold text-teal-700">
          <i class="fa-solid fa-file-import"></i>{{ importing ? 'Reading…' : 'Import from a file (.docx or .txt)' }}
          <input type="file" accept=".docx,.txt,.md,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="hidden" @change="importFile" />
        </label>
        <textarea v-model="editor.body" rows="16" class="input font-mono text-sm leading-relaxed" placeholder="Or paste the contract text here"></textarea>
        <button class="ios-button-primary w-full" :disabled="!editor.title || editor.body.length < 20" @click="saveTemplate">Save contract</button>
      </div>
    </div>
  </div>

  <!-- Send -->
  <div v-if="sendForm" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center print:hidden" @click.self="sendForm = null">
    <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)]">
      <div class="flex items-center justify-between">
        <div class="text-xl font-bold">Send for signature</div>
        <button class="text-ink-500" @click="sendForm = null">Cancel</button>
      </div>
      <div class="mt-4 space-y-3">
        <select v-model="sendForm.contractId" class="input">
          <option v-for="t in templates" :key="t._id" :value="t._id">{{ t.title }}</option>
        </select>
        <select v-model="sendForm.vendorId" class="input" @change="pickVendor">
          <option value="">Restaurant (optional)</option>
          <option v-for="v in vendors" :key="v._id" :value="v._id">{{ v.name }}</option>
        </select>
        <input v-model="sendForm.recipientName" class="input" placeholder="Signer or business name" />
        <input v-model="sendForm.recipientEmail" type="email" class="input" placeholder="Email (optional)" />
        <label v-if="sendForm.recipientEmail" class="flex items-center gap-2 text-sm text-ink-700"><input v-model="sendForm.sendEmail" type="checkbox" class="accent-teal-700" /> Also email them the link</label>
        <button class="ios-button-primary w-full" :disabled="!sendForm.contractId || !sendForm.recipientName.trim()" @click="send">Create signing link</button>
        <p class="text-xs text-ink-500">You'll get a link to text or share with them. Anyone with the link can sign, so send it only to the signer.</p>
      </div>
    </div>
  </div>

  <!-- Signed / pending copy -->
  <div v-if="viewing" class="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center print:static print:bg-white print:block" @click.self="viewing = null">
    <div class="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-3xl shadow-lift p-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
      <div class="flex items-center justify-between gap-2 print:hidden">
        <span class="chip text-[11px]" :class="STATUS[viewing.status].cls">{{ STATUS[viewing.status].label }}</span>
        <div class="flex gap-3">
          <button v-if="viewing.status === 'signed'" class="text-sm font-semibold text-teal-700" @click="printSigned"><i class="fa-solid fa-print mr-1"></i>Print / PDF</button>
          <button v-if="viewing.status === 'pending'" class="text-sm font-semibold text-teal-700" @click="share(viewing)">Share link</button>
          <button v-if="viewing.status === 'pending'" class="text-sm font-semibold text-coral-600" @click="voidItem(viewing)">Withdraw</button>
          <button class="text-ink-500" @click="viewing = null">Close</button>
        </div>
      </div>
      <h2 class="mt-4 text-2xl font-bold">{{ viewing.title }}</h2>
      <div class="text-sm text-ink-500 mt-1">For {{ viewing.recipientName }}<template v-if="viewing.vendorId?.name"> · {{ viewing.vendorId.name }}</template></div>
      <div class="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900 border-y border-cream-200 py-5">{{ viewing.body }}</div>
      <div v-if="viewing.status === 'signed'" class="mt-5 grid md:grid-cols-2 gap-5 items-end">
        <div>
          <div class="text-xs uppercase tracking-wider font-semibold text-ink-500">Signature</div>
          <img :src="viewing.signatureImage" alt="Signature" class="mt-2 h-28 w-full object-contain object-left border-b-2 border-ink-900" />
          <div class="mt-2 font-semibold">{{ viewing.signer?.name }}<template v-if="viewing.signer?.title">, {{ viewing.signer.title }}</template></div>
        </div>
        <div class="text-xs text-ink-500 space-y-1">
          <div><b class="text-ink-700">Signed:</b> {{ fmt(viewing.signedAt) }}</div>
          <div v-if="viewing.signer?.email"><b class="text-ink-700">Email:</b> {{ viewing.signer.email }}</div>
          <div><b class="text-ink-700">IP address:</b> {{ viewing.signedIp }}</div>
          <div class="break-words"><b class="text-ink-700">Device:</b> {{ viewing.signedUserAgent }}</div>
          <div><b class="text-ink-700">Document check:</b> {{ viewing.intact ? 'text unchanged since it was sent' : 'TEXT DOES NOT MATCH' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
