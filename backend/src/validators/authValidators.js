const { z } = require('zod');

// Phone-OTP (Persian flow)
const requestOtpSchema = z.object({
  phone: z.string().min(8).max(20),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6),
  fullName: z.string().min(2).max(100).optional(),
});

// Email-password register (kept for API back-compat; Persian seed doesn't use it)
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional(),
  acceptedTermsVersion: z.number().int().positive(),
});

// Login uses phone+password (Persian merchant/admin path; consumer goes through OTP).
const loginSchema = z.object({
  phone: z.string().min(8).max(20),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const googleSignInSchema = z.object({
  idToken: z.string().min(20),
  acceptedTermsVersion: z.number().int().positive().optional(),
});

const appleSignInSchema = z.object({
  idToken: z.string().min(20),
  fullName: z.string().max(100).optional(),
  acceptedTermsVersion: z.number().int().positive().optional(),
});

module.exports = {
  requestOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  googleSignInSchema,
  appleSignInSchema,
};
