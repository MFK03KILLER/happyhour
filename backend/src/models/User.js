const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userAgent: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  phone: String,
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'vendor', 'merchant_staff', 'customer'], required: true, index: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
  permissions: {
    type: [String],
    enum: ['manage_coupons', 'view_stats', 'manage_team', 'scan_only', 'manage_merchants'],
    default: [],
  },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  refreshTokens: [refreshTokenSchema],
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
