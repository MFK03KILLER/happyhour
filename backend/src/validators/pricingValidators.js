const { z } = require('zod');

// Stripe's minimum charge is $0.50.
const priceSchema = z.object({
  monthly: z.coerce.number().min(0.5).max(99999),
  // Customer memberships are monthly only (Nov 2026): yearly may be 0.
  yearly: z.coerce.number().min(0).max(999999).optional().default(0),
});

module.exports = { priceSchema };
