<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Capacitor } from '@capacitor/core';
import { goBack } from './utils/goBack';
import { useToastStore } from './stores/toast';
import BottomTabBar from './components/BottomTabBar.vue';
import DesktopFrame from './components/DesktopFrame.vue';
import SplashScreen from './components/SplashScreen.vue';
import ToastContainer from './components/ToastContainer.vue';
import OnboardingModal from './components/OnboardingModal.vue';
import Footer from './components/Footer.vue';
import { useFlagsStore } from './stores/flags';
import { usePricingStore } from './stores/pricing';
import { useGeolocation } from './composables/useGeolocation';
import { useAuthStore } from './stores/auth';

const route = useRoute();
const router = useRouter();
const isNative = Capacitor.isNativePlatform();
const flagsStore = useFlagsStore();
const auth = useAuthStore();
// The post-checkout page opens inside the native app's browser sheet: no splash,
// no location prompt there.
const bare = window.location.pathname.startsWith('/checkout-done');
const showSplash = ref(!bare && sessionStorage.getItem('hh_splash_shown') !== '1');
const showOnboarding = ref(false);
const { coords, status: geoStatus, request: requestGeo } = useGeolocation();

onMounted(() => {
  flagsStore.load();
  usePricingStore().load();
  if (!bare && !coords.value && geoStatus.value !== 'denied') {
    setTimeout(() => requestGeo(), showSplash.value ? 1300 : 200);
  }
  if (auth.isAuthenticated && localStorage.getItem('hh_onboarded') !== '1') {
    setTimeout(() => { showOnboarding.value = true; }, showSplash.value ? 1500 : 400);
  }
});

// Weak connection: the API client showed a saved copy instead of failing.
const toast = useToastStore();
function onOffline() { toast.info("You're offline or the connection is slow - showing what was last loaded.", { title: 'Saved results', ttl: 5000 }); }
window.addEventListener('hh-offline', onOffline);
onUnmounted(() => window.removeEventListener('hh-offline', onOffline));

// iOS-style back: swipe right from the left edge of the screen. The app runs
// as a web page inside the iOS shell, which has no native back gesture.
const TAB_ROOTS = ['/', '/browse', '/wallet', '/orders', '/profile', '/welcome', '/login'];
let swipe = null;
function onTouchStart(e) {
  const t = e.touches[0];
  swipe = t.clientX <= 28 && !TAB_ROOTS.includes(route.path) ? { x: t.clientX, y: t.clientY, done: false } : null;
}
function onTouchMove(e) {
  if (!swipe || swipe.done) return;
  const t = e.touches[0];
  const dx = t.clientX - swipe.x;
  const dy = Math.abs(t.clientY - swipe.y);
  if (dy > 60 || dx < -10) { swipe = null; return; }
  if (dx > 80 && dy < 50) { swipe.done = true; goBack(router); }
}
if (isNative || 'ontouchstart' in window) {
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  onUnmounted(() => {
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
  });
}

// Signed up with Apple or Google and never finished the account: ask once for
// an optional phone/marketing consent and a password (to sign in on the web).
watch(() => [auth.user, route.path], ([u, path]) => {
  if (!u || u.role !== 'customer' || u.hasPassword || u.profileCompletedAt) return;
  if (u.authProvider === 'password') return;
  if (['/complete-account', '/checkout-done', '/privacy', '/terms', '/eula'].includes(path)) return;
  if (sessionStorage.getItem('hh_profile_later') === '1') return;
  router.replace({ path: '/complete-account', query: { redirect: path } });
}, { immediate: true });

function onSplashDone() {
  showSplash.value = false;
  sessionStorage.setItem('hh_splash_shown', '1');
}

const hideTabs = computed(() => {
  if (['/login', '/register', '/welcome', '/subscribe', '/checkout-done', '/complete-account'].includes(route.path)) return true;
  if (route.path.startsWith('/coupons/')) return true;
  if (route.path.startsWith('/merchant-detail/')) return true;
  if (route.path.startsWith('/surprise-bag/')) return true;
  if (route.path === '/map') return true;
  if (route.path.includes('/redeem')) return true;
  if (route.path.includes('/orders/')) return true;
  return false;
});
// Footer visible on the public landing + the main browse/discovery pages.
// Hidden on transactional flows (Redeem, Subscribe, Login) so it doesn't
// distract from a single-step action.
const showFooter = computed(() => {
  // Apps don't have website footers: in the iOS/Android app the same links live
  // under Profile → About & legal.
  if (isNative) return false;
  if (route.path === '/complete-account') return false;
  if (['/login', '/register', '/subscribe', '/checkout-done'].includes(route.path)) return false;
  if (route.path.includes('/redeem')) return false;
  if (route.path === '/map') return false;
  return true;
});
const isLanding = computed(() => route.path === '/welcome');
</script>

<template>
  <SplashScreen v-if="showSplash" @done="onSplashDone" />
  <OnboardingModal v-if="showOnboarding" @done="showOnboarding = false" />
  <ToastContainer />
  <DesktopFrame :landing="isLanding">
    <div class="min-h-full bg-cream-100 text-ink-900 flex flex-col">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <Footer v-if="showFooter" :class="{ 'pb-24': !hideTabs }" />
      <BottomTabBar v-if="!hideTabs" />
    </div>
  </DesktopFrame>
</template>

<style scoped>
.page-enter-active,
.page-leave-active { transition: opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1); }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
