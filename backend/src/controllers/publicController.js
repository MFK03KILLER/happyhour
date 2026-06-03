const asyncHandler = require('../utils/asyncHandler');
const categoryRepo = require('../repositories/categoryRepository');
const merchantService = require('../services/merchantService');
const siteSettingService = require('../services/siteSettingService');
const plans = require('../config/plans');

exports.categories = asyncHandler(async (req, res) => {
  const items = await categoryRepo.list();
  res.json({ items });
});

exports.merchantBySlug = asyncHandler(async (req, res) => {
  const m = await merchantService.getBySlug(req.params.slug);
  res.json(m);
});

exports.terms = asyncHandler(async (req, res) => {
  const audience = req.query.audience === 'merchant' ? 'merchant' : 'consumer';
  const terms = await siteSettingService.getTerms(audience);
  res.json(terms);
});

exports.plans = asyncHandler(async (req, res) => {
  const audience = req.query.audience === 'merchant' ? 'merchant' : 'customer';
  res.json({ audience, plans: plans.publicSummary(audience) });
});

exports.health = (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
};
