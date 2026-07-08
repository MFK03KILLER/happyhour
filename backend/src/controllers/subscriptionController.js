const asyncHandler = require('../utils/asyncHandler');
const subscriptionService = require('../services/subscriptionService');
const promoCodeService = require('../services/promoCodeService');
const planService = require('../services/planService');
const stripeService = require('../services/stripeService');
const plans = require('../config/plans');

function audienceOf(req, fromBody) {
  const src = fromBody ? req.body : req.query;
  return src.audience || (req.user.role === 'vendor' || req.user.role === 'merchant_staff' ? 'merchant' : 'customer');
}

exports.me = asyncHandler(async (req, res) => {
  const audience = audienceOf(req, false);
  const data = await subscriptionService.getMine(req.user, audience);
  res.json({
    audience,
    tier: data.tier,
    plan: data.plan,
    subscription: data.subscription,
    available: plans.publicSummary(audience),
    // Tell the client whether real card checkout (Stripe) is live.
    paymentsProvider: stripeService.isEnabled() ? 'stripe' : 'mock',
  });
});

exports.subscribe = asyncHandler(async (req, res) => {
  const audience = audienceOf(req, true);
  const result = await subscriptionService.subscribe({
    userOrId: req.user,
    tier: req.body.tier,
    plan: req.body.plan,
    paymentMethod: req.body.paymentMethod,
    promoCode: req.body.promoCode,
    audience,
  });
  res.status(201).json(result);
});

// Stripe path — returns { url } to redirect the customer to Stripe Checkout.
exports.checkout = asyncHandler(async (req, res) => {
  const audience = audienceOf(req, true);
  const result = await subscriptionService.createCheckout({
    userOrId: req.user,
    tier: req.body.tier,
    plan: req.body.plan,
    promoCode: req.body.promoCode,
    audience,
  });
  res.status(201).json(result);
});

// Preview a promo code against a chosen plan (no redemption recorded).
exports.validatePromo = asyncHandler(async (req, res) => {
  const audience = audienceOf(req, true);
  const tier = req.body.tier || 'gold';
  const billing = req.body.plan === 'yearly' ? 'yearly' : 'monthly';
  const def = plans.getPlan(tier, audience);
  const amount = def?.price?.[billing] || 0;
  const { promo, discountUSD, finalUSD } = await promoCodeService.validateAndPrice({
    code: req.body.code, audience, tier, amountUSD: amount, userId: req.user._id,
  });
  res.json({
    valid: !!promo,
    code: promo ? promo.code : null,
    description: promo ? promo.description : null,
    amountUSD: amount,
    discountUSD,
    finalUSD,
  });
});

exports.cancel = asyncHandler(async (req, res) => {
  const audience = audienceOf(req, false);
  const sub = await subscriptionService.cancel(req.user, audience);
  res.json(sub);
});

exports.resume = asyncHandler(async (req, res) => {
  const audience = audienceOf(req, false);
  const sub = await subscriptionService.resume(req.user, audience);
  res.json(sub);
});

exports.myPlan = asyncHandler(async (req, res) => {
  const audience = audienceOf(req, false);
  const { plan, tier } = await planService.getUserPlan(req.user, audience);
  res.json({ audience, tier, plan });
});
