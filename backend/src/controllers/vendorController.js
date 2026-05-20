const asyncHandler = require('../utils/asyncHandler');
const merchantService = require('../services/merchantService');
const couponService = require('../services/couponService');
const statsService = require('../services/statsService');
const { ForbiddenError } = require('../utils/errors');

function ensureVendor(req) {
  if (!req.user.vendorId) throw new ForbiddenError('User not linked to vendor');
  return req.user.vendorId;
}

exports.listMyMerchants = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const items = await merchantService.listByVendor(vendorId);
  res.json({ items, total: items.length });
});

exports.listMyCoupons = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const result = await couponService.listCoupons({ vendorId }, { skip: 0, limit: 100 });
  res.json(result);
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const c = await couponService.createCoupon({ ...req.body, vendorId });
  res.status(201).json(c);
});

exports.stats = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const data = await statsService.vendorStats(vendorId);
  res.json(data);
});
