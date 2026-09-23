const { z } = require('zod');

// Stripe's minimum charge is $0.50.
const priceSchema = z.object({
  monthly: z.coerce.number().min(0.5).max(99999),
  yearly: z.coerce.number().min(0.5).max(999999),
});

module.exports = { priceSchema };
