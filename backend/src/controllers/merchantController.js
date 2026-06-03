const asyncHandler = require('../utils/asyncHandler');
const redemptionService = require('../services/redemptionService');
const statsService = require('../services/statsService');
const merchantService = require('../services/merchantService');
const couponService = require('../services/couponService');
const holidayService = require('../services/holidayService');
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

// Record this merchant_staff user's acceptance of the current Merchant TOS version.
exports.acceptTerms = asyncHandler(async (req, res) => {
  const siteSettingService = require('../services/siteSettingService');
  const User = require('../models/User');
  const current = await siteSettingService.getTerms('merchant');
  const submittedVersion = Number(req.body.version);
  if (!submittedVersion || submittedVersion !== current.version) {
    const { BadRequestError } = require('../utils/errors');
    throw new BadRequestError(`You must accept the current Merchant Terms (v${current.version}).`);
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { acceptedMerchantTerms: { version: current.version, acceptedAt: new Date() } },
  });
  res.json({ acceptedMerchantTerms: { version: current.version, acceptedAt: new Date() } });
});

// Holidays — merchant_staff with manage_hours permission
exports.listHolidays = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
  const data = await holidayService.listForMerchant(merchantId, { year });
  const today = await holidayService.isHolidayTodayFor(merchantId);
  res.json({ ...data, todayIsHoliday: today.isHoliday ? today : null });
});

exports.addHoliday = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const h = await holidayService.addCustom({
    merchantId,
    date: req.body.date,
    name: req.body.name,
    userId: req.user._id,
  });
  res.status(201).json(h);
});

exports.deleteHoliday = asyncHandler(async (req, res) => {
  const merchantId = ensureMerchant(req);
  const h = await holidayService.removeCustom({ holidayId: req.params.id, merchantId });
  res.json(h);
});
