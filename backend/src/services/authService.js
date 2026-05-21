const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/userRepository');
const otpService = require('./otpService');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('../utils/crypto');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');
const User = require('../models/User');

async function requestPhoneOtp({ phone }) {
  return otpService.requestOtp({ phone, purpose: 'login' });
}

async function loginWithOtp({ phone, code, fullName, userAgent }) {
  const verified = await otpService.verifyOtp({ phone, code });
  let user = await User.findOne({ phone: verified.phone });
  if (!user) {
    if (!fullName) throw new BadRequestError('برای ثبت‌نام، نام کامل خود را وارد کنید');
    user = await User.create({
      phone: verified.phone,
      fullName,
      role: 'customer',
      status: 'active',
      phoneVerifiedAt: new Date(),
    });
  } else {
    if (user.status !== 'active') throw new UnauthorizedError('حساب کاربری فعال نیست');
    if (!user.phoneVerifiedAt) user.phoneVerifiedAt = new Date();
    user.lastLoginAt = new Date();
    await user.save();
  }
  return issueTokens(user, userAgent || 'unknown');
}

async function loginWithPassword({ phone, password, userAgent }) {
  const normalized = otpService.normalizePhone(phone);
  const user = await User.findOne({ phone: normalized });
  if (!user || !user.passwordHash) throw new UnauthorizedError('شماره موبایل یا رمز عبور نادرست است');
  if (user.status !== 'active') throw new UnauthorizedError('حساب کاربری فعال نیست');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('شماره موبایل یا رمز عبور نادرست است');
  user.lastLoginAt = new Date();
  await user.save();
  return issueTokens(user, userAgent || 'unknown');
}

async function issueTokens(user, userAgent) {
  const payload = { sub: user._id.toString(), role: user.role, phone: user.phone };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await userRepo.pushRefreshToken(user._id, { tokenHash, expiresAt, userAgent });
  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      vendorId: user.vendorId,
      merchantId: user.merchantId,
      permissions: user.permissions,
    },
  };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw new UnauthorizedError('توکن بازنشانی موجود نیست');
  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); } catch { throw new UnauthorizedError('توکن نامعتبر است'); }
  const tokenHash = hashToken(refreshToken);
  const user = await userRepo.findById(decoded.sub);
  if (!user) throw new UnauthorizedError('کاربر یافت نشد');
  const matched = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
  if (!matched) throw new UnauthorizedError('توکن باطل شده است');
  await userRepo.pullRefreshToken(user._id, tokenHash);
  return issueTokens(user, 'refresh');
}

async function logout(userId, refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await userRepo.pullRefreshToken(userId, tokenHash);
}

module.exports = { requestPhoneOtp, loginWithOtp, loginWithPassword, refresh, logout, issueTokens };
