// Subscription plans — pricing chart source of truth.
// Edit feature flags & limits here; do NOT scatter "is gold?" checks across services.

// ------------- Customer plans -------------
const CUSTOMER_PLANS = {
  basic: {
    tier: 'basic',
    audience: 'customer',
    label: 'Basic',
    price: { monthly: 0, yearly: 0 },
    description: 'Free plan with limited access.',
    badge: null,
    features: {
      access: 'basic',                       // basic | full | vip
      browseEntertainers: 'limited',         // limited | unlimited
      referrals: false,                      // false | 'limited' | 'unlimited'
      couponRedemptions: 'none',             // 'none' | 'limited' | 'unlimited'
      dailyOffers: 'limited',                // limited | priority | vip_exclusive
      featuredListings: false,
      hotels: false,                         // false | 'partner' | 'luxury'
      support: 'basic_email',                // basic_email | priority | 24_7_vip
      exclusiveEventsContent: false,
      weekendRedemptions: false,             // false | 'limited' | 'unlimited'
      verificationBadge: false,              // false | true | 'premium'
    },
    limits: {
      dailyClaims: 0,                        // basic = no claims, must upgrade
      monthlyClaims: 0,
      weekendClaims: 0,
    },
    bullets: [
      'Browse entertainers (limited)',
      'Limited access to daily offers',
      'Basic email support',
    ],
    crossedOut: [
      'No coupon redemptions',
      'No featured listings',
      'No hotels access',
    ],
  },
  gold: {
    tier: 'gold',
    audience: 'customer',
    label: 'Gold',
    price: { monthly: 4.99, yearly: 49.99 },
    description: 'Most popular — daily savings.',
    badge: 'Most Popular',
    features: {
      access: 'full',
      browseEntertainers: 'unlimited',
      referrals: 'limited',
      couponRedemptions: 'limited',
      dailyOffers: 'priority',
      featuredListings: true,
      hotels: 'partner',
      support: 'priority',
      exclusiveEventsContent: false,
      weekendRedemptions: 'limited',
      verificationBadge: true,
    },
    limits: {
      dailyClaims: 3,
      monthlyClaims: 90,
      weekendClaims: 5,
    },
    bullets: [
      'Unlimited browsing',
      'Up to 3 coupon claims per day',
      'Limited referrals',
      'Priority daily offers',
      'Partner hotel access',
      'Limited weekend deals',
      'Priority support',
      'Verification badge',
    ],
    crossedOut: [
      'No exclusive VIP events',
    ],
  },
  premium: {
    tier: 'premium',
    audience: 'customer',
    label: 'Premium',
    price: { monthly: 29.99, yearly: 299.99 },
    description: 'VIP-only access to everything.',
    badge: 'VIP',
    features: {
      access: 'vip',
      browseEntertainers: 'unlimited',
      referrals: 'unlimited',
      couponRedemptions: 'unlimited',
      dailyOffers: 'vip_exclusive',
      featuredListings: 'premium_placement',
      hotels: 'luxury',
      support: '24_7_vip',
      exclusiveEventsContent: true,
      weekendRedemptions: 'unlimited',
      verificationBadge: 'premium',
    },
    limits: {
      dailyClaims: 999,
      monthlyClaims: 9999,
      weekendClaims: 999,
    },
    bullets: [
      'VIP access to the platform',
      'Unlimited coupon redemptions',
      'Unlimited referrals',
      'VIP-exclusive daily offers',
      'Premium placement & visibility',
      'Luxury hotel access',
      'Unlimited weekend deals',
      '24/7 VIP support',
      'Exclusive events & content',
      'Premium verification badge',
    ],
    crossedOut: [],
  },
};

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

function getPlan(tier, audience = 'customer') {
  const set = audience === 'merchant' ? MERCHANT_PLANS : CUSTOMER_PLANS;
  return set[tier] || set.basic;
}

function listPlans(audience = 'customer') {
  const set = audience === 'merchant' ? MERCHANT_PLANS : CUSTOMER_PLANS;
  return Object.values(set);
}

// Returns trimmed, no-private-fields version suitable for /public/plans
function publicSummary(audience = 'customer') {
  return listPlans(audience).map((p) => ({
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
  MERCHANT_PLANS,
  getPlan,
  listPlans,
  publicSummary,
};
