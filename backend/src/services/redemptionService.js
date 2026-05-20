const redemptionRepo = require('../repositories/redemptionRepository');
const purchasedRepo = require('../repositories/purchasedCouponRepository');
const couponRepo = require('../repositories/couponRepository');
const userRepo = require('../repositories/userRepository');
const merchantRepo = require('../repositories/merchantRepository');
const qrService = require('./qrService');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const env = require('../config/env');

async function issueRedemption({ customerId, purchasedCouponId }) {
  const purchased = await purchasedRepo.findById(purchasedCouponId);
  if (!purchased) throw new NotFoundError('Purchased coupon not found');
  if (purchased.customerId.toString() !== customerId.toString()) throw new ForbiddenError('Not your coupon');
  if (purchased.status !== 'active') throw new BadRequestError('Coupon no longer active');
  if (purchased.usesRemaining <= 0) throw new BadRequestError('No uses remaining');
  if (purchased.expiresAt && purchased.expiresAt < new Date()) throw new BadRequestError('Coupon expired');
  const couponId = purchased.couponId._id || purchased.couponId;
  const payload = qrService.generateRedemptionPayload({
    redemptionId: 'pending',
    customerId,
    couponId,
    purchasedCouponId,
  });
  const redemption = await redemptionRepo.create({
    purchasedCouponId,
    customerId,
    couponId,
    qrNonce: payload.nonce,
    qrIssuedAt: payload.issuedAt,
    qrExpiresAt: payload.expiresAt,
    status: 'pending',
  });
  return { redemption, qrToken: payload.token, expiresIn: env.QR_TTL_SECONDS };
}

async function rotateRedemption({ customerId, redemptionId }) {
  const redemption = await redemptionRepo.findById(redemptionId);
  if (!redemption) throw new NotFoundError('Redemption not found');
  if (redemption.customerId._id.toString() !== customerId.toString()) throw new ForbiddenError('Not your redemption');
  if (redemption.status === 'completed') throw new BadRequestError('Already completed');
  const payload = qrService.generateRedemptionPayload({
    redemptionId: redemption._id.toString(),
    customerId,
    couponId: redemption.couponId._id,
    purchasedCouponId: redemption.purchasedCouponId._id,
  });
  redemption.qrNonce = payload.nonce;
  redemption.qrIssuedAt = payload.issuedAt;
  redemption.qrExpiresAt = payload.expiresAt;
  redemption.status = 'pending';
  await redemption.save();
  return { redemption, qrToken: payload.token, expiresIn: env.QR_TTL_SECONDS };
}

async function getRedemptionStatus({ customerId, redemptionId }) {
  const redemption = await redemptionRepo.findById(redemptionId);
  if (!redemption) throw new NotFoundError('Redemption not found');
  if (redemption.customerId._id.toString() !== customerId.toString()) throw new ForbiddenError('Not your redemption');
  if (redemption.status === 'pending' && redemption.qrExpiresAt < new Date()) {
    redemption.status = 'expired';
    await redemption.save();
  }
  return redemption;
}

async function scanByMerchant({ scannedByUserId, merchantId, qrToken }) {
  let decoded;
  try { decoded = qrService.decodeRedemptionPayload(qrToken); } catch { throw new BadRequestError('Invalid or expired QR code'); }
  const redemption = await redemptionRepo.findByNonce(decoded.nonce);
  if (!redemption) throw new NotFoundError('Redemption not found');
  if (redemption.status === 'completed') throw new BadRequestError('Coupon already redeemed');
  if (redemption.status === 'expired' || redemption.qrExpiresAt < new Date()) {
    redemption.status = 'expired';
    await redemption.save();
    throw new BadRequestError('QR code expired');
  }
  const purchased = await purchasedRepo.findById(redemption.purchasedCouponId._id);
  if (!purchased) throw new NotFoundError('Purchased coupon not found');
  if (purchased.usesRemaining <= 0) throw new BadRequestError('No uses remaining');
  const coupon = await couponRepo.findById(redemption.couponId._id);
  if (!coupon) throw new NotFoundError('Coupon not found');
  if (coupon.merchantIds && coupon.merchantIds.length > 0) {
    const allowed = coupon.merchantIds.some((m) => m._id.toString() === merchantId.toString());
    if (!allowed) throw new ForbiddenError('Coupon not valid at this merchant');
  }
  const customer = await userRepo.findById(redemption.customerId._id);
  const merchant = await merchantRepo.findById(merchantId);
  redemption.status = 'completed';
  redemption.scannedAt = new Date();
  redemption.scannedByUserId = scannedByUserId;
  redemption.merchantId = merchantId;
  redemption.customerSnapshot = {
    name: customer ? customer.fullName : '',
    email: customer ? customer.email : '',
    phone: customer ? customer.phone : '',
  };
  redemption.amountSavedUSD = coupon.priceUSD;
  await redemption.save();
  const updatedPurchased = await purchasedRepo.decrementUses(purchased._id);
  if (updatedPurchased.usesRemaining <= 0) {
    updatedPurchased.status = 'fully_redeemed';
    await updatedPurchased.save();
  }
  await couponRepo.incrementRedemptions(coupon._id);
  return {
    redemption,
    customer: customer ? { id: customer._id, fullName: customer.fullName, email: customer.email } : null,
    coupon,
    merchant,
    usesRemaining: updatedPurchased.usesRemaining,
    maxUses: coupon.maxUsesPerCustomer,
  };
}

async function listMerchantRedemptions(merchantId, opts) {
  return redemptionRepo.listByMerchant(merchantId, opts);
}
async function listCustomerOrders(customerId, opts) {
  return redemptionRepo.listByCustomer(customerId, opts);
}
async function getCustomerOrder(customerId, redemptionId) {
  const r = await redemptionRepo.findById(redemptionId);
  if (!r) throw new NotFoundError('Order not found');
  if (r.customerId._id.toString() !== customerId.toString()) throw new ForbiddenError('Not your order');
  return r;
}
async function rateOrder({ customerId, redemptionId, stars, comment }) {
  const r = await getCustomerOrder(customerId, redemptionId);
  r.rating = { stars, comment, ratedAt: new Date() };
  await r.save();
  return r;
}

module.exports = {
  issueRedemption,
  rotateRedemption,
  getRedemptionStatus,
  scanByMerchant,
  listMerchantRedemptions,
  listCustomerOrders,
  getCustomerOrder,
  rateOrder,
};
