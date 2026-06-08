<script setup>
import { onMounted, ref } from 'vue';
import client from '../../api/client';

const items = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await client.get('/vendor/activity?limit=100');
    items.value = data.items;
  } finally { loading.value = false; }
});

function actionLabel(a) {
  const map = {
    'merchant.create': { icon: 'fa-store', color: 'bg-teal-500', label: 'Created location' },
    'merchant.update': { icon: 'fa-pen-to-square', color: 'bg-teal-600', label: 'Edited location' },
    'merchant.delete': { icon: 'fa-trash', color: 'bg-coral-500', label: 'Deleted location' },
    'coupon.create': { icon: 'fa-ticket', color: 'bg-coral-500', label: 'Created coupon' },
    'coupon.update': { icon: 'fa-pen-to-square', color: 'bg-amber-500', label: 'Edited coupon' },
    'coupon.delete': { icon: 'fa-trash', color: 'bg-coral-500', label: 'Deleted coupon' },
    'user.create': { icon: 'fa-user-plus', color: 'bg-purple-500', label: 'Added team member' },
    'user.update': { icon: 'fa-user-pen', color: 'bg-purple-600', label: 'Edited team member' },
    'user.delete': { icon: 'fa-user-minus', color: 'bg-coral-500', label: 'Removed team member' },
  };
  return map[a] || { icon: 'fa-circle-dot', color: 'bg-ink-500', label: a };
}

function timeAgo(d) {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
</script>

<template>
  <div class="p-5 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Activity</h1>
    <p class="text-ink-500 mt-1">Recent changes by your team</p>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 6" :key="i" class="ios-card h-16 animate-pulse"></div>
    </div>
    <div v-else-if="items.length === 0" class="mt-12 text-center text-ink-500">
      <i class="fa-solid fa-clock-rotate-left text-4xl text-ink-300"></i>
      <div class="mt-3">No activity yet.</div>
    </div>
    <div v-else class="mt-6 ios-card divide-y divide-cream-200">
      <div v-for="a in items" :key="a._id" class="p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" :class="actionLabel(a.action).color">
          <i class="fa-solid" :class="actionLabel(a.action).icon"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm">
            <span class="font-semibold">{{ a.actorUserId?.fullName || 'Someone' }}</span>
            <span class="text-ink-500"> · {{ actionLabel(a.action).label }}</span>
          </div>
          <div class="text-xs text-ink-300 mt-0.5">{{ timeAgo(a.createdAt) }} · {{ a.targetType }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
