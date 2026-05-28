const plans = require('../config/plans');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { ForbiddenError } = require('../utils/errors');

// Resolve a user's effective plan.
// - Looks at User.planTier (cached) and the underlying active Subscription.
// - Falls back to 'basic' if nothing/expired.
async function getUserPlan(userOrId, audienceOverride) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) return { plan: plans.getPlan('basic', 'customer'), subscription: null };
  const audience = audienceOverride || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');

  // For merchants/vendors the subscription tier follows the VENDOR (not each user).
  // For customers it's per-user.
  const subQuery = audience === 'merchant'
    ? { vendorId: user.vendorId, audience: 'merchant', status: 'active' }
    : { customerId: user._id, audience: 'customer', status: 'active' };

  let sub = await Subscription.findOne(subQuery);
  // Back-compat: old subs may not have audience set
  if (!sub && audience === 'customer') sub = await Subscription.findOne({ customerId: user._id, status: 'active' });

  let tier = user.planTier || 'basic';
  // Legacy migration: if a subscription exists but has no tier (pre-3-tier era),
  // assume Gold — that was the only paid plan back then.
  if (sub && sub.tier) tier = sub.tier;
  else if (sub) tier = 'gold';
  if (sub && sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) tier = 'basic'; // expired

  return { plan: plans.getPlan(tier, audience), subscription: sub, tier, audience };
}

function hasFeature(plan, key) {
  if (!plan || !plan.features) return false;
  const v = plan.features[key];
  return !!v && v !== 'none' && v !== false;
}

function getFeature(plan, key) {
  return plan && plan.features ? plan.features[key] : undefined;
}

function getLimit(plan, key) {
  if (!plan || !plan.limits) return 0;
  return plan.limits[key] ?? 0;
}

// Express middleware: blocks request unless the user's plan has `featureKey` truthy.
// Use for hard-locked features (e.g. exclusive content).
function requireFeature(featureKey, opts = {}) {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new ForbiddenError('Authentication required');
      const { plan } = await getUserPlan(req.user, opts.audience);
      if (!hasFeature(plan, featureKey)) {
        return res.status(403).json({
          error: {
            code: 'PLAN_UPGRADE_REQUIRED',
            message: `Your plan does not include "${featureKey}".`,
            details: { currentTier: plan.tier, requiredFeature: featureKey },
          },
        });
      }
      req.plan = plan;
      next();
    } catch (e) { next(e); }
  };
}

// Express middleware: blocks request unless plan tier is in allowed list.
function requireTier(allowedTiers, opts = {}) {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new ForbiddenError('Authentication required');
      const { plan } = await getUserPlan(req.user, opts.audience);
      if (!allowedTiers.includes(plan.tier)) {
        return res.status(403).json({
          error: {
            code: 'PLAN_UPGRADE_REQUIRED',
            message: `Available on ${allowedTiers.join(' or ')} plans.`,
            details: { currentTier: plan.tier, allowedTiers },
          },
        });
      }
      req.plan = plan;
      next();
    } catch (e) { next(e); }
  };
}

module.exports = {
  getUserPlan,
  hasFeature,
  getFeature,
  getLimit,
  requireFeature,
  requireTier,
};
