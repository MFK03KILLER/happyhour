// Subscription plans — pricing chart source of truth.
// Edit feature flags & limits here; do NOT scatter "is gold?" checks across services.

// ------------- Customer plans -------------
// The membership model (Nov 2026): three paid monthly plans. What a plan buys is
// a number of coupon redemptions per participating restaurant per calendar
// month (Pacific time); a "restaurant" is the vendor, so all its locations
// share one allowance. Higher plans also unlock coupons marked for them.
// 'free' is having no membership: browse only.
const CUSTOMER_PLANS = {
  free: {
    tier: 'free',
    rank: 0,
    audience: 'customer',
    label: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Browse deals. Join a plan to redeem.',
    badge: null,
    features: { access: 'browse' },
    limits: { redemptionsPerRestaurantMonthly: 0 },
    bullets: ['Browse participating restaurants and deals'],
    crossedOut: ['No coupon redemptions'],
    hidden: true,
  },
  basic: {
    tier: 'basic',
    rank: 1,
    audience: 'customer',
    label: 'Basic',
    price: { monthly: 15, yearly: 0 },
    description: '1 coupon per restaurant every month.',
    badge: null,
    features: { access: 'basic' },
    limits: { redemptionsPerRestaurantMonthly: 1 },
    bullets: [
      '1 coupon redemption per participating restaurant every month',
      'Access to participating restaurant deals',
      'Exclusive dining discounts',
    ],
    crossedOut: [],
  },
  gold: {
    tier: 'gold',
    rank: 2,
    audience: 'customer',
    label: 'Gold',
    price: { monthly: 100, yearly: 0 },
    description: '2 coupons per restaurant every month.',
    badge: 'Most Popular',
    features: { access: 'gold' },
    limits: { redemptionsPerRestaurantMonthly: 2 },
    bullets: [
      '2 coupon redemptions per participating restaurant every month',
      'Access to all Basic offers',
      'Exclusive premium restaurant deals',
    ],
    crossedOut: [],
  },
  premium: {
    tier: 'premium',
    rank: 3,
    audience: 'customer',
    label: 'Premium',
    price: { monthly: 269.99, yearly: 0 },
    description: '4 coupons per restaurant every month.',
    badge: 'VIP',
    features: { access: 'premium' },
    limits: { redemptionsPerRestaurantMonthly: 4 },
    bullets: [
      '4 coupon redemptions per participating restaurant every month',
      'Access to all Gold offers',
      'VIP restaurant promotions',
      'Access to exclusive high-value deals',
    ],
    crossedOut: [],
  },
};

// Coupons can be limited to a plan and up. Old values from before the Nov 2026
// plans (none/lite/plus/pro) map onto the new ones.
const COUPON_TIER_ALIASES = { none: 'basic', lite: 'basic', plus: 'gold', pro: 'premium' };
function couponRequiredTier(coupon) {
  const t = (coupon && coupon.requiredPlanTier) || 'basic';
  return COUPON_TIER_ALIASES[t] || t;
}
function tierRank(tier) {
  return (CUSTOMER_PLANS[tier] && CUSTOMER_PLANS[tier].rank) || 0;
}

// ------------- Merchant plans -------------
const MERCHANT_PLANS = {
  basic: {
    tier: 'basic',
    audience: 'merchant',
    label: 'Basic',
    price: { monthly: 0, yearly: 0 },
    description: 'Small / new businesses.',
    badge: null,
    features: {
      profileListing: 'basic',
      platformVisibility: 'limited',
      couponCampaigns: 1,                    // max active coupon count
      referralBonusUSD: 0,
      dailyOfferPromotions: false,           // can use todaysOffer flag
      weekendPromotions: false,
      analytics: 'basic_traffic',            // basic_traffic | engagement | revenue
      verificationBadge: false,
      support: 'standard_email',
      adPlacement: false,                    // false | 'local' | 'premium_sponsored'
      multiLocation: 1,                      // max locations (merchants under this vendor)
    },
    limits: {
      activeCoupons: 1,
      locations: 1,
    },
    bullets: [
      'Basic business profile listing',
      'Limited platform exposure',
      '1 active coupon',
      'Basic traffic stats',
      'Standard email support',
    ],
    crossedOut: [
      'No referral bonus',
      'No daily offer promotions',
      'No weekend promotions',
      'No verification badge',
      'No ad placement',
      'No multi-location management',
    ],
  },
  gold: {
    tier: 'gold',
    audience: 'merchant',
    label: 'Gold',
    price: { monthly: 99.99, yearly: 999.99 },
    description: 'Growing restaurants & venues.',
    badge: 'Most Popular',
    features: {
      profileListing: 'enhanced',
      platformVisibility: 'higher_search',
      couponCampaigns: 5,
      referralBonusUSD: 50,
      dailyOfferPromotions: 'limited',
      weekendPromotions: 'weekend_access',
      analytics: 'engagement',
      verificationBadge: true,
      support: 'priority',
      adPlacement: 'local',
      multiLocation: 3,
    },
    limits: {
      activeCoupons: 5,
      locations: 3,
    },
    bullets: [
      'Enhanced business listing',
      'Higher search placement',
      'Up to 5 active coupons',
      '$50 referral bonus rewards',
      'Limited daily-offer promotions',
      'Weekend promotion access',
      'Customer engagement insights',
      'Verified merchant badge',
      'Local ad placements',
      'Up to 3 locations',
      'Priority support',
    ],
    crossedOut: [],
  },
  premium: {
    tier: 'premium',
    audience: 'merchant',
    label: 'Premium',
    // Note: merchant Premium is priced yearly per the chart ($3,500/year)
    price: { monthly: 350, yearly: 3500 },
    description: 'Large brands & chains.',
    badge: 'Enterprise',
    features: {
      profileListing: 'featured_vip',
      platformVisibility: 'top_priority',
      couponCampaigns: 9999,
      referralBonusUSD: 100,
      dailyOfferPromotions: 'unlimited',
      weekendPromotions: 'premium_weekend',
      analytics: 'revenue',
      verificationBadge: 'premium',
      support: 'dedicated_account_manager',
      adPlacement: 'premium_sponsored',
      multiLocation: 9999,
    },
    limits: {
      activeCoupons: 9999,
      locations: 9999,
    },
    bullets: [
      'Featured VIP listing',
      'Top priority placement',
      'Unlimited coupons',
      '$100 referral bonus rewards',
      'Unlimited daily-offer promotions',
      'Premium weekend placement',
      'Advanced revenue analytics',
      'Premium verified badge',
      'Premium sponsored ad placement',
      'Unlimited locations',
      'Dedicated account manager',
    ],
    crossedOut: [],
  },
};

// Prices above are defaults. An admin can override any paid tier's price from the
// admin panel (services/pricingService.js); every read below applies it, so
// checkout, promo codes, /public/plans and the apps all see one price.
const pricing = require('../services/pricingService');

function withPrice(plan) {
  const override = pricing.overrideFor(plan.audience, plan.tier);
  return override ? { ...plan, price: override, defaultPrice: plan.price } : plan;
}

function getPlan(tier, audience = 'customer') {
  if (audience === 'merchant') return withPrice(MERCHANT_PLANS[tier] || MERCHANT_PLANS.basic);
  return withPrice(CUSTOMER_PLANS[tier] || CUSTOMER_PLANS.free);
}

function listPlans(audience = 'customer') {
  const set = audience === 'merchant' ? MERCHANT_PLANS : CUSTOMER_PLANS;
  return Object.values(set).map(withPrice);
}

// Returns trimmed, no-private-fields version suitable for /public/plans
function publicSummary(audience = 'customer') {
  return listPlans(audience).filter((p) => !p.hidden).map((p) => ({
    tier: p.tier,
    audience: p.audience,
    label: p.label,
    price: p.price,
    description: p.description,
    badge: p.badge,
    features: p.features,
    limits: p.limits,
    bullets: p.bullets,
    crossedOut: p.crossedOut,
  }));
}

module.exports = {
  CUSTOMER_PLANS,
  couponRequiredTier,
  tierRank,
  MERCHANT_PLANS,
  getPlan,
  listPlans,
  publicSummary,
};
