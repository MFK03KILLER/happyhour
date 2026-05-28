const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Audience: 'customer' (per-user) or 'merchant' (per-vendor)
  audience: { type: String, enum: ['customer', 'merchant'], default: 'customer', index: true },

  // For audience='customer': the user this sub belongs to
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
  // For audience='merchant': the vendor org this sub belongs to (shared by all the vendor's merchants)
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true, sparse: true },

  // Plan tier (basic = free, no subscription needed but stored for analytics)
  tier: { type: String, enum: ['basic', 'gold', 'premium'], default: 'gold', index: true },
  // Billing period
  plan: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'past_due'], default: 'active', index: true },
  startedAt: { type: Date, default: Date.now },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['apple_pay', 'google_pay', 'card', 'paypal', 'bank_transfer', 'po'] },
  amountUSD: { type: Number, required: true },
  // Legacy field kept for back-compat in couponService.ensureDailyLimit
  dailyClaimLimit: { type: Number, default: 3 },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
}, { timestamps: true });

subscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && this.currentPeriodEnd > new Date();
};

// Per-audience uniqueness: one active sub per customer / one per vendor
subscriptionSchema.index(
  { customerId: 1 },
  { unique: true, partialFilterExpression: { audience: 'customer', customerId: { $exists: true } } },
);
subscriptionSchema.index(
  { vendorId: 1 },
  { unique: true, partialFilterExpression: { audience: 'merchant', vendorId: { $exists: true } } },
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
