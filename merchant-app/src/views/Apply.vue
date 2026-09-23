<script setup>
// Public partner application. Anyone running a venue can learn how the programme
// works and apply, without an account - accounts are issued once a venue is
// approved. This is the merchant app's public-audience feature (App Review 3.2).
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import client from '../api/client';

const router = useRouter();
const SUPPORT_EMAIL = 'business9776@gmail.com';

const CATEGORIES = [
  ['dining', 'Restaurant'],
  ['cafe', 'Cafe'],
  ['bar', 'Bar'],
  ['bakery', 'Bakery'],
  ['activities', 'Activities & entertainment'],
  ['wellness', 'Wellness'],
  ['hotels', 'Hotel'],
  ['services', 'Services'],
  ['other', 'Other'],
];

const form = reactive({
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  city: '',
  category: 'dining',
  locations: 1,
  message: '',
  website: '', // honeypot - hidden from people
});
const sending = ref(false);
const sent = ref(false);
const error = ref('');

async function submit() {
  sending.value = true;
  error.value = '';
  try {
    await client.post('/public/partner-applications', { ...form, locations: Number(form.locations) || 1 });
    sent.value = true;
  } catch (e) {
    const fields = e.response?.data?.error?.details?.fieldErrors;
    if (fields && Object.keys(fields).length) {
      const [field] = Object.keys(fields);
      const label = { businessName: 'Business name', contactName: 'Your name', email: 'Email' }[field] || field;
      error.value = `${label}: ${fields[field][0]}`;
    } else {
      error.value = e.response?.data?.error?.message || 'Could not send your application. Check your connection and try again.';
    }
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-teal-700 via-teal-800 to-ink-900 text-white safe-top px-6 pb-12">
    <div class="max-w-lg mx-auto">
      <header class="pt-4 flex items-center">
        <button @click="router.push('/login')" aria-label="Back to sign in" class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-white/10">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
      </header>

      <!-- Sent -->
      <div v-if="sent" class="pt-16 text-center">
        <div class="w-16 h-16 mx-auto rounded-full bg-white/15 flex items-center justify-center">
          <i class="fa-solid fa-check text-2xl"></i>
        </div>
        <h1 class="mt-5 text-2xl font-bold tracking-tight">Application received</h1>
        <p class="mt-2 text-cream-50/80 leading-relaxed">
          Thanks, {{ form.contactName.split(' ')[0] }}. We review every venue personally and will email
          <b class="text-white">{{ form.email }}</b> within two business days.
        </p>
        <button @click="router.push('/login')" class="mt-8 w-full rounded-full font-semibold bg-coral-500 text-white py-3.5 active:scale-[.97] transition">
          Back to sign in
        </button>
      </div>

      <!-- Form -->
      <template v-else>
        <h1 class="mt-2 text-3xl font-bold tracking-tight">Become a partner</h1>
        <p class="mt-2 text-cream-50/80 leading-relaxed">
          Happy Hour sends paying members to independent venues during the hours you most want to fill.
        </p>

        <ul class="mt-6 space-y-3">
          <li class="flex gap-3">
            <i class="fa-solid fa-clock text-coral-400 mt-1 w-5 text-center"></i>
            <span class="text-sm text-cream-50/90"><b class="text-white">Fill quiet hours.</b> Members look for deals in the 2–5 PM window.</span>
          </li>
          <li class="flex gap-3">
            <i class="fa-solid fa-sliders text-coral-400 mt-1 w-5 text-center"></i>
            <span class="text-sm text-cream-50/90"><b class="text-white">You set the offer and the hours.</b> Pause any time. No upfront cost.</span>
          </li>
          <li class="flex gap-3">
            <i class="fa-solid fa-qrcode text-coral-400 mt-1 w-5 text-center"></i>
            <span class="text-sm text-cream-50/90"><b class="text-white">Scan in a second.</b> Staff scan the member's code with this app. No paper, no codes to type.</span>
          </li>
        </ul>

        <form @submit.prevent="submit" class="mt-8 space-y-3" novalidate>
          <input v-model="form.businessName" type="text" required maxlength="120" autocomplete="organization"
                 class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="Business name" />
          <input v-model="form.contactName" type="text" required maxlength="100" autocomplete="name"
                 class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="Your name" />
          <input v-model="form.email" type="email" required maxlength="160" autocomplete="email"
                 class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="Work email" />
          <div class="grid grid-cols-2 gap-3">
            <input v-model="form.phone" type="tel" maxlength="40" autocomplete="tel"
                   class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="Phone (optional)" />
            <input v-model="form.city" type="text" maxlength="80" autocomplete="address-level2"
                   class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500" placeholder="City" />
          </div>
          <div class="grid grid-cols-[1fr_7rem] gap-3">
            <label class="block">
              <span class="sr-only">Type of venue</span>
              <select v-model="form.category"
                      class="input bg-white/15 text-white border-white/20 focus:border-coral-500">
                <option v-for="[v, l] in CATEGORIES" :key="v" :value="v" class="text-ink-900">{{ l }}</option>
              </select>
            </label>
            <label class="block">
              <span class="sr-only">Number of locations</span>
              <input v-model="form.locations" type="number" min="1" max="500" inputmode="numeric"
                     class="input bg-white/15 text-white border-white/20 focus:border-coral-500" aria-label="Locations" />
            </label>
          </div>
          <textarea v-model="form.message" rows="3" maxlength="1000"
                    class="input bg-white/15 text-white border-white/20 placeholder:text-white/50 focus:border-coral-500 resize-none"
                    placeholder="Anything we should know? (optional)"></textarea>

          <!-- Honeypot: invisible to people and screen readers -->
          <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"
                 class="absolute -left-[9999px] w-px h-px opacity-0" />

          <div v-if="error" class="bg-coral-500/20 border border-coral-400/40 text-coral-100 rounded-2xl px-4 py-3 text-sm">{{ error }}</div>

          <button type="submit" :disabled="sending"
                  class="w-full rounded-full font-semibold bg-coral-500 hover:bg-coral-600 text-white py-3.5 active:scale-[.97] transition shadow-soft disabled:opacity-60">
            {{ sending ? 'Sending…' : 'Send application' }}
          </button>
          <p class="text-xs text-center text-cream-50/60 pt-1">
            We only use these details to review your application.
          </p>
        </form>

        <p class="mt-8 text-center text-sm text-cream-50/70">
          Questions? <a :href="`mailto:${SUPPORT_EMAIL}`" class="text-white underline break-all">{{ SUPPORT_EMAIL }}</a>
        </p>
      </template>
    </div>
  </div>
</template>
