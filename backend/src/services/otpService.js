const OtpRequest = require('../models/OtpRequest');
const logger = require('../utils/logger');
const { BadRequestError, UnauthorizedError, TooManyRequestsError } = require('../utils/errors');

const OTP_TTL_SECONDS = 120;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;

function normalizePhone(phone) {
  if (!phone) return '';
  let p = String(phone).trim().replace(/[\s-()]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
  if (p.startsWith('9') && p.length === 10) p = '0' + p;
  return p;
}

function isValidIranianMobile(phone) {
  return /^09\d{9}$/.test(phone);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtp({ phone, purpose = 'login' }) {
  const normalized = normalizePhone(phone);
  if (!isValidIranianMobile(normalized)) {
    throw new BadRequestError('شماره موبایل نامعتبر است');
  }
  const recent = await OtpRequest.countDocuments({
    phone: normalized,
    createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
  });
  if (recent >= RATE_LIMIT_MAX) {
    throw new TooManyRequestsError('تعداد درخواست‌ها زیاد است — یک دقیقه صبر کنید');
  }
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);
  await OtpRequest.create({ phone: normalized, code, purpose, expiresAt });
  logger.info({ phone: normalized, code }, 'MOCK SMS — OTP sent');
  return {
    phone: normalized,
    expiresInSeconds: OTP_TTL_SECONDS,
    mockCode: code,
  };
}

async function verifyOtp({ phone, code }) {
  const normalized = normalizePhone(phone);
  const otp = await OtpRequest.findOne({
    phone: normalized,
    consumed: false,
    expiresAt: { $gte: new Date() },
  }).sort({ createdAt: -1 });
  if (!otp) throw new UnauthorizedError('کد منقضی شده یا یافت نشد');
  if (otp.attempts >= MAX_ATTEMPTS) {
    otp.consumed = true;
    await otp.save();
    throw new UnauthorizedError('تعداد تلاش‌ها بیش از حد است');
  }
  if (otp.code !== String(code)) {
    otp.attempts += 1;
    await otp.save();
    throw new UnauthorizedError('کد وارد شده اشتباه است');
  }
  otp.consumed = true;
  await otp.save();
  return { phone: normalized };
}

module.exports = { requestOtp, verifyOtp, normalizePhone, isValidIranianMobile };
