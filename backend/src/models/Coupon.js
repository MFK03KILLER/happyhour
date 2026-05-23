const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  merchantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' }],
  title: { type: String, required: true },
  subtitle: String,
  description: String,
  heroImageUrl: String,
  offerKind: { type: String, enum: ['member_perk', 'surprise_bag'], default: 'member_perk', index: true },
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
  requiredPlanTier: { type: String, enum: ['none', 'lite', 'plus', 'pro'], default: 'lite' },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true, index: true },
  priceUSD: { type: Number, default: 0, min: 0 },
  originalValueUSD: { type: Number, min: 0 },
  inventoryCount: { type: Number, default: null, min: 0 },
  inventoryRemaining: { type: Number, default: null, min: 0 },
  pickupWindowStart: Date,
  pickupWindowEnd: Date,
  deliveryAvailable: { type: Boolean, default: false },
  deliveryFeeUSD: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['draft', 'active', 'paused', 'expired', 'sold_out'], default: 'active', index: true },
  categorySlug: { type: String, index: true },
  tags: { type: [String], default: [], index: true },
  featured: { type: Boolean, default: false, index: true },
  todaysOffer: { type: Boolean, default: false, index: true },
  popupOffer: { type: Boolean, default: false },
  activeWindow: {
    days: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'daily'] }],
    start: String,
    end: String,
  },
}, { timestamps: true });

couponSchema.index({ offerKind: 1, status: 1, validUntil: 1 });
couponSchema.index({ featured: 1, todaysOffer: 1, status: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
