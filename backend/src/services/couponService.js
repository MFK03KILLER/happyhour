const couponRepo = require('../repositories/couponRepository');
const purchasedRepo = require('../repositories/purchasedCouponRepository');
const paymentService = require('./paymentService');
const subscriptionService = require('./subscriptionService');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Merchant = require('../models/Merchant');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const DEFAULT_DAILY_LIMIT = 3;

function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function annotateWithDistance(items, lat, lng) {
  if (lat == null || lng == null) return items;
  return items.map((c) => {
    const obj = c.toObject ? c.toObject() : c;
    let minKm = null;
    (obj.merchantIds || []).forEach((m) => {
      if (m && m.address && m.address.lat != null) {
        const km = haversineKm(lat, lng, m.address.lat, m.address.lng);
        if (km != null && (minKm == null || km < minKm)) minKm = km;
      }
    });
    obj.distanceKm = minKm;
    return obj;
  });
}

async function browse({ category, city, search, kind, lat, lng, sort = 'distance', order = 'asc', priceMin, priceMax, ratingMin, page = 1, limit = 20 }) {
  const filter = { status: 'active', validUntil: { $gte: new Date() }, offerKind: kind || 'member_perk' };
  if (category) filter.categorySlug = category;
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { subtitle: { $regex: search, $options: 'i' } },
  ];
  if (priceMin != null) filter.priceUSD = { ...(filter.priceUSD || {}), $gte: priceMin };
  if (priceMax != null) filter.priceUSD = { ...(filter.priceUSD || {}), $lte: priceMax };
  const skip = (page - 1) * limit;
  const fetchLimit = (sort === 'distance' || sort === 'rating') ? 200 : limit;
  let items = await couponRepo.list(filter, { skip: 0, limit: fetchLimit });
  if (city) {
    items = items.filter((c) => (c.merchantIds || []).some((m) => m.address && m.address.city && m.address.city.toLowerCase() === city.toLowerCase()));
  }
  if (ratingMin != null) {
    items = items.filter((c) => (c.merchantIds || []).some((m) => (m.rating || 0) >= ratingMin));
  }
  items = annotateWithDistance(items, lat, lng);
  const dir = order === 'desc' ? -1 : 1;
  if (sort === 'distance' && lat != null) {
    items.sort((a, b) => {
      const aa = a.distanceKm == null ? Infinity : a.distanceKm;
      const bb = b.distanceKm == null ? Infinity : b.distanceKm;
      return (aa - bb) * dir;
    });
  } else if (sort === 'rating') {
    items.sort((a, b) => {
      const ar = Math.max(...((a.merchantIds || []).map((m) => m.rating || 0)), 0);
      const br = Math.max(...((b.merchantIds || []).map((m) => m.rating || 0)), 0);
      return (br - ar) * dir;
    });
  } else if (sort === 'price') {
    items.sort((a, b) => ((a.priceUSD || 0) - (b.priceUSD || 0)) * dir);
  }
  const total = items.length;
  const paged = items.slice(skip, skip + limit);
  return { items: paged, total, page, limit };
}

async function getById(id) {
  const coupon = await couponRepo.findById(id);
  if (!coupon) throw new NotFoundError('Coupon not found');
  return coupon;
}

function couponIsActiveNow(coupon) {
  if (!coupon.activeWindow || !coupon.activeWindow.start || !coupon.activeWindow.end) return true;
  const days = coupon.activeWindow.days || ['daily'];
  const now = new Date();
  const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
  if (!days.includes('daily') && !days.includes(dayName)) return false;
  const [sh, sm] = coupon.activeWindow.start.split(':').map(Number);
  const [eh, em] = coupon.activeWindow.end.split(':').map(Number);
  const minNow = now.getHours() * 60 + now.getMinutes();
  const minStart = sh * 60 + sm;
  const minEnd = eh * 60 + em;
  return minNow >= minStart && minNow <= minEnd;
}

async function ensureDailyLimit(customerId) {
  const sub = await Subscription.findOne({ customerId, status: 'active' });
  const limit = (sub && sub.dailyClaimLimit) || DEFAULT_DAILY_LIMIT;
  const user = await User.findById(customerId);
  if (!user) throw new NotFoundError('User not found');
  const now = new Date();
  const resetAt = user.dailyClaimsResetAt ? new Date(user.dailyClaimsResetAt) : null;
  const sameDay = resetAt && resetAt.toDateString() === now.toDateString();
  if (!sameDay) {
    user.dailyClaimsCount = 0;
    user.dailyClaimsResetAt = now;
    await user.save();
  }
  if (user.dailyClaimsCount >= limit) {
    throw new ForbiddenError(`Daily limit reached. You can claim ${limit} coupons per day. Resets at midnight.`);
  }
  return { user, limit, remaining: limit - user.dailyClaimsCount };
}

async function claim({ customerId, couponId }) {
  const coupon = await couponRepo.findById(couponId);
  if (!coupon) throw new NotFoundError('Coupon not found');
  if (coupon.offerKind === 'surprise_bag') throw new BadRequestError('Surprise bags must be purchased, not claimed');
  if (coupon.status !== 'active') throw new BadRequestError('Coupon not available');
  if (coupon.validUntil < new Date()) throw new BadRequestError('Coupon expired');
  await subscriptionService.ensureActive(customerId);
  const { user } = await ensureDailyLimit(customerId);
  const purchased = await purchasedRepo.create({
    customerId,
    couponId: coupon._id,
    usesRemaining: coupon.maxUsesPerCustomer,
    expiresAt: coupon.validUntil,
  });
  user.dailyClaimsCount += 1;
  await user.save();
  const activeNow = couponIsActiveNow(coupon);
  return { purchased, coupon, activeNow, activeWindow: coupon.activeWindow || null };
}

async function purchaseSurpriseBag({ customerId, couponId, paymentMethod, fulfillment = 'pickup' }) {
  const coupon = await couponRepo.findById(couponId);
  if (!coupon) throw new NotFoundError('Coupon not found');
  if (coupon.offerKind !== 'surprise_bag') throw new BadRequestError('Not a surprise bag');
  if (coupon.status !== 'active') throw new BadRequestError('Bag not available');
  if (coupon.inventoryRemaining !== null && coupon.inventoryRemaining <= 0) {
    coupon.status = 'sold_out';
    await coupon.save();
    throw new BadRequestError('Sold out');
  }
  if (coupon.pickupWindowEnd && coupon.pickupWindowEnd < new Date()) throw new BadRequestError('Pickup window has ended');
  if (fulfillment === 'delivery' && !coupon.deliveryAvailable) throw new BadRequestError('Delivery not available');
  const fee = fulfillment === 'delivery' ? (coupon.deliveryFeeUSD || 0) : 0;
  const total = (coupon.priceUSD || 0) + fee;
  const payment = await paymentService.processMockPayment({
    customerId,
    amountUSD: total,
    method: paymentMethod,
    context: { kind: 'coupon_purchase', label: `${coupon.title} (Surprise Bag)`, refType: 'Coupon', refId: coupon._id },
  });
  if (coupon.inventoryRemaining !== null) {
    coupon.inventoryRemaining = Math.max(0, coupon.inventoryRemaining - 1);
    if (coupon.inventoryRemaining === 0) coupon.status = 'sold_out';
    await coupon.save();
  }
  const purchased = await purchasedRepo.create({
    customerId,
    couponId: coupon._id,
    usesRemaining: 1,
    paymentId: payment._id,
    expiresAt: coupon.pickupWindowEnd || coupon.validUntil,
  });
  return { purchased, payment, coupon, fulfillment };
}

async function purchase({ customerId, couponId, paymentMethod }) {
  const coupon = await couponRepo.findById(couponId);
  if (!coupon) throw new NotFoundError('Coupon not found');
  if (coupon.offerKind === 'surprise_bag') {
    return purchaseSurpriseBag({ customerId, couponId, paymentMethod });
  }
  throw new BadRequestError('This coupon is claim-only — use /claim instead');
}

async function createCoupon(data) {
  if (data.offerKind === 'surprise_bag' && data.inventoryCount != null) {
    data.inventoryRemaining = data.inventoryCount;
  }
  return couponRepo.create(data);
}
async function updateCoupon(id, data) {
  const updated = await couponRepo.update(id, data);
  if (!updated) throw new NotFoundError('Coupon not found');
  return updated;
}
async function deleteCoupon(id) {
  const deleted = await couponRepo.delete(id);
  if (!deleted) throw new NotFoundError('Coupon not found');
  return deleted;
}
async function listCoupons(filter, opts) {
  return { items: await couponRepo.list(filter, opts), total: await couponRepo.count(filter) };
}

async function couponsByMerchant({ merchantId, customerLat, customerLng, limit = 10 }) {
  const filter = { status: 'active', validUntil: { $gte: new Date() }, offerKind: 'member_perk', merchantIds: merchantId };
  const items = await couponRepo.list(filter, { skip: 0, limit });
  return annotateWithDistance(items, customerLat, customerLng);
}

async function getDailyStatus(customerId) {
  const sub = await Subscription.findOne({ customerId, status: 'active' });
  const limit = (sub && sub.dailyClaimLimit) || DEFAULT_DAILY_LIMIT;
  const user = await User.findById(customerId);
  if (!user) return { limit, used: 0, remaining: limit };
  const now = new Date();
  const resetAt = user.dailyClaimsResetAt ? new Date(user.dailyClaimsResetAt) : null;
  const sameDay = resetAt && resetAt.toDateString() === now.toDateString();
  const used = sameDay ? (user.dailyClaimsCount || 0) : 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}

async function bulkUpdate({ vendorId, ids, action }) {
  const Coupon = require('../models/Coupon');
  const filter = { vendorId, _id: { $in: ids } };
  if (action === 'pause') {
    return Coupon.updateMany(filter, { status: 'paused' });
  }
  if (action === 'activate') {
    return Coupon.updateMany(filter, { status: 'active' });
  }
  if (action === 'delete') {
    return Coupon.deleteMany(filter);
  }
  if (action === 'feature_on') {
    return Coupon.updateMany(filter, { featured: true });
  }
  if (action === 'feature_off') {
    return Coupon.updateMany(filter, { featured: false });
  }
  throw new BadRequestError('Unknown bulk action');
}

module.exports = {
  browse, getById, claim, purchase, purchaseSurpriseBag,
  createCoupon, updateCoupon, deleteCoupon, listCoupons,
  couponsByMerchant, getDailyStatus, haversineKm, couponIsActiveNow,
  bulkUpdate,
};
