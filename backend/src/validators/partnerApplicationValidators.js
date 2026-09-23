const { z } = require('zod');

const optionalText = (max) => z.string().trim().max(max).optional().or(z.literal(''));

const CATEGORIES = ['dining', 'cafe', 'bar', 'bakery', 'activities', 'wellness', 'hotels', 'services', 'other'];

const applySchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: optionalText(40),
  address: optionalText(200),
  city: optionalText(80),
  category: z.enum(CATEGORIES).optional(),
  locations: z.coerce.number().int().min(1).max(500).optional(),
  message: optionalText(1000),
  // Honeypot: hidden from people, filled in by form-spamming bots.
  website: z.string().max(200).optional(),
});

const updateApplicationSchema = z.object({
  status: z.enum(['new', 'contacted', 'approved', 'rejected']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

module.exports = { applySchema, updateApplicationSchema, CATEGORIES };
