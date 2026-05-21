const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  plan: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'past_due'], default: 'active', index: true },
  startedAt: { type: Date, default: Date.now },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['apple_pay', 'google_pay', 'card', 'paypal'] },
  amountUSD: { type: Number, required: true },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
}, { timestamps: true });

subscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && this.currentPeriodEnd > new Date();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
