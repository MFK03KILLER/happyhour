<script setup>
import { useRoute } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
import BottomTabBar from './components/BottomTabBar.vue';
import DesktopFrame from './components/DesktopFrame.vue';
import SplashScreen from './components/SplashScreen.vue';
import ToastContainer from './components/ToastContainer.vue';
import { useFlagsStore } from './stores/flags';
import { useGeolocation } from './composables/useGeolocation';

const route = useRoute();
const flagsStore = useFlagsStore();
const showSplash = ref(sessionStorage.getItem('hh_splash_shown') !== '1');
const { coords, status: geoStatus, request: requestGeo } = useGeolocation();

onMounted(() => {
  flagsStore.load();
  if (!coords.value && geoStatus.value !== 'denied') {
    setTimeout(() => requestGeo(), showSplash.value ? 1300 : 200);
  }
});

function onSplashDone() {
  showSplash.value = false;
  sessionStorage.setItem('hh_splash_shown', '1');
}

const hideTabs = computed(() => {
  if (['/login', '/register', '/welcome', '/subscribe'].includes(route.path)) return true;
  if (route.path.startsWith('/coupons/')) return true;
  if (route.path.startsWith('/merchant-detail/')) return true;
  if (route.path.startsWith('/surprise-bag/')) return true;
  if (route.path === '/map') return true;
  if (route.path.includes('/redeem')) return true;
  if (route.path.includes('/orders/')) return true;
  return false;
});
const isLanding = computed(() => route.path === '/welcome');
</script>

<template>
  <SplashScreen v-if="showSplash" @done="onSplashDone" />
  <ToastContainer />
  <DesktopFrame :landing="isLanding">
    <div class="min-h-full bg-cream-100 text-ink-900 flex flex-col">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
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
