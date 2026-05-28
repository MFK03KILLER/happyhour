const asyncHandler = require('../utils/asyncHandler');
const QRCode = require('qrcode');
const couponService = require('../services/couponService');
const merchantService = require('../services/merchantService');
const redemptionService = require('../services/redemptionService');
const holidayService = require('../services/holidayService');
const purchasedRepo = require('../repositories/purchasedCouponRepository');

// Stamp each coupon with `unavailableToday` (or null) so the UI can show a "closed today" badge.
// Loads each merchant's holiday set once and reuses it.
async function annotateHolidays(coupons) {
  const today = holidayService.todayYmd();
  const cache = new Map(); // merchantId -> Set<dateStr>
  async function setFor(mid) {
    if (!mid) return null;
    const key = String(mid);
    if (!cache.has(key)) cache.set(key, await holidayService.holidaySetForMerchant(mid));
    return cache.get(key);
  }
  return Promise.all(coupons.map(async (raw) => {
    const c = raw.toObject ? raw.toObject() : raw;
    c.unavailableToday = null;
    if (c.disabledOnHolidays === false) return c;
    for (const m of (c.merchantIds || [])) {
      const mid = (m && m._id) ? m._id : m;
      const set = await setFor(mid);
      if (set && set.has(today)) {
        c.unavailableToday = { reason: 'holiday', name: set.get(today), date: today };
        break;
      }
    }
    return c;
  }));
}

function parseFloatOrNull(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

exports.browse = asyncHandler(async (req, res) => {
  const query = {
    ...req.query,
    kind: req.query.kind || 'member_perk',
    lat: parseFloatOrNull(req.query.lat),
    lng: parseFloatOrNull(req.query.lng),
    priceMin: parseFloatOrNull(req.query.priceMin),
    priceMax: parseFloatOrNull(req.query.priceMax),
    ratingMin: parseFloatOrNull(req.query.ratingMin),
  };
  const result = await couponService.browse(query);
  result.items = await annotateHolidays(result.items);
  res.json(result);
});

exports.discoverMerchants = asyncHandler(async (req, res) => {
  const result = await merchantService.discover({
    category: req.query.category,
    search: req.query.search,
    lat: parseFloatOrNull(req.query.lat),
    lng: parseFloatOrNull(req.query.lng),
    sort: req.query.sort || 'distance',
    order: req.query.order || 'asc',
    priceMin: parseFloatOrNull(req.query.priceMin),
    priceMax: parseFloatOrNull(req.query.priceMax),
    ratingMin: parseFloatOrNull(req.query.ratingMin),
    page: parseInt(req.query.page || '1', 10),
    limit: parseInt(req.query.limit || '30', 10),
  });
  res.json(result);
});

exports.merchantDetail = asyncHandler(async (req, res) => {
  const merchant = await merchantService.getById(req.params.id);
  const coupons = await couponService.couponsByMerchant({
    merchantId: req.params.id,
    customerLat: parseFloatOrNull(req.query.lat),
    customerLng: parseFloatOrNull(req.query.lng),
  });
  const annotated = await annotateHolidays(coupons);
  const todayInfo = await holidayService.isHolidayTodayFor(req.params.id);
  res.json({ merchant, coupons: annotated, holidayToday: todayInfo.isHoliday ? todayInfo : null });
});

exports.dailyStatus = asyncHandler(async (req, res) => {
  const status = await couponService.getDailyStatus(req.user._id);
  res.json(status);
});

exports.surpriseBags = asyncHandler(async (req, res) => {
  const result = await couponService.browse({ ...req.query, kind: 'surprise_bag' });
  res.json(result);
});

exports.purchaseSurpriseBag = asyncHandler(async (req, res) => {
  const result = await couponService.purchaseSurpriseBag({
    customerId: req.user._id,
    couponId: req.params.id,
    paymentMethod: req.body.paymentMethod,
    fulfillment: req.body.fulfillment || 'pickup',
  });
  res.status(201).json(result);
});

exports.detail = asyncHandler(async (req, res) => {
  const c = await couponService.getById(req.params.id);
  const [annotated] = await annotateHolidays([c]);
  res.json(annotated);
});

exports.purchase = asyncHandler(async (req, res) => {
  const result = await couponService.purchase({
    customerId: req.user._id,
    couponId: req.params.id,
    paymentMethod: req.body.paymentMethod,
  });
  res.status(201).json(result);
});

exports.claim = asyncHandler(async (req, res) => {
  const result = await couponService.claim({
    customerId: req.user._id,
    couponId: req.params.id,
  });
  res.status(201).json(result);
});

exports.wallet = asyncHandler(async (req, res) => {
  const items = await purchasedRepo.findByCustomer(req.user._id);
  res.json({ items });
});

exports.issueRedemption = asyncHandler(async (req, res) => {
  const result = await redemptionService.issueRedemption({
    customerId: req.user._id,
    purchasedCouponId: req.params.purchasedCouponId,
  });
  const qrImage = await QRCode.toDataURL(result.qrToken, { errorCorrectionLevel: 'M', margin: 1, width: 512 });
  res.status(201).json({ ...result, qrImage });
});

exports.rotateRedemption = asyncHandler(async (req, res) => {
  const result = await redemptionService.rotateRedemption({
    customerId: req.user._id,
    redemptionId: req.params.redemptionId,
  });
  const qrImage = await QRCode.toDataURL(result.qrToken, { errorCorrectionLevel: 'M', margin: 1, width: 512 });
  res.json({ ...result, qrImage });
});

exports.redemptionStatus = asyncHandler(async (req, res) => {
  const r = await redemptionService.getRedemptionStatus({
    customerId: req.user._id,
    redemptionId: req.params.redemptionId,
  });
  res.json(r);
});

exports.orders = asyncHandler(async (req, res) => {
  const items = await redemptionService.listCustomerOrders(req.user._id, { skip: 0, limit: 50 });
  res.json({ items });
});

exports.orderDetail = asyncHandler(async (req, res) => {
  const r = await redemptionService.getCustomerOrder(req.user._id, req.params.redemptionId);
  res.json(r);
});

exports.rateOrder = asyncHandler(async (req, res) => {
  const r = await redemptionService.rateOrder({
    customerId: req.user._id,
    redemptionId: req.params.redemptionId,
    stars: req.body.stars,
    comment: req.body.comment,
  });
  res.json(r);
});
