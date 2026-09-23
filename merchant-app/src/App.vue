<script setup>
import { useRoute } from 'vue-router';
import { computed, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useFlagsStore } from './stores/flags';
import MerchantTabBar from './components/MerchantTabBar.vue';
import AcceptMerchantTermsGate from './components/AcceptMerchantTermsGate.vue';

const route = useRoute();
const auth = useAuthStore();
const flagsStore = useFlagsStore();
onMounted(() => flagsStore.load());
const showTabs = computed(() => auth.isMerchantStaff && route.path !== '/login');
// Staff screens are phone layouts. On an iPad they stretched to the full width;
// keep them in a centred column. The dashboards are built wide, and sign-in /
// apply paint a full-bleed background and centre their own content.
const wideRoute = computed(() => ['/admin', '/vendor', '/login', '/apply'].some((p) => route.path.startsWith(p)));
</script>

<template>
  <div class="min-h-screen" :class="wideRoute ? '' : 'bg-cream-100'">
    <!-- index.html paints body dark for the sign-in overscroll; staff screens paint
         their own cream around the column so tablet gutters match the page. -->
    <div :class="wideRoute ? '' : 'mx-auto w-full max-w-[720px] min-h-screen'">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <MerchantTabBar v-if="showTabs" />
    <AcceptMerchantTermsGate />
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active { transition: opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1); }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
