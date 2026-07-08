const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: String,
  // 'percent' → discountValue is 0-100 (% off). 'fixed' → discountValue is a USD amount off.
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  // Which subscription audience the code applies to.
  audience: { type: String, enum: ['customer', 'merchant', 'all'], default: 'customer' },
  // Empty array = valid for every tier. Otherwise restrict to these tiers (e.g. ['gold']).
  appliesToTiers: { type: [String], default: [] },
  minAmountUSD: { type: Number, default: 0, min: 0 },
  // null = unlimited total redemptions.
  maxRedemptions: { type: Number, default: null },
  timesRedeemed: { type: Number, default: 0 },
  // How many times a single user may use this code.
  perUserLimit: { type: Number, default: 1, min: 1 },
  redeemedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  active: { type: Boolean, default: true, index: true },
  startsAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
