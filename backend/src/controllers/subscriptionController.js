const asyncHandler = require('../utils/asyncHandler');
const subscriptionService = require('../services/subscriptionService');
const planService = require('../services/planService');
const plans = require('../config/plans');

exports.me = asyncHandler(async (req, res) => {
  const audience = req.query.audience || (req.user.role === 'vendor' || req.user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const data = await subscriptionService.getMine(req.user, audience);
  res.json({
    audience,
    tier: data.tier,
    plan: data.plan,
    subscription: data.subscription,
    available: plans.publicSummary(audience),
  });
});

exports.subscribe = asyncHandler(async (req, res) => {
  const audience = req.body.audience || (req.user.role === 'vendor' || req.user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const result = await subscriptionService.subscribe({
    userOrId: req.user,
    tier: req.body.tier,
    plan: req.body.plan,
    paymentMethod: req.body.paymentMethod,
    audience,
  });
  res.status(201).json(result);
});

exports.cancel = asyncHandler(async (req, res) => {
  const audience = req.query.audience || (req.user.role === 'vendor' || req.user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const sub = await subscriptionService.cancel(req.user, audience);
  res.json(sub);
});

exports.resume = asyncHandler(async (req, res) => {
  const audience = req.query.audience || (req.user.role === 'vendor' || req.user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const sub = await subscriptionService.resume(req.user, audience);
  res.json(sub);
});

exports.myPlan = asyncHandler(async (req, res) => {
  const audience = req.query.audience || (req.user.role === 'vendor' || req.user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const { plan, tier } = await planService.getUserPlan(req.user, audience);
  res.json({ audience, tier, plan });
});
