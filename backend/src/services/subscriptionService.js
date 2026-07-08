const Subscription = require('../models/Subscription');
const User = require('../models/User');
const paymentService = require('./paymentService');
const stripeService = require('./stripeService');
const promoCodeService = require('./promoCodeService');
const plans = require('../config/plans');
const planService = require('./planService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function getMine(userOrId, audience) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const result = await planService.getUserPlan(user, aud);
  return {
    audience: aud,
    tier: result.tier || 'basic',
    plan: result.plan,
    subscription: result.subscription,
  };
}

// Resolve the plan + price the caller is trying to buy. Throws on invalid input.
async function resolvePlan({ user, tier, plan, audience }) {
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const tierKey = tier || 'gold';
  const billing = plan === 'yearly' ? 'yearly' : 'monthly';
  const def = plans.getPlan(tierKey, aud);
  if (!def || def.tier === 'basic') throw new BadRequestError('Cannot subscribe to the Basic (free) plan — just use it');
  const amount = def.price[billing];
  if (!amount || amount <= 0) throw new BadRequestError('Invalid plan price');
  const days = billing === 'yearly' ? 365 : 30;
  return { aud, tierKey, billing, def, amount, days };
}

// Upsert the Subscription document + cache the tier on the user.
async function activateSubscription({ user, aud, tierKey, billing, days, amountUSD, paymentMethod, payment, def }) {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const baseDoc = {
    audience: aud,
    tier: tierKey,
    plan: billing,
    status: 'active',
    startedAt: now,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    paymentMethod,
    amountUSD,
    dailyClaimLimit: def?.limits?.dailyClaims ?? 1,
  };
  let filter;
  if (aud === 'merchant') {
    if (!user.vendorId) throw new BadRequestError('Merchant user must be linked to a vendor');
    baseDoc.vendorId = user.vendorId;
    filter = { audience: 'merchant', vendorId: user.vendorId };
  } else {
    baseDoc.customerId = user._id;
    filter = { audience: 'customer', customerId: user._id };
  }
  const sub = await Subscription.findOneAndUpdate(
    filter,
    { $set: baseDoc, ...(payment ? { $push: { payments: payment._id } } : {}) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  user.planTier = tierKey;
  await user.save();
  return sub;
}

// Mock/no-processor path: charge instantly and activate. Also honours promo codes.
async function subscribe({ userOrId, tier, plan, paymentMethod, audience, promoCode }) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  if (stripeService.isEnabled()) {
    throw new BadRequestError('Card payments are enabled — start Stripe checkout instead of /subscribe');
  }
  const { aud, tierKey, billing, def, amount, days } = await resolvePlan({ user, tier, plan, audience });
  const { promo, discountUSD, finalUSD } = await promoCodeService.validateAndPrice({
    code: promoCode, audience: aud, tier: tierKey, amountUSD: amount, userId: user._id,
  });
  const payment = await paymentService.processMockPayment({
    customerId: user._id,
    amountUSD: finalUSD,
    method: paymentMethod,
    context: {
      kind: 'subscription',
      label: `${def.label} ${billing} (${aud})`,
      refType: 'Subscription',
      promoCode: promo ? promo.code : undefined,
      discountUSD,
    },
  });
  if (promo) await promoCodeService.recordRedemption(promo._id, user._id);
  const sub = await activateSubscription({
    user, aud, tierKey, billing, days, amountUSD: finalUSD, paymentMethod, payment, def,
  });
  return { subscription: sub, payment, plan: def, discountUSD, promoCode: promo ? promo.code : null };
}

// Stripe path: create a Checkout Session and return its URL. Nothing is
// activated until the webhook confirms payment (see finalizeStripeCheckout).
async function createCheckout({ userOrId, tier, plan, audience, promoCode }) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const { aud, tierKey, billing, def, amount } = await resolvePlan({ user, tier, plan, audience });
  const { promo, discountUSD, finalUSD } = await promoCodeService.validateAndPrice({
    code: promoCode, audience: aud, tier: tierKey, amountUSD: amount, userId: user._id,
  });
  const session = await stripeService.createCheckoutSession({
    amountUSD: finalUSD,
    label: `Happy Hour — ${def.label} ${billing}`,
    customerEmail: user.email,
    successPath: '/subscribe?checkout=success',
    cancelPath: '/subscribe?checkout=cancel',
    metadata: {
      kind: 'subscription',
      userId: String(user._id),
      audience: aud,
      tier: tierKey,
      billing,
      amountUSD: String(finalUSD),
      promoId: promo ? String(promo._id) : '',
      promoCode: promo ? promo.code : '',
      discountUSD: String(discountUSD),
    },
  });
  return { url: session.url, sessionId: session.id, amountUSD: finalUSD, discountUSD };
}

// Called from the Stripe webhook on checkout.session.completed. Idempotent.
async function finalizeStripeCheckout(session) {
  const md = session.metadata || {};
  if (md.kind !== 'subscription') return null;
  const user = await User.findById(md.userId);
  if (!user) return null;
  const aud = md.audience || 'customer';
  const tierKey = md.tier || 'gold';
  const billing = md.billing === 'yearly' ? 'yearly' : 'monthly';
  const def = plans.getPlan(tierKey, aud);
  const days = billing === 'yearly' ? 365 : 30;
  const amountUSD = Number(md.amountUSD || (session.amount_total || 0) / 100);
  const payment = await paymentService.recordStripePayment({
    customerId: user._id,
    amountUSD,
    providerRef: session.payment_intent || session.id,
    context: {
      kind: 'subscription',
      label: `${def.label} ${billing} (${aud})`,
      refType: 'Subscription',
      promoCode: md.promoCode || undefined,
      discountUSD: Number(md.discountUSD || 0),
    },
  });
  if (md.promoId) await promoCodeService.recordRedemption(md.promoId, user._id);
  const sub = await activateSubscription({
    user, aud, tierKey, billing, days, amountUSD, paymentMethod: 'card', payment, def,
  });
  return { subscription: sub, payment };
}

async function cancel(userOrId, audience) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const filter = aud === 'merchant'
    ? { audience: 'merchant', vendorId: user.vendorId }
    : { audience: 'customer', customerId: user._id };
  const sub = await Subscription.findOne(filter);
  if (!sub) throw new NotFoundError('No subscription');
  sub.cancelAtPeriodEnd = true;
  await sub.save();
  return sub;
}

async function resume(userOrId, audience) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const filter = aud === 'merchant'
    ? { audience: 'merchant', vendorId: user.vendorId }
    : { audience: 'customer', customerId: user._id };
  const sub = await Subscription.findOne(filter);
  if (!sub) throw new NotFoundError('No subscription');
  sub.cancelAtPeriodEnd = false;
  await sub.save();
  return sub;
}

// Used by couponService.claim — gate behind any active paid plan (Gold or Premium).
async function ensureActive(customerId) {
  const user = await User.findById(customerId);
  if (!user) throw new NotFoundError('User not found');
  const { plan } = await planService.getUserPlan(user, 'customer');
  if (plan.tier === 'basic') {
    throw new BadRequestError('Upgrade to Gold or Premium to claim coupons');
  }
  const sub = await Subscription.findOne({ audience: 'customer', customerId, status: 'active' })
    || await Subscription.findOne({ customerId, status: 'active' });
  if (!sub || sub.currentPeriodEnd < new Date()) {
    throw new BadRequestError('Subscription required to claim coupons');
  }
  return sub;
}

module.exports = {
  getMine,
  subscribe,
  createCheckout,
  finalizeStripeCheckout,
  cancel,
  resume,
  ensureActive,
  PLANS: { monthly: { amountUSD: 12.99, days: 30 }, yearly: { amountUSD: 129.99, days: 365 } },
};
