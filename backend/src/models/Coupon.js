const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  merchantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' }],
  title: { type: String, required: true },
  subtitle: String,
  description: String,
  heroImageUrl: String,
  offerType: {
    type: String,
    enum: ['BOGO', 'PERCENT_OFF', 'FLAT_OFF', 'FREE_ITEM', 'BUNDLE'],
    required: true,
  },
  discountValue: Number,
  termsAndConditions: String,
  maxUsesPerCustomer: { type: Number, default: 1, min: 1 },
  totalRedemptionsLimit: Number,
  totalRedemptionsCount: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true, index: true },
  priceUSD: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['draft', 'active', 'paused', 'expired'], default: 'active', index: true },
  categorySlug: { type: String, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
