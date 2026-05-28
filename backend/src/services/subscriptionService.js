const Subscription = require('../models/Subscription');
const User = require('../models/User');
const paymentService = require('./paymentService');
const plans = require('../config/plans');
const planService = require('./planService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

// Legacy-compat: customer Gold monthly used to be $4.99. Keep that as the default plan price
// for customer claims, but the new pricing chart is the source of truth.

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

async function subscribe({ userOrId, tier, plan, paymentMethod, audience }) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const tierKey = tier || 'gold';
  const billing = plan === 'yearly' ? 'yearly' : 'monthly';
  const def = plans.getPlan(tierKey, aud);
  if (!def || def.tier === 'basic') throw new BadRequestError('Cannot subscribe to the Basic (free) plan — just use it');
  const amount = def.price[billing];
  if (!amount || amount <= 0) throw new BadRequestError('Invalid plan price');
  const days = billing === 'yearly' ? 365 : 30;
  const payment = await paymentService.processMockPayment({
    customerId: user._id,
    amountUSD: amount,
    method: paymentMethod,
    context: {
      kind: 'subscription',
      label: `${def.label} ${billing} (${aud})`,
      refType: 'Subscription',
    },
  });
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
    amountUSD: amount,
    dailyClaimLimit: def.limits?.dailyClaims ?? 3,
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
    { $set: baseDoc, $push: { payments: payment._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  // Cache the tier on user for fast access checks
  user.planTier = tierKey;
  await user.save();
  return { subscription: sub, payment, plan: def };
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
// Basic users are blocked from claiming because the Basic tier has couponRedemptions=none.
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
  cancel,
  resume,
  ensureActive,
  // Legacy: still exposed for back-compat
  PLANS: { monthly: { amountUSD: 4.99, days: 30 }, yearly: { amountUSD: 49.99, days: 365 } },
};
