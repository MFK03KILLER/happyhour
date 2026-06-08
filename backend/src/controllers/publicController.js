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

// List all 11 footer content blocks (title + section + version, no full content
// payload so a footer can render quickly). The customer-app uses this to know
// what links to render.
exports.contentList = asyncHandler(async (req, res) => {
  const items = await siteSettingService.listContent();
  res.json({ items: items.map((i) => ({ key: i.key, section: i.section, title: i.title, version: i.version, updatedAt: i.updatedAt })) });
});

// Full content of one block (returned when user clicks a footer link)
exports.contentOne = asyncHandler(async (req, res) => {
  const item = await siteSettingService.getContent(req.params.key);
  if (!item) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown content key' } });
  }
  res.json(item);
});

exports.plans = asyncHandler(async (req, res) => {
  const audience = req.query.audience === 'merchant' ? 'merchant' : 'customer';
  res.json({ audience, plans: plans.publicSummary(audience) });
});

exports.health = (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
};
