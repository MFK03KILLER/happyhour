const asyncHandler = require('../utils/asyncHandler');
const categoryRepo = require('../repositories/categoryRepository');
const merchantService = require('../services/merchantService');

exports.categories = asyncHandler(async (req, res) => {
  const items = await categoryRepo.list();
  res.json({ items });
});

exports.merchantBySlug = asyncHandler(async (req, res) => {
  const m = await merchantService.getBySlug(req.params.slug);
  res.json(m);
});

exports.health = (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
};
