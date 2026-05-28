const SiteSetting = require('../models/SiteSetting');

const DEFAULT_TERMS_CONTENT = `# Happy Hour — Terms of Service

_Last updated: ${new Date().toISOString().slice(0, 10)}_

> ⚠️ **PLACEHOLDER TEXT** — replace this in the admin panel before launch.

Welcome to Happy Hour. By creating an account or using our service you agree to these terms.

## 1. Eligibility
You must be at least 18 years old to create an account and redeem coupons.

## 2. Membership
- A free Basic plan is available with limited features.
- Paid plans (Gold and Premium) renew automatically every month unless cancelled.
- You can cancel at any time from your account settings; cancellations take effect at the end of the current billing period.

## 3. Coupon usage
Coupons are valid only during the active window set by the merchant. Daily claim limits apply based on your plan. Coupons are not redeemable for cash.

## 4. Merchant responsibilities
Merchants set their own coupon terms, off-peak hours, and holiday availability. We are not responsible for the goods or services provided by merchants.

## 5. Payments
Subscription payments are processed by our payment partners (Apple, Google, Stripe). All sales are final except as required by law or our 7-day satisfaction guarantee.

## 6. Privacy
We collect the minimum data needed to operate the service. See our Privacy Policy for details.

## 7. Termination
We reserve the right to suspend accounts that abuse the service, including but not limited to fraud, sharing redemption codes, or violating merchant terms.

## 8. Changes
We may update these terms from time to time. Material changes will be communicated by email and require re-acceptance.

By tapping "I agree" you confirm you have read and accept these terms.
`;

const DEFAULTS = {
  terms: {
    version: 1,
    content: DEFAULT_TERMS_CONTENT,
    updatedAt: new Date(),
  },
};

async function get(key) {
  const found = await SiteSetting.findOne({ key });
  if (found) return found.value;
  return DEFAULTS[key] || null;
}

async function set(key, value, userId) {
  const existing = await SiteSetting.findOne({ key });
  if (existing && existing.value && typeof existing.value === 'object' && existing.value.version != null) {
    value.version = (existing.value.version || 1) + 1;
  }
  value.updatedAt = new Date();
  return SiteSetting.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy: userId } },
    { upsert: true, new: true },
  );
}

async function ensureSeed() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await SiteSetting.findOne({ key });
    if (!existing) {
      await SiteSetting.create({ key, value });
    }
  }
}

async function getTerms() {
  const v = await get('terms');
  return v || DEFAULTS.terms;
}

async function updateTerms({ content, userId }) {
  return set('terms', { content }, userId);
}

module.exports = { get, set, ensureSeed, getTerms, updateTerms, DEFAULTS };
