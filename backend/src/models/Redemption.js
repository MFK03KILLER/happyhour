const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  purchasedCouponId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchasedCoupon', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  qrNonce: { type: String, required: true, unique: true, index: true },
  qrIssuedAt: { type: Date, default: Date.now },
  qrExpiresAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed', 'expired', 'failed'], default: 'pending', index: true },
  scannedAt: Date,
  scannedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerSnapshot: {
    name: String,
    email: String,
    phone: String,
  },
  amountSavedUSD: Number,
  // The restaurant (vendor) and the member's plan at the moment of the scan -
  // used for the monthly per-restaurant allowance and for paying restaurants
  // back by plan.
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true },
  memberTier: { type: String, enum: ['free', 'basic', 'gold', 'premium'] },
  memberPlanPriceUSD: Number,
  memberSubscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  rating: {
    stars: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Redemption', redemptionSchema);
