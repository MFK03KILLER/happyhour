const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amountUSD: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['apple_pay', 'google_pay', 'card', 'paypal'], required: true },
  last4: String,
  brand: String,
  status: { type: String, enum: ['succeeded', 'failed', 'refunded'], default: 'succeeded' },
  mockTransactionId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
