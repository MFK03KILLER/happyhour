const asyncHandler = require('../utils/asyncHandler');
const subscriptionService = require('../services/subscriptionService');

exports.me = asyncHandler(async (req, res) => {
  const sub = await subscriptionService.getMine(req.user._id);
  res.json({ subscription: sub, plans: subscriptionService.PLANS });
});

exports.subscribe = asyncHandler(async (req, res) => {
  const result = await subscriptionService.subscribe({
    customerId: req.user._id,
    plan: req.body.plan,
    paymentMethod: req.body.paymentMethod,
  });
  res.status(201).json(result);
});

exports.cancel = asyncHandler(async (req, res) => {
  const sub = await subscriptionService.cancel(req.user._id);
  res.json(sub);
});

exports.resume = asyncHandler(async (req, res) => {
  const sub = await subscriptionService.resume(req.user._id);
  res.json(sub);
});
