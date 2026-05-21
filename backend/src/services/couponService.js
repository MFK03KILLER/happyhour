const couponRepo = require('../repositories/couponRepository');
const purchasedRepo = require('../repositories/purchasedCouponRepository');
const paymentService = require('./paymentService');
const subscriptionService = require('./subscriptionService');
const { NotFoundError, BadRequestError } = require('../utils/errors');

async function browse({ category, city, search, page = 1, limit = 20 }) {
  const filter = { status: 'active', validUntil: { $gte: new Date() } };
  if (category) filter.categorySlug = category;
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

async function purchase({ customerId, couponId, paymentMethod }) {
  const coupon = await couponRepo.findById(couponId);
  if (!coupon) throw new NotFoundError('Coupon not found');
  if (coupon.status !== 'active') throw new BadRequestError('Coupon not available');
  if (coupon.validUntil < new Date()) throw new BadRequestError('Coupon expired');
  const payment = await paymentService.processMockPayment({
    customerId,
    amountUSD: coupon.priceUSD,
    method: paymentMethod,
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

module.exports = { browse, getById, claim, purchase, createCoupon, updateCoupon, deleteCoupon, listCoupons };
