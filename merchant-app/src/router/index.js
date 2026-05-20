import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import LoginView from '../views/Login.vue';
import ScanView from '../views/Scan.vue';
import HistoryView from '../views/History.vue';
import StatsView from '../views/Stats.vue';

import AdminLayout from '../views/admin/AdminLayout.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AdminVendors from '../views/admin/AdminVendors.vue';
import AdminMerchants from '../views/admin/AdminMerchants.vue';
import AdminCoupons from '../views/admin/AdminCoupons.vue';
import AdminUsers from '../views/admin/AdminUsers.vue';
import AdminAudit from '../views/admin/AdminAudit.vue';

const routes = [
  { path: '/login', component: LoginView, meta: { public: true } },
  { path: '/', component: ScanView, meta: { roles: ['merchant_staff'] } },
  { path: '/history', component: HistoryView, meta: { roles: ['merchant_staff'] } },
  { path: '/stats', component: StatsView, meta: { roles: ['merchant_staff'] } },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { roles: ['admin'] },
    children: [
      { path: '', component: AdminDashboard },
      { path: 'vendors', component: AdminVendors },
      { path: 'merchants', component: AdminMerchants },
      { path: 'coupons', component: AdminCoupons },
      { path: 'users', component: AdminUsers },
      { path: 'audit', component: AdminAudit },
    ],
  },
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes, scrollBehavior: () => ({ top: 0 }) });

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isAuthenticated) return { path: '/login' };
  if (!auth.user) { try { await auth.fetchMe(); } catch { return { path: '/login' }; } }
  if (to.meta.roles && !to.meta.roles.includes(auth.user.role)) {
    if (auth.user.role === 'admin') return { path: '/admin' };
    if (auth.user.role === 'merchant_staff') return { path: '/' };
    return { path: '/login' };
  }
  return true;
});

export default router;
