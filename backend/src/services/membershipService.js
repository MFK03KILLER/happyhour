// The monthly allowance: a member may redeem N coupons per restaurant (vendor)
// per calendar month, N set by their plan (config/plans.js). Counted from
// completed redemptions this month plus claims that are still waiting to be
// scanned, so nobody can stockpile claims past the limit.
const mongoose = require('mongoose');
const plans = require('../config/plans');
const planService = require('./planService');
const Redemption = require('../models/Redemption');
const PurchasedCoupon = require('../models/PurchasedCoupon');
const Coupon = require('../models/Coupon');
const { monthStart, nextMonthStart } = require('../utils/periods');
const { BadRequestError } = require('../utils/errors');

const oid = (v) => (v && v._id ? v._id : v);

async function usedThisMonth(customerId, vendorId, { includePending = true } = {}) {
  const since = monthStart();
  const done = await Redemption.countDocuments({
    customerId: oid(customerId), vendorId: oid(vendorId), status: 'completed', scannedAt: { $gte: since },
  });
  if (!includePending) return done;
  const vendorCoupons = await Coupon.find({ vendorId: oid(vendorId) }).distinct('_id');
  const pending = await PurchasedCoupon.countDocuments({
    customerId: oid(customerId), couponId: { $in: vendorCoupons }, status: 'active', usesRemaining: { $gt: 0 },
  });
  return done + pending;
}

// { tier, limit, used, remaining, resetsAt } for one restaurant.
async function allowance(user, vendorId, opts) {
  const { plan, subscription, tier } = await planService.getUserPlan(user, 'customer');
  const limit = plan.limits?.redemptionsPerRestaurantMonthly || 0;
  const used = vendorId ? await usedThisMonth(user._id, vendorId, opts) : 0;
  return { tier: tier || plan.tier, plan, subscription, limit, used, remaining: Math.max(0, limit - used), resetsAt: nextMonthStart() };
}

function limitError(a, restaurant) {
  const when = a.resetsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
  const next = a.tier === 'basic' ? ' Upgrade to Gold for 2 a month, or Premium for 4.' : a.tier === 'gold' ? ' Upgrade to Premium for 4 a month.' : '';
  const err = new BadRequestError(
    `You've used your ${a.limit} ${a.plan.label} coupon${a.limit === 1 ? '' : 's'} at ${restaurant || 'this restaurant'} this month. It resets on ${when}.${next}`,
  );
  err.code = 'MONTHLY_LIMIT_REACHED';
  return err;
}

// Throws unless this member may claim this coupon now.
async function assertCanClaim(user, coupon) {
  if (user.testMode) return null;
  const a = await allowance(user, coupon.vendorId);
  const need = plans.couponRequiredTier(coupon);
  if (plans.tierRank(a.tier) < plans.tierRank(need)) {
    const err = new BadRequestError(`This deal is for ${plans.getPlan(need).label} members and up. Upgrade your plan to claim it.`);
    err.code = 'PLAN_UPGRADE_REQUIRED';
    throw err;
  }
  if (a.remaining <= 0) {
    const Vendor = mongoose.model('Vendor');
    const v = await Vendor.findById(oid(coupon.vendorId)).select('name').lean().catch(() => null);
    throw limitError(a, v && v.name);
  }
  return a;
}

// At the counter: completed redemptions only (the claim being scanned is the
// pending one). Returns the member's plan snapshot for the redemption record.
async function assertCanRedeem(user, vendorId, restaurantName) {
  const { plan, subscription, tier } = await planService.getUserPlan(user, 'customer');
  const snapshot = { memberTier: tier || plan.tier, memberPlanPriceUSD: plan.price?.monthly || 0, memberSubscriptionId: subscription?._id };
  if (user.testMode) return snapshot;
  const limit = plan.limits?.redemptionsPerRestaurantMonthly || 0;
  const done = await usedThisMonth(user._id, vendorId, { includePending: false });
  if (done >= limit) {
    const a = { tier: snapshot.memberTier, plan, limit, resetsAt: nextMonthStart() };
    const err = limitError(a, restaurantName);
    err.message = `This member has used all ${limit} ${plan.label} coupon${limit === 1 ? '' : 's'} at ${restaurantName || 'this restaurant'} this month.`;
    throw err;
  }
  return snapshot;
}

module.exports = { allowance, assertCanClaim, assertCanRedeem, usedThisMonth };
