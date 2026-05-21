const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userAgent: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, lowercase: true, trim: true, sparse: true, index: true },
  passwordHash: String,
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
  phoneVerifiedAt: Date,
  refreshTokens: [refreshTokenSchema],
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
