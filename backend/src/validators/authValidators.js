const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100),
  phone: z.string().optional(),
  acceptedTermsVersion: z.number().int().positive(),
});

const loginSchema = z.object({
  email: z.string().email(),
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
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  googleSignInSchema,
  appleSignInSchema,
};
