const { signQrPayload, verifyQrPayload, randomNonce } = require('../utils/crypto');
const env = require('../config/env');

function generateRedemptionPayload({ redemptionId, customerId, couponId, purchasedCouponId }) {
  const nonce = randomNonce();
  const issuedAt = new Date();
  const expiresAt = new Date(Date.now() + env.QR_TTL_SECONDS * 1000);
  const token = signQrPayload({ redemptionId, customerId, couponId, purchasedCouponId, nonce });
  return { token, nonce, issuedAt, expiresAt };
}

function decodeRedemptionPayload(token) {
  return verifyQrPayload(token);
}

module.exports = { generateRedemptionPayload, decodeRedemptionPayload };
