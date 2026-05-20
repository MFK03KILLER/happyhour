const mongoose = require('mongoose');

const purchasedCouponSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
  purchasedAt: { type: Date, default: Date.now },
  usesRemaining: { type: Number, required: true, min: 0 },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  status: { type: String, enum: ['active', 'fully_redeemed', 'expired', 'refunded'], default: 'active', index: true },
  expiresAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('PurchasedCoupon', purchasedCouponSchema);
