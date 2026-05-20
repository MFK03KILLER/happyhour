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
  rating: {
    stars: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Redemption', redemptionSchema);
