const couponRepo = require('../repositories/couponRepository');
const purchasedRepo = require('../repositories/purchasedCouponRepository');
const paymentService = require('./paymentService');
const subscriptionService = require('./subscriptionService');
const { NotFoundError, BadRequestError } = require('../utils/errors');

async function browse({ category, city, search, kind, page = 1, limit = 20 }) {
  const filter = { status: 'active', validUntil: { $gte: new Date() } };
  if (category) filter.categorySlug = category;
  if (kind) filter.offerKind = kind;
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { subtitle: { $regex: search, $options: 'i' } },
  ];
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    couponRepo.list(filter, { skip, limit }),
    couponRepo.count(filter),
  ]);
  let filtered = items;
  if (city) {
    filtered = items.filter((c) => (c.merchantIds || []).some((m) => m.address && m.address.city && m.address.city.toLowerCase() === city.toLowerCase()));
  }
  return { items: filtered, total, page, limit };
}

async function getById(id) {
  const coupon = await couponRepo.findById(id);
  if (!coupon) throw new NotFoundError('Coupon not found');
  return coupon;
}

async function claim({ customerId, couponId }) {
  const coupon = await couponRepo.findById(couponId);
  if (!coupon) throw new NotFoundError('Coupon not found');
  if (coupon.offerKind === 'surprise_bag') throw new BadRequestError('Surprise bags must be purchased, not claimed');
  if (coupon.status !== 'active') throw new BadRequestError('Coupon not available');
  if (coupon.validUntil < new Date()) throw new BadRequestError('Coupon expired');
  await subscriptionService.ensureActive(customerId);
  const purchased = await purchasedRepo.create({
    customerId,
    couponId: coupon._id,
    usesRemaining: coupon.maxUsesPerCustomer,
    expiresAt: coupon.validUntil,
  });
  return { purchased, coupon };
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
  if (coupon.status !== 'active') throw new BadRequestError('Coupon not available');
  if (coupon.validUntil < new Date()) throw new BadRequestError('Coupon expired');
  const payment = await paymentService.processMockPayment({
    customerId,
    amountUSD: coupon.priceUSD,
    method: paymentMethod,
    context: { kind: 'coupon_purchase', label: coupon.title, refType: 'Coupon', refId: coupon._id },
  });
  const purchased = await purchasedRepo.create({
    customerId,
    couponId: coupon._id,
    usesRemaining: coupon.maxUsesPerCustomer,
    paymentId: payment._id,
    expiresAt: coupon.validUntil,
  });
  return { purchased, payment, coupon };
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

module.exports = { browse, getById, claim, purchase, purchaseSurpriseBag, createCoupon, updateCoupon, deleteCoupon, listCoupons };
