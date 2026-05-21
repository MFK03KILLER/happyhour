<script setup>
import { useRoute } from 'vue-router';
import { computed, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useFlagsStore } from './stores/flags';
import MerchantTabBar from './components/MerchantTabBar.vue';

const route = useRoute();
const auth = useAuthStore();
const flagsStore = useFlagsStore();
onMounted(() => flagsStore.load());
const showTabs = computed(() => auth.isMerchantStaff && route.path !== '/login');
</script>

<template>
  <div class="min-h-screen">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <MerchantTabBar v-if="showTabs" />
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active { transition: opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1); }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
