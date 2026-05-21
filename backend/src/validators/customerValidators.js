const { z } = require('zod');

const purchaseSchema = z.object({
  paymentMethod: z.enum(['apple_pay', 'google_pay', 'card', 'paypal']),
  fulfillment: z.enum(['pickup', 'delivery']).optional(),
});

const browseQuerySchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  kind: z.enum(['member_perk', 'surprise_bag']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const rateSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

const scanSchema = z.object({
  qrPayload: z.string().optional(),
  humanCode: z.string().length(6).optional(),
}).refine((d) => !!(d.qrPayload || d.humanCode), { message: 'qrPayload or humanCode required' });

module.exports = { purchaseSchema, browseQuerySchema, rateSchema, scanSchema };
