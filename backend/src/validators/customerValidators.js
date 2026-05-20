const { z } = require('zod');

const purchaseSchema = z.object({
  paymentMethod: z.enum(['apple_pay', 'google_pay', 'card', 'paypal']),
});

const browseQuerySchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const rateSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

const scanSchema = z.object({
  qrPayload: z.string().min(10),
});

module.exports = { purchaseSchema, browseQuerySchema, rateSchema, scanSchema };
