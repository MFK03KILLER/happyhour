const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userAgent: String,
}, { _id: false });

// Saved delivery addresses (customer address book).
const savedAddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },       // Home / Work / ...
  street: { type: String, required: true },
  city: String,
  state: String,
  zip: String,
  lat: Number,
  lng: Number,
  notes: String,                                   // courier instructions
  phone: String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: String,
  phone: String,
  fullName: { type: String, required: true },
  avatarUrl: String,
  authProvider: { type: String, enum: ['password', 'google', 'apple'], default: 'password' },
  googleId: { type: String, index: true, sparse: true },
  appleId: { type: String, index: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['admin', 'vendor', 'merchant_staff', 'customer'], required: true, index: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
  permissions: { type: [String], default: [] },
  roleSlug: { type: String, index: true },
  status: { type: String, enum: ['active', 'suspended', 'pending', 'deleted'], default: 'active' },
  deletedAt: Date,
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  refreshTokens: [refreshTokenSchema],
  dailyClaimsCount: { type: Number, default: 0 },
  dailyClaimsResetAt: Date,
  favoriteMerchantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' }],
  addresses: { type: [savedAddressSchema], default: [] },
  // Consumer terms acceptance (customer signup)
  acceptedTerms: {
    version: { type: Number, default: null },
    acceptedAt: { type: Date, default: null },
  },
  // Merchant terms acceptance (vendor/merchant_staff users — recorded on first
  // login or on each new version bump via /merchant/accept-terms etc.)
  acceptedMerchantTerms: {
    version: { type: Number, default: null },
    acceptedAt: { type: Date, default: null },
  },
  planTier: {
    type: String,
    enum: ['basic', 'gold', 'premium'],
    default: 'basic',
    index: true,
  },
  // Test / QA accounts. When true this user bypasses ALL claim & redemption
  // restrictions: the daily claim limit, the happy-hour active-time window,
  // and holiday blackout dates. Intended only for internal testing accounts.
  testMode: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
