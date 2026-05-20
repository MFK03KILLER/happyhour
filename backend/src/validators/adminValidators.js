const { z } = require('zod');

const vendorSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

const merchantSchema = z.object({
  vendorId: z.string(),
  name: z.string().min(2),
  slug: z.string().optional(),
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  category: z.enum(['restaurant', 'cafe', 'bar', 'retail', 'fitness', 'beauty', 'entertainment']),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  acceptsNFC: z.boolean().optional(),
});

const couponSchema = z.object({
  vendorId: z.string(),
  merchantIds: z.array(z.string()).optional(),
  title: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  heroImageUrl: z.string().url().optional(),
  offerType: z.enum(['BOGO', 'PERCENT_OFF', 'FLAT_OFF', 'FREE_ITEM', 'BUNDLE']),
  discountValue: z.number().optional(),
  termsAndConditions: z.string().optional(),
  maxUsesPerCustomer: z.number().int().min(1).default(1),
  totalRedemptionsLimit: z.number().int().optional(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  priceUSD: z.number().min(0).default(0),
  categorySlug: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'expired']).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['admin', 'vendor', 'merchant_staff', 'customer']),
  vendorId: z.string().optional(),
  merchantId: z.string().optional(),
  phone: z.string().optional(),
});

module.exports = { vendorSchema, merchantSchema, couponSchema, createUserSchema };
