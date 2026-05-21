const { z } = require('zod');

const requestOtpSchema = z.object({
  phone: z.string().min(8).max(20),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6),
  fullName: z.string().min(2).max(100).optional(),
});

const loginSchema = z.object({
  phone: z.string().min(8).max(20),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

module.exports = { requestOtpSchema, verifyOtpSchema, loginSchema, refreshSchema };
