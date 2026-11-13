const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/userRepository');
const siteSettingService = require('./siteSettingService');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('../utils/crypto');
const { UnauthorizedError, ConflictError, BadRequestError } = require('../utils/errors');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

async function register({ email, password, fullName, phone, acceptedTermsVersion }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ConflictError('Email already in use');
  const terms = await siteSettingService.getTerms();
  if (!acceptedTermsVersion || acceptedTermsVersion !== terms.version) {
    throw new BadRequestError('You must accept the current terms to register');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userRepo.create({
    email,
    passwordHash,
    fullName,
    phone,
    role: 'customer',
    acceptedTerms: { version: terms.version, acceptedAt: new Date() },
  });
  return issueTokens(user, 'unknown');
}

async function login({ email, password, userAgent }) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid credentials');
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new UnauthorizedError('Account temporarily locked');
  }
  if (user.status !== 'active') throw new UnauthorizedError('Account not active');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw new UnauthorizedError('Invalid credentials');
  }
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  return issueTokens(user, userAgent || 'unknown');
}

async function issueTokens(user, userAgent) {
  const payload = { sub: user._id.toString(), role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await userRepo.pushRefreshToken(user._id, { tokenHash, expiresAt, userAgent });
  return {
    accessToken,
    refreshToken,
    // Include fields the UI immediately needs (permissions especially) so we
    // don't have to do a second /auth/me roundtrip just to render the menu.
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      vendorId: user.vendorId,
      merchantId: user.merchantId,
      permissions: user.permissions || [],
      roleSlug: user.roleSlug || null,
      planTier: user.planTier || 'basic',
      status: user.status,
      acceptedTerms: user.acceptedTerms || null,
      acceptedMerchantTerms: user.acceptedMerchantTerms || null,
    },
  };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new UnauthorizedError('Missing refresh token');
  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); } catch { throw new UnauthorizedError('Invalid refresh token'); }
  const tokenHash = hashToken(refreshToken);
  const user = await userRepo.findById(decoded.sub);
  if (!user) throw new UnauthorizedError('User not found');
  const matched = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
  if (!matched) throw new UnauthorizedError('Refresh token revoked');
  await userRepo.pullRefreshToken(user._id, tokenHash);
  return issueTokens(user, 'refresh');
}

async function logout(userId, refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await userRepo.pullRefreshToken(userId, tokenHash);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepo.findById(userId);
  if (!user) throw new BadRequestError('User not found');
  // Accounts created with Apple/Google have no password yet: set one directly.
  if (user.passwordHash) {
    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!ok) throw new BadRequestError('Your current password is incorrect');
  }
  if ((currentPassword || '') === newPassword) throw new BadRequestError('Choose a password different from the current one');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
}

const RESET_TTL_MS = 30 * 60 * 1000;
const sha256 = (v) => require('crypto').createHash('sha256').update(v).digest('hex');

// Always answers the same way, whether or not the email has an account.
async function requestPasswordReset(email) {
  const User = require('../models/User');
  const mail = require('./mailService');
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase(), status: 'active' });
  if (!user) return;
  const token = require('crypto').randomBytes(32).toString('hex');
  user.resetTokenHash = sha256(token);
  user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();
  const link = `https://happyhourz.org/reset-password?token=${token}`;
  await mail.send({
    to: user.email,
    subject: 'Reset your Happy Hour password',
    text: `Hi ${user.fullName || ''},

Tap the link below to choose a new password. It works for 30 minutes.

${link}

If you didn't ask for this, ignore this email - your password stays the same.

Happy Hour`,
    html: `<p>Hi ${user.fullName || ''},</p><p>Tap the button below to choose a new password. It works for 30 minutes.</p><p><a href="${link}" style="display:inline-block;background:#0E5C5C;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Choose a new password</a></p><p style="color:#666">If you didn't ask for this, ignore this email - your password stays the same.</p><p>Happy Hour</p>`,
  }).catch((err) => require('../utils/logger').error({ err }, 'reset email failed'));
}

async function resetPassword(token, newPassword) {
  const User = require('../models/User');
  const user = await User.findOne({ resetTokenHash: sha256(String(token || '')), resetTokenExpires: { $gt: new Date() } }).select('+resetTokenHash');
  if (!user) throw new BadRequestError('This reset link is invalid or has expired. Ask for a new one.');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.refreshTokens = [];            // sign out everywhere
  await user.save();
  return { email: user.email, role: user.role };
}

// Self-service account deletion (Google Play / App Store requirement).
// Removes personal data and anonymises the user record. Payment records are
// kept for accounting/legal reasons but no longer point at identifiable data.
async function deleteAccount(userId, { password } = {}) {
  const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  if (user.role !== 'customer') throw new ForbiddenError('Staff and merchant accounts are removed by an administrator');
  if (user.passwordHash) {
    if (!password) throw new BadRequestError('Enter your password to confirm');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Incorrect password');
  }
  const PurchasedCoupon = require('../models/PurchasedCoupon');
  const Subscription = require('../models/Subscription');
  const Redemption = require('../models/Redemption');
  const DeliveryOrder = require('../models/DeliveryOrder');
  await Promise.all([
    PurchasedCoupon.deleteMany({ customerId: user._id }),
    Subscription.deleteMany({ audience: 'customer', customerId: user._id }),
    DeliveryOrder.updateMany({ customerId: user._id }, { $set: { address: { street: '[deleted]' }, customerNotes: '' } }),
    Redemption.updateMany({ customerId: user._id }, { $set: { customerSnapshot: { name: 'Deleted user', email: '', phone: '' } } }),
  ]);
  user.email = 'deleted-' + user._id + '@deleted.invalid';
  user.fullName = 'Deleted user';
  user.phone = '';
  user.avatarUrl = '';
  user.passwordHash = undefined;
  user.googleId = undefined;
  user.appleId = undefined;
  user.addresses = [];
  user.favoriteMerchantIds = [];
  user.refreshTokens = [];
  user.status = 'deleted';
  user.deletedAt = new Date();
  await user.save();
  return { deleted: true };
}

module.exports = {
  requestPasswordReset,
  resetPassword, register, login, refresh, logout, changePassword, issueTokens, deleteAccount };
