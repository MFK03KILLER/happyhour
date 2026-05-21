const mongoose = require('mongoose');

const otpRequestSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'verify'], default: 'login' },
  expiresAt: { type: Date, required: true, index: true },
  consumed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpRequest', otpRequestSchema);
