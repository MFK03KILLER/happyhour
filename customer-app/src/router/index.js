import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import HomeView from '../views/Home.vue';
import BrowseView from '../views/Browse.vue';
import CouponDetailView from '../views/CouponDetail.vue';
import WalletView from '../views/Wallet.vue';
import RedeemView from '../views/Redeem.vue';
import OrdersView from '../views/Orders.vue';
import OrderConfirmationView from '../views/OrderConfirmation.vue';
import ProfileView from '../views/Profile.vue';
import LoginView from '../views/Login.vue';
import RegisterView from '../views/Register.vue';

const routes = [
  { path: '/login', component: LoginView, meta: { public: true } },
  { path: '/register', component: RegisterView, meta: { public: true } },
  { path: '/', component: HomeView },
  { path: '/browse', component: BrowseView },
  { path: '/coupons/:id', component: CouponDetailView },
  { path: '/wallet', component: WalletView },
  { path: '/wallet/:purchasedId/redeem', component: RedeemView },
  { path: '/orders', component: OrdersView },
  { path: '/orders/:redemptionId', component: OrderConfirmationView },
  { path: '/profile', component: ProfileView },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isAuthenticated) return { path: '/login' };
  if (!auth.user) {
    try { await auth.fetchMe(); } catch { return { path: '/login' }; }
  }
  return true;
});

export default router;
