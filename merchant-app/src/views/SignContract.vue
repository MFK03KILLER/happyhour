<script setup>
// Public signing page (opened from the link the admin sends). Read the
// contract, type your name, draw your signature with a finger, agree, sign.
import { nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import client from '../api/client';

const route = useRoute();
const token = String(route.params.token || '');
const doc = ref(null);
const loadError = ref('');
const name = ref('');
const title = ref('');
const email = ref('');
const agree = ref(false);
const error = ref('');
const signing = ref(false);
const done = ref(false);

// ---- signature pad
const canvas = ref(null);
const hasInk = ref(false);
let ctx = null;
let drawing = false;
let last = null;

function setupCanvas() {
  const c = canvas.value;
  if (!c) return;
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const rect = c.getBoundingClientRect();
  c.width = rect.width * ratio;
  c.height = rect.height * ratio;
  ctx = c.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0F172A';
  hasInk.value = false;
}
function point(e) {
  const r = canvas.value.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function down(e) {
  e.preventDefault();
  canvas.value.setPointerCapture?.(e.pointerId);
  drawing = true;
  last = point(e);
  ctx.beginPath();
  ctx.arc(last.x, last.y, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#0F172A';
  ctx.fill();
}
function move(e) {
  if (!drawing) return;
  e.preventDefault();
  const p = point(e);
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.quadraticCurveTo(last.x, last.y, (last.x + p.x) / 2, (last.y + p.y) / 2);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
  hasInk.value = true;
}
function up() { drawing = false; }

const full = ref(false);
const fullCanvas = ref(null);
let fctx = null;
let fdrawing = false;
let flast = null;
const fullInk = ref(false);
async function openFull() {
  full.value = true;
  await nextTick();
  const c = fullCanvas.value;
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const r = c.getBoundingClientRect();
  c.width = r.width * ratio;
  c.height = r.height * ratio;
  fctx = c.getContext('2d');
  fctx.scale(ratio, ratio);
  fctx.lineWidth = 3.4;
  fctx.lineCap = 'round';
  fctx.lineJoin = 'round';
  fctx.strokeStyle = '#0F172A';
  fullInk.value = false;
}
function fpoint(e) { const r = fullCanvas.value.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function fdown(e) { e.preventDefault(); fullCanvas.value.setPointerCapture?.(e.pointerId); fdrawing = true; flast = fpoint(e); }
function fmove(e) {
  if (!fdrawing) return;
  e.preventDefault();
  const p = fpoint(e);
  fctx.beginPath();
  fctx.moveTo(flast.x, flast.y);
  fctx.lineTo(p.x, p.y);
  fctx.stroke();
  flast = p;
  fullInk.value = true;
}
function fup() { fdrawing = false; }
function fclear() { const c = fullCanvas.value; fctx.clearRect(0, 0, c.width, c.height); fullInk.value = false; }
// Copy the big signature into the form's box (scaled to fit, trimmed of empty space).
function useFull() {
  if (!fullInk.value) { full.value = false; return; }
  const src = fullCanvas.value;
  const sctx = src.getContext('2d');
  const { width: w, height: h } = src;
  const px = sctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    if (px[(y * w + x) * 4 + 3] > 10) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const pad = 12;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w, maxX + pad); maxY = Math.min(h, maxY + pad);
  const dst = canvas.value;
  const dctx = dst.getContext('2d');
  dctx.save();
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.clearRect(0, 0, dst.width, dst.height);
  const scale = Math.min(dst.width / (maxX - minX), dst.height / (maxY - minY)) * 0.9;
  const dw = (maxX - minX) * scale;
  const dh = (maxY - minY) * scale;
  dctx.drawImage(src, minX, minY, maxX - minX, maxY - minY, (dst.width - dw) / 2, (dst.height - dh) / 2, dw, dh);
  dctx.restore();
  hasInk.value = true;
  full.value = false;
}
function clearPad() {
  const c = canvas.value;
  ctx.clearRect(0, 0, c.width, c.height);
  hasInk.value = false;
}

// White background so the stored PNG looks right everywhere.
function signatureImage() {
  const c = canvas.value;
  const out = document.createElement('canvas');
  out.width = c.width;
  out.height = c.height;
  const o = out.getContext('2d');
  o.fillStyle = '#fff';
  o.fillRect(0, 0, out.width, out.height);
  o.drawImage(c, 0, 0);
  return out.toDataURL('image/png');
}

onMounted(async () => {
  try {
    doc.value = (await client.get(`/public/contracts/${encodeURIComponent(token)}`)).data;
    name.value = '';
    email.value = doc.value.recipientEmail || '';
    if (doc.value.status === 'pending') {
      await nextTick();
      setupCanvas();
      window.addEventListener('resize', () => { if (!hasInk.value) setupCanvas(); });
    }
  } catch (e) {
    loadError.value = e.response?.data?.error?.message || 'This signing link is not valid.';
  }
});

async function sign() {
  error.value = '';
  if (name.value.trim().length < 2) { error.value = 'Type your full name.'; return; }
  if (!hasInk.value) { error.value = 'Draw your signature in the box.'; return; }
  if (!agree.value) { error.value = 'Tick the box to agree to the contract.'; return; }
  signing.value = true;
  try {
    await client.post(`/public/contracts/${encodeURIComponent(token)}/sign`, {
      name: name.value.trim(), title: title.value.trim() || undefined, email: email.value.trim() || '',
      agree: true, signature: signatureImage(),
    }, { silent: true });
    done.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    error.value = e.response?.data?.error?.message || 'Could not sign. Check your connection and try again.';
  } finally { signing.value = false; }
}
</script>

<template>
  <div class="min-h-screen bg-cream-100 text-ink-900 safe-top pb-16">
    <header class="bg-gradient-to-br from-teal-700 to-teal-800 text-white px-5 pt-6 pb-6">
      <div class="max-w-2xl mx-auto flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
        </div>
        <div>
          <div class="text-xs uppercase tracking-wider opacity-80 font-semibold">Happy Hour</div>
          <div class="font-bold">Contract for signature</div>
        </div>
      </div>
    </header>

    <div class="max-w-2xl mx-auto px-5">
      <div v-if="loadError" class="mt-8 ios-card p-6 text-center">
        <div class="text-lg font-bold">Link not valid</div>
        <p class="text-ink-500 mt-1">{{ loadError }} Ask Happy Hour for a new link.</p>
      </div>
      <div v-else-if="!doc" class="mt-8 ios-card h-64 animate-pulse"></div>

      <template v-else>
        <div v-if="done || doc.status === 'signed'" class="mt-6 ios-card p-6 text-center border-2 border-green-300">
          <div class="mx-auto w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><i class="fa-solid fa-check text-2xl"></i></div>
          <div class="mt-3 text-xl font-bold">Signed. Thank you!</div>
          <p class="text-ink-500 mt-1 text-sm">
            <template v-if="doc.signedAt && !done">Signed by {{ doc.signer?.name }} on {{ new Date(doc.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}.</template>
            <template v-else>Happy Hour has received your signed contract. You can close this page.</template>
          </p>
        </div>
        <div v-else-if="doc.status === 'voided'" class="mt-6 ios-card p-6 text-center">
          <div class="text-lg font-bold">This contract was withdrawn</div>
          <p class="text-ink-500 mt-1 text-sm">Contact Happy Hour if you still need to sign.</p>
        </div>

        <h1 class="mt-6 text-2xl font-bold tracking-tight">{{ doc.title }}</h1>
        <p class="text-sm text-ink-500 mt-1">Prepared for {{ doc.recipientName }}</p>
        <article class="mt-4 ios-card p-5 whitespace-pre-wrap text-[15px] leading-relaxed">{{ doc.body }}</article>

        <form v-if="doc.status === 'pending' && !done" novalidate class="mt-6 ios-card p-5 space-y-3" @submit.prevent="sign">
          <div class="text-lg font-bold">Sign</div>
          <input v-model="name" class="input" autocomplete="name" placeholder="Your full name" />
          <input v-model="title" class="input" autocomplete="organization-title" placeholder="Your title (e.g. Owner) — optional" />
          <input v-model="email" type="email" class="input" autocomplete="email" placeholder="Email — optional" />
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase tracking-wider font-semibold text-ink-500">Draw your signature</span>
              <span class="flex gap-4">
                <button type="button" class="text-xs font-semibold text-teal-700" @click="openFull"><i class="fa-solid fa-expand mr-1"></i>Sign full screen</button>
                <button type="button" class="text-xs font-semibold text-teal-700" @click="clearPad">Clear</button>
              </span>
            </div>
            <canvas
              ref="canvas"
              class="mt-1 w-full h-44 rounded-2xl bg-white border-2 border-dashed border-ink-300/50 touch-none cursor-crosshair"
              @pointerdown="down" @pointermove="move" @pointerup="up" @pointerleave="up" @pointercancel="up"
            ></canvas>
          </div>
          <label class="flex items-start gap-3 text-sm">
            <input v-model="agree" type="checkbox" class="mt-1 w-5 h-5 accent-teal-700" />
            <span>I have read this contract and agree to its terms. I understand that typing my name and drawing my signature here is my legal electronic signature.</span>
          </label>
          <div v-if="error" class="rounded-2xl bg-coral-500/10 border border-coral-500/30 px-4 py-3 text-sm text-coral-700">{{ error }}</div>
          <button type="submit" :disabled="signing" class="ios-button-primary w-full disabled:opacity-60">{{ signing ? 'Signing…' : 'Sign contract' }}</button>
        </form>
      </template>
    </div>

    <!-- Full-screen signing: a big white page, sign with your finger -->
    <div v-if="full" class="fixed inset-0 z-[90] bg-white flex flex-col" style="padding-top: max(env(safe-area-inset-top), 12px); padding-bottom: max(env(safe-area-inset-bottom), 12px)">
      <div class="px-5 flex items-center justify-between">
        <button type="button" class="text-ink-500 font-semibold py-2" @click="full = false">Cancel</button>
        <div class="font-bold">Sign with your finger</div>
        <button type="button" class="text-teal-700 font-bold py-2" @click="useFull">Done</button>
      </div>
      <div class="relative flex-1 m-4">
        <canvas ref="fullCanvas" class="absolute inset-0 w-full h-full rounded-3xl border-2 border-dashed border-ink-300/50 touch-none" @pointerdown="fdown" @pointermove="fmove" @pointerup="fup" @pointerleave="fup" @pointercancel="fup"></canvas>
        <div v-if="!fullInk" class="pointer-events-none absolute inset-0 flex items-center justify-center text-ink-300 text-lg">Sign here</div>
        <div class="pointer-events-none absolute left-8 right-8 bottom-16 border-b-2 border-ink-300/60"></div>
        <div class="pointer-events-none absolute left-8 bottom-6 text-ink-300 text-2xl">✕</div>
      </div>
      <div class="px-5 flex justify-between text-sm">
        <span class="text-ink-500">Tip: turn your phone sideways for more room.</span>
        <button type="button" class="font-semibold text-teal-700" @click="fclear">Clear</button>
      </div>
    </div>
  </div>
</template>
