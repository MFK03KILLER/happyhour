// پلن‌های اشتراک — منبع حقیقت قیمت‌گذاری.
// قیمت‌ها به تومان (IRT) برای بازار ایران. لیبل‌ها و bulletها فارسی.
// فیچرها و محدودیت‌ها را اینجا ویرایش کن، نه در سرویس‌ها.

// ------------- پلن‌های مشتری (Consumer) -------------
const CUSTOMER_PLANS = {
  basic: {
    tier: 'basic',
    audience: 'customer',
    label: 'پایه',
    price: { monthly: 0, yearly: 0 },
    description: 'پلن رایگان با دسترسی محدود.',
    badge: null,
    features: {
      access: 'basic',
      browseEntertainers: 'limited',
      referrals: false,
      couponRedemptions: 'none',
      dailyOffers: 'limited',
      featuredListings: false,
      hotels: false,
      support: 'basic_email',
      exclusiveEventsContent: false,
      weekendRedemptions: false,
      verificationBadge: false,
    },
    limits: {
      dailyClaims: 0,
      monthlyClaims: 0,
      weekendClaims: 0,
    },
    bullets: [
      'جست‌وجوی کسب‌وکارها (محدود)',
      'دسترسی محدود به آفرهای روزانه',
      'پشتیبانی ایمیلی پایه',
    ],
    crossedOut: [
      'بدون استفاده از کوپن',
      'بدون نمایش ویژه',
      'بدون دسترسی به هتل‌ها',
    ],
  },
  gold: {
    tier: 'gold',
    audience: 'customer',
    label: 'طلایی',
    price: { monthly: 499000, yearly: 4990000 },
    description: 'محبوب‌ترین — صرفه‌جویی روزانه.',
    badge: 'محبوب‌ترین',
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
      'جست‌وجوی نامحدود کسب‌وکارها',
      'تا ۳ کوپن در روز',
      'دعوت محدود دوستان',
      'دسترسی ویژه به آفرهای روزانه',
      'دسترسی به هتل‌های شریک',
      'آفرهای آخر هفته (محدود)',
      'پشتیبانی اولویت‌دار',
      'نشان تأیید کاربر',
    ],
    crossedOut: [
      'بدون رویدادهای انحصاری VIP',
    ],
  },
  premium: {
    tier: 'premium',
    audience: 'customer',
    label: 'پریمیوم',
    price: { monthly: 2990000, yearly: 29900000 },
    description: 'دسترسی VIP به همه چیز.',
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
      'دسترسی VIP به پلتفرم',
      'استفاده نامحدود از کوپن‌ها',
      'دعوت نامحدود دوستان',
      'آفرهای انحصاری VIP',
      'نمایش ویژه و اولویت‌دار',
      'دسترسی به هتل‌های لوکس',
      'آفرهای نامحدود آخر هفته',
      'پشتیبانی ۲۴/۷ ویژه VIP',
      'رویدادها و محتوای انحصاری',
      'نشان تأیید پریمیوم',
    ],
    crossedOut: [],
  },
};

// ------------- پلن‌های مرچنت (Merchant) -------------
const MERCHANT_PLANS = {
  basic: {
    tier: 'basic',
    audience: 'merchant',
    label: 'پایه',
    price: { monthly: 0, yearly: 0 },
    description: 'کسب‌وکارهای کوچک یا تازه‌کار.',
    badge: null,
    features: {
      profileListing: 'basic',
      platformVisibility: 'limited',
      couponCampaigns: 1,
      referralBonusUSD: 0,
      dailyOfferPromotions: false,
      weekendPromotions: false,
      analytics: 'basic_traffic',
      verificationBadge: false,
      support: 'standard_email',
      adPlacement: false,
      multiLocation: 1,
    },
    limits: {
      activeCoupons: 1,
      locations: 1,
    },
    bullets: [
      'پروفایل پایه کسب‌وکار',
      'نمایش محدود در پلتفرم',
      '۱ کوپن فعال',
      'آمار ترافیک پایه',
      'پشتیبانی ایمیلی استاندارد',
    ],
    crossedOut: [
      'بدون پاداش معرفی',
      'بدون آفر روزانه',
      'بدون آفر آخر هفته',
      'بدون نشان تأیید',
      'بدون تبلیغات',
      'بدون مدیریت چند شعبه',
    ],
  },
  gold: {
    tier: 'gold',
    audience: 'merchant',
    label: 'طلایی',
    price: { monthly: 9990000, yearly: 99900000 },
    description: 'رستوران‌ها و مکان‌های در حال رشد.',
    badge: 'محبوب‌ترین',
    features: {
      profileListing: 'enhanced',
      platformVisibility: 'higher_search',
      couponCampaigns: 5,
      referralBonusUSD: 5000000,
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
      'پروفایل ارتقا یافته',
      'رتبه‌بندی بالاتر در جست‌وجو',
      'تا ۵ کوپن فعال',
      'پاداش معرفی ۵٬۰۰۰٬۰۰۰ تومان',
      'آفر روزانه (محدود)',
      'دسترسی به آفرهای آخر هفته',
      'تحلیل تعامل مشتریان',
      'نشان مرچنت تأیید شده',
      'تبلیغات محلی',
      'تا ۳ شعبه',
      'پشتیبانی اولویت‌دار',
    ],
    crossedOut: [],
  },
  premium: {
    tier: 'premium',
    audience: 'merchant',
    label: 'پریمیوم',
    price: { monthly: 35000000, yearly: 350000000 },
    description: 'برندهای بزرگ و زنجیره‌ها.',
    badge: 'سازمانی',
    features: {
      profileListing: 'featured_vip',
      platformVisibility: 'top_priority',
      couponCampaigns: 9999,
      referralBonusUSD: 10000000,
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
      'نمایش VIP در صفحه اصلی',
      'بالاترین اولویت در جست‌وجو',
      'کوپن نامحدود',
      'پاداش معرفی ۱۰٬۰۰۰٬۰۰۰ تومان',
      'آفر روزانه نامحدود',
      'نمایش ویژه آخر هفته',
      'تحلیل کامل درآمد',
      'نشان تأیید پریمیوم',
      'تبلیغات اسپانسری ویژه',
      'شعبه نامحدود',
      'مدیر حساب اختصاصی',
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

// خروجی public بدون فیلدهای خصوصی، مناسب /public/plans
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
    currency: 'IRT',
  }));
}

module.exports = {
  CUSTOMER_PLANS,
  MERCHANT_PLANS,
  getPlan,
  listPlans,
  publicSummary,
};
