import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import LandingView from '../views/Landing.vue';
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
import SubscribeView from '../views/Subscribe.vue';
import PaymentMethodsView from '../views/PaymentMethods.vue';
import NotificationsView from '../views/Notifications.vue';
import HelpView from '../views/Help.vue';
import TonightsDealsView from '../views/TonightsDeals.vue';
import SurpriseBagDetailView from '../views/SurpriseBagDetail.vue';
import MapView from '../views/MapView.vue';

const routes = [
  { path: '/welcome', component: LandingView, meta: { public: true } },
  { path: '/login', component: LoginView, meta: { public: true } },
  { path: '/register', component: RegisterView, meta: { public: true } },
  { path: '/', component: HomeView },
  { path: '/subscribe', component: SubscribeView },
  { path: '/browse', component: BrowseView },
  { path: '/tonight', component: TonightsDealsView },
  { path: '/surprise-bag/:id', component: SurpriseBagDetailView },
  { path: '/map', component: MapView },
  { path: '/coupons/:id', component: CouponDetailView },
  { path: '/wallet', component: WalletView },
  { path: '/wallet/:purchasedId/redeem', component: RedeemView },
  { path: '/orders', component: OrdersView },
  { path: '/orders/:redemptionId', component: OrderConfirmationView },
  { path: '/profile', component: ProfileView },
  { path: '/profile/payment-methods', component: PaymentMethodsView },
  { path: '/profile/notifications', component: NotificationsView },
  { path: '/profile/help', component: HelpView },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.isAuthenticated) return { path: '/welcome' };
  if (!auth.user) {
    try { await auth.fetchMe(); } catch { return { path: '/welcome' }; }
  }
  return true;
});

export default router;
