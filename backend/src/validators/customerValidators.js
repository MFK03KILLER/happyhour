const { z } = require('zod');

const purchaseSchema = z.object({
  paymentMethod: z.enum(['apple_pay', 'google_pay', 'card', 'paypal']),
  fulfillment: z.enum(['pickup', 'delivery']).optional(),
  // Required when fulfillment = delivery: one of the customer's saved addresses.
  addressId: z.string().optional(),
  deliveryNotes: z.string().max(300).optional(),
});

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  street: z.string().min(3).max(200),
  city: z.string().max(80).optional(),
  state: z.string().max(40).optional(),
  zip: z.string().max(20).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  notes: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  isDefault: z.boolean().optional(),
});

const deliveryQuoteSchema = z.object({
  merchantId: z.string(),
  addressId: z.string(),
  subtotalUSD: z.coerce.number().min(0).optional(),
});

const deliveryStatusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
  courierName: z.string().max(80).optional(),
  courierPhone: z.string().max(30).optional(),
  cancelReason: z.string().max(200).optional(),
});

const browseQuerySchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  kind: z.enum(['member_perk', 'surprise_bag']).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  sort: z.enum(['distance', 'rating', 'price']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  ratingMin: z.coerce.number().optional(),
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

module.exports = {
  purchaseSchema, browseQuerySchema, rateSchema, scanSchema,
  addressSchema, deliveryQuoteSchema, deliveryStatusSchema,
};
