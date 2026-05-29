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
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new UnauthorizedError('Current password incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
}

module.exports = { register, login, refresh, logout, changePassword, issueTokens };
