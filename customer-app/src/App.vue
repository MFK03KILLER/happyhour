<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import BottomTabBar from './components/BottomTabBar.vue';
import DesktopFrame from './components/DesktopFrame.vue';

const route = useRoute();
const hideTabs = computed(() => {
  if (['/login', '/register', '/welcome', '/subscribe'].includes(route.path)) return true;
  if (route.path.startsWith('/coupons/')) return true;
  if (route.path.includes('/redeem')) return true;
  if (route.path.includes('/orders/')) return true;
  return false;
});
const isLanding = computed(() => route.path === '/welcome');
</script>

<template>
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
