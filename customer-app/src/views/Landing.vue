<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();
const billing = ref('monthly');

const features = [
  { icon: 'sparkles', title: 'Hand-picked offers', text: 'Curated by locals at neighborhood spots, not anonymous discount mills.' },
  { icon: 'qr', title: 'Tap-to-redeem QR', text: 'Show your code at checkout. Rotates every 60s — secure and screenshot-proof.' },
  { icon: 'star', title: 'Up to 50% off', text: 'BOGO meals, free coffee, half-price entertainment. Real value, every day.' },
  { icon: 'wallet', title: 'One subscription, all spots', text: 'Pay once a month, unlock every coupon from every partner — no surprises.' },
];

const partners = [
  { name: 'Pizza My Heart', cat: 'Italian', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300' },
  { name: 'Bay Brew Coffee', cat: 'Café', img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=300' },
  { name: 'Skyline Bowling', cat: 'Entertainment', img: 'https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=300' },
  { name: 'Iron Forge Gym', cat: 'Fitness', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300' },
  { name: 'Sunset Cinema', cat: 'Cinema', img: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=300' },
  { name: 'Coastal Tacos', cat: 'Mexican', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300' },
];

const testimonials = [
  { name: 'Sarah J.', city: 'San Francisco', text: 'Paid for itself the first week. The Pizza My Heart BOGO alone covered three months.', stars: 5 },
  { name: 'Marcus T.', city: 'Palo Alto', text: 'Finally a coupon app that doesn\'t feel sketchy. Clean design, real local spots.', stars: 5 },
  { name: 'Aisha P.', city: 'San Jose', text: 'Use it almost every weekend. The QR scanner at merchants is instant.', stars: 5 },
];
</script>

<template>
  <div class="min-h-screen bg-cream-100 text-ink-900 overflow-x-hidden">
    <!-- Sticky nav -->
    <nav class="sticky top-0 z-50 glass border-b border-white/40">
      <div class="max-w-6xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-soft">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <span class="font-bold text-lg tracking-tight">Happy Hour</span>
        </div>
        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-ink-700">
          <a href="#features" class="hover:text-teal-700 transition">Features</a>
          <a href="#partners" class="hover:text-teal-700 transition">Partners</a>
          <a href="#pricing" class="hover:text-teal-700 transition">Pricing</a>
          <a href="#faq" class="hover:text-teal-700 transition">FAQ</a>
        </div>
        <div class="flex items-center gap-2">
          <button @click="router.push('/login')" class="text-sm font-semibold px-3 py-2 rounded-full hover:bg-cream-200 transition">Sign in</button>
          <button @click="router.push('/register')" class="text-sm font-semibold px-4 py-2 rounded-full bg-ink-900 text-white active:scale-95 transition">Get started</button>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-32 -right-24 w-[500px] h-[500px] rounded-full bg-coral-500/10 blur-3xl"></div>
        <div class="absolute top-40 -left-32 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-3xl"></div>
      </div>

      <div class="relative max-w-6xl mx-auto px-5 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span class="chip bg-coral-500/10 text-coral-600 font-bold">
            <span class="inline-block w-2 h-2 rounded-full bg-coral-500 animate-pulse"></span>
            Now live in the Bay Area
          </span>
          <h1 class="mt-5 text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Save up to <span class="text-coral-500">50%</span><br />
            at your favorite spots.
          </h1>
          <p class="mt-5 text-lg text-ink-500 leading-relaxed max-w-md">
            Happy Hour is America's friendliest coupon club. One $4.99 subscription unlocks BOGO meals, free coffee, and half-price entertainment at hundreds of local merchants.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row gap-3">
            <button @click="router.push('/register')" class="rounded-full font-semibold text-white bg-coral-500 px-7 py-4 active:scale-[.97] transition shadow-lift">
              Start saving — $4.99/mo
            </button>
            <button @click="router.push('/login')" class="rounded-full font-semibold text-ink-900 bg-white border border-ink-300/40 px-7 py-4 active:scale-[.97] transition">
              I already have an account
            </button>
          </div>
          <div class="mt-6 flex items-center gap-2 text-sm text-ink-500">
            <div class="flex -space-x-2">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 border-2 border-cream-100"></div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-700 border-2 border-cream-100"></div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 border-2 border-cream-100"></div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-cream-100"></div>
            </div>
            <span><span class="font-semibold text-ink-700">12,400+</span> people saving every weekend</span>
          </div>
        </div>

        <!-- iPhone mockup -->
        <div class="flex justify-center lg:justify-end">
          <div class="relative">
            <div class="absolute -inset-6 bg-gradient-to-br from-teal-500/20 to-coral-500/20 rounded-[60px] blur-2xl"></div>
            <div class="relative w-[300px] h-[620px] rounded-[44px] border-[10px] border-ink-900 shadow-[0_30px_80px_rgba(0,0,0,.3)] overflow-hidden bg-cream-100">
              <div class="absolute top-2 inset-x-0 z-10 flex justify-center">
                <div class="h-6 w-28 rounded-full bg-ink-900"></div>
              </div>
              <div class="h-full pt-8 px-4 pb-4 overflow-hidden">
                <div class="text-xs text-ink-500 font-medium pl-1">Friday, May 21</div>
                <div class="text-xl font-bold mt-0.5 pl-1">Hi, Sarah 👋</div>

                <div class="mt-4 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 text-white p-5 shadow-lift relative overflow-hidden">
                  <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10"></div>
                  <div class="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Save up to</div>
                  <div class="text-3xl font-bold mt-1">50% off</div>
                  <div class="text-xs opacity-90 mt-1">At your favorite places.</div>
                </div>

                <div class="mt-4 ios-card overflow-hidden">
                  <div class="relative aspect-[16/10]">
                    <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-2 left-3 right-3 text-white">
                      <div class="text-[10px] uppercase font-bold tracking-wider opacity-90">Pizza My Heart</div>
                      <div class="text-base font-bold leading-tight">Morning Slices</div>
                    </div>
                  </div>
                  <div class="px-3 py-2.5 flex items-center justify-between">
                    <div class="text-xs text-ink-500">Two slices + drink</div>
                    <div class="text-sm font-bold text-teal-700">Free for members</div>
                  </div>
                </div>

                <div class="mt-3 ios-card overflow-hidden">
                  <div class="relative aspect-[16/10]">
                    <img src="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-2 left-3 right-3 text-white">
                      <div class="text-[10px] uppercase font-bold tracking-wider opacity-90">Bay Brew Coffee</div>
                      <div class="text-base font-bold leading-tight">Cold Brew Flight</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust strip -->
    <section class="py-8 bg-white border-y border-cream-200">
      <div class="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div class="text-3xl font-bold text-teal-700">$847</div>
          <div class="text-xs text-ink-500 mt-1">Avg yearly savings</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-teal-700">200+</div>
          <div class="text-xs text-ink-500 mt-1">Local merchants</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-teal-700">4.9★</div>
          <div class="text-xs text-ink-500 mt-1">App Store rating</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-teal-700">12,400+</div>
          <div class="text-xs text-ink-500 mt-1">Happy members</div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-20 max-w-6xl mx-auto px-5 lg:px-8">
      <div class="text-center max-w-xl mx-auto">
        <span class="chip bg-teal-50 text-teal-700">What you get</span>
        <h2 class="mt-4 text-4xl font-bold tracking-tight">Made for real life, not Black Friday.</h2>
        <p class="mt-3 text-ink-500">No coupon hunting. No fine print. Just one app for everywhere you go.</p>
      </div>

      <div class="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="f in features" :key="f.title" class="ios-card p-6">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-soft">
            <svg v-if="f.icon==='sparkles'" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            <svg v-if="f.icon==='qr'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M20 14v3M14 20h3M20 20v.01"/></svg>
            <svg v-if="f.icon==='star'" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            <svg v-if="f.icon==='wallet'" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><circle cx="17" cy="14" r="1.4"/></svg>
          </div>
          <h3 class="mt-5 font-bold text-lg">{{ f.title }}</h3>
          <p class="mt-2 text-sm text-ink-500 leading-relaxed">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <!-- Partners -->
    <section id="partners" class="py-20 bg-white border-y border-cream-200">
      <div class="max-w-6xl mx-auto px-5 lg:px-8">
        <div class="text-center max-w-xl mx-auto">
          <span class="chip bg-coral-500/10 text-coral-600">Our partners</span>
          <h2 class="mt-4 text-4xl font-bold tracking-tight">Spots you actually want to go to.</h2>
          <p class="mt-3 text-ink-500">Hand-picked local favorites. No chains pretending to be local.</p>
        </div>
        <div class="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div v-for="p in partners" :key="p.name" class="ios-card overflow-hidden text-center">
            <div class="aspect-square overflow-hidden">
              <img :src="p.img" :alt="p.name" class="w-full h-full object-cover" />
            </div>
            <div class="p-3">
              <div class="font-semibold text-sm leading-tight">{{ p.name }}</div>
              <div class="text-[11px] text-ink-500 mt-0.5">{{ p.cat }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="py-20 max-w-5xl mx-auto px-5 lg:px-8">
      <div class="text-center">
        <span class="chip bg-teal-50 text-teal-700">Pricing</span>
        <h2 class="mt-4 text-4xl font-bold tracking-tight">One plan. Everything unlocked.</h2>
        <p class="mt-3 text-ink-500">Cancel any time. No fine print.</p>
      </div>

      <div class="mt-10 flex items-center justify-center">
        <div class="inline-flex bg-cream-200 rounded-full p-1">
          <button
            @click="billing='monthly'"
            class="px-5 py-2 rounded-full text-sm font-semibold transition"
            :class="billing==='monthly' ? 'bg-white shadow-soft' : 'text-ink-500'"
          >Monthly</button>
          <button
            @click="billing='yearly'"
            class="px-5 py-2 rounded-full text-sm font-semibold transition"
            :class="billing==='yearly' ? 'bg-white shadow-soft' : 'text-ink-500'"
          >Yearly · save 30%</button>
        </div>
      </div>

      <div class="mt-10 max-w-md mx-auto ios-card p-8 relative overflow-hidden">
        <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-coral-500/10"></div>
        <div class="relative">
          <div class="flex items-center justify-between">
            <span class="chip bg-coral-500 text-white">Most popular</span>
            <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">All access</span>
          </div>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-5xl font-bold tracking-tight">${{ billing==='monthly' ? '4.99' : '41.99' }}</span>
            <span class="text-ink-500">/ {{ billing==='monthly' ? 'month' : 'year' }}</span>
          </div>
          <div v-if="billing==='yearly'" class="text-sm text-coral-600 font-semibold mt-1">~$3.50/mo · save $18</div>

          <ul class="mt-6 space-y-3 text-sm">
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Unlimited coupon redemptions</li>
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Every merchant unlocked</li>
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Secure rotating QR codes</li>
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Apple Pay, Google Pay, or card</li>
            <li class="flex gap-2"><span class="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">✓</span> Cancel anytime</li>
          </ul>

          <button @click="router.push('/register')" class="ios-button-primary w-full mt-7 text-base">
            Start saving today
          </button>
          <div class="text-center text-xs text-ink-300 mt-3">7-day money-back guarantee</div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-20 bg-white border-y border-cream-200">
      <div class="max-w-6xl mx-auto px-5 lg:px-8">
        <div class="text-center max-w-xl mx-auto">
          <span class="chip bg-teal-50 text-teal-700">Loved by members</span>
          <h2 class="mt-4 text-4xl font-bold tracking-tight">Real savings, real reviews.</h2>
        </div>
        <div class="mt-12 grid md:grid-cols-3 gap-5">
          <div v-for="t in testimonials" :key="t.name" class="ios-card p-6">
            <div class="flex gap-0.5 text-yellow-400 mb-3">
              <svg v-for="n in t.stars" :key="n" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
            </div>
            <p class="text-ink-700 leading-relaxed">"{{ t.text }}"</p>
            <div class="mt-4 flex items-center gap-2">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold">{{ t.name.charAt(0) }}</div>
              <div>
                <div class="font-semibold text-sm">{{ t.name }}</div>
                <div class="text-xs text-ink-500">{{ t.city }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-20 max-w-3xl mx-auto px-5 lg:px-8">
      <div class="text-center">
        <h2 class="text-4xl font-bold tracking-tight">Questions, answered.</h2>
      </div>
      <div class="mt-10 space-y-3">
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">How does it work? <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">Sign up, pay $4.99/mo, and start redeeming. Browse offers, claim what you want, show the rotating QR code at the merchant. They scan, you save.</p>
        </details>
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">Can I cancel anytime? <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">Yes. Cancel any time from your profile. You'll keep access until the end of your billing period.</p>
        </details>
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">Where do you operate? <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">Currently the SF Bay Area — Redwood City, Palo Alto, San Francisco, San Jose, and Mountain View. New cities coming soon.</p>
        </details>
        <details class="ios-card p-5 group">
          <summary class="font-semibold cursor-pointer list-none flex justify-between items-center">Is my payment info safe? <span class="text-ink-300 group-open:rotate-45 transition">+</span></summary>
          <p class="text-ink-500 mt-3 text-sm leading-relaxed">We never store card numbers. All payments go through Apple Pay, Google Pay, or Stripe.</p>
        </details>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="relative py-20">
      <div class="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-800 to-ink-900"></div>
      <div class="relative max-w-3xl mx-auto px-5 text-center text-white">
        <h2 class="text-4xl lg:text-5xl font-bold tracking-tight">Ready to save?</h2>
        <p class="mt-4 text-cream-50/80 text-lg">Join 12,400+ members and start saving this weekend.</p>
        <button @click="router.push('/register')" class="mt-8 rounded-full font-semibold text-ink-900 bg-coral-500 hover:bg-coral-400 px-8 py-4 active:scale-[.97] transition shadow-lift">
          Start saving — $4.99/mo
        </button>
        <div class="mt-3 text-xs text-white/60">7-day money-back guarantee · Cancel anytime</div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-10 bg-ink-900 text-white/70">
      <div class="max-w-6xl mx-auto px-5 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/></svg>
          </div>
          <span class="font-bold text-white">Happy Hour</span>
        </div>
        <div class="text-sm">© 2026 Happy Hour Inc. · Demo build</div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
details summary::-webkit-details-marker { display: none; }
</style>
