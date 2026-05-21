const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amountUSD: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['apple_pay', 'google_pay', 'card', 'paypal'], required: true, index: true },
  last4: String,
  brand: String,
  status: { type: String, enum: ['succeeded', 'failed', 'refunded'], default: 'succeeded', index: true },
  mockTransactionId: { type: String, unique: true, sparse: true },
  context: {
    kind: { type: String, enum: ['subscription', 'coupon_purchase', 'other'], default: 'other', index: true },
    label: String,
    refType: String,
    refId: { type: mongoose.Schema.Types.ObjectId },
  },
}, { timestamps: true });

paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
