const asyncHandler = require('../utils/asyncHandler');
const redemptionService = require('../services/redemptionService');
const statsService = require('../services/statsService');
const merchantService = require('../services/merchantService');
const couponService = require('../services/couponService');
const Coupon = require('../models/Coupon');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

function ensureMerchant(req) {
  if (!req.user.merchantId) throw new ForbiddenError('User not linked to merchant');
  return req.user.merchantId;
}

exports.scan = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const result = await redemptionService.scanByMerchant({
    scannedByUserId: req.user._id,
    merchantId,
    qrToken: req.body.qrPayload,
  });
  res.json(result);
});

exports.recent = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const items = await redemptionService.listMerchantRedemptions(merchantId, { skip: 0, limit: 50 });
  res.json({ items });
});

exports.stats = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const data = await statsService.merchantStats(merchantId);
  res.json(data);
});

exports.me = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const m = await merchantService.getById(merchantId);
  res.json(m);
});

exports.updateMe = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const allowed = ['name', 'description', 'subCategory', 'cuisineTags', 'priceLevel', 'phone', 'website', 'logoUrl', 'coverImageUrl', 'address', 'hours', 'offPeakHours', 'acceptsNFC'];
  const update = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
  const m = await merchantService.update(merchantId, update);
  res.json(m);
});

exports.listMyCoupons = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const items = await Coupon.find({ merchantIds: merchantId }).sort({ createdAt: -1 });
  res.json({ items });
});

exports.createMyCoupon = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const m = await merchantService.getById(merchantId);
  const data = { ...req.body, vendorId: m.vendorId._id || m.vendorId, merchantIds: [merchantId] };
  const c = await couponService.createCoupon(data);
  res.status(201).json(c);
});

exports.updateMyCoupon = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const existing = await Coupon.findById(req.params.id);
  if (!existing) throw new NotFoundError('Coupon not found');
  const ownsCoupon = (existing.merchantIds || []).some((mid) => mid.toString() === merchantId.toString());
  if (!ownsCoupon) throw new ForbiddenError('Not your coupon');
  const c = await couponService.updateCoupon(req.params.id, req.body);
  res.json(c);
});

exports.deleteMyCoupon = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const existing = await Coupon.findById(req.params.id);
  if (!existing) throw new NotFoundError('Coupon not found');
  const ownsCoupon = (existing.merchantIds || []).some((mid) => mid.toString() === merchantId.toString());
  if (!ownsCoupon) throw new ForbiddenError('Not your coupon');
  await couponService.deleteCoupon(req.params.id);
  res.status(204).end();
});
