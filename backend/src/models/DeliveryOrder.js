const mongoose = require('mongoose');

// A surprise-bag delivery order. Created at purchase time when the customer
// chooses fulfillment = delivery (only possible while the `delivery` feature
// flag is enabled). Status flow:
//   pending -> confirmed -> preparing -> out_for_delivery -> delivered
//   (cancelled can happen from pending/confirmed/preparing)
const addressSnapshotSchema = new mongoose.Schema({
  label: String,
  street: { type: String, required: true },
  city: String,
  state: String,
  zip: String,
  lat: Number,
  lng: Number,
  notes: String,          // "gate code 1234", "leave at door"
  phone: String,          // contact number for the courier
}, { _id: false });

const deliveryOrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  purchasedCouponId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchasedCoupon' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  // Human-friendly code the customer can quote on the phone.
  trackingCode: { type: String, unique: true, index: true },

  itemLabel: String,                       // coupon/bag title snapshot
  bagPriceUSD: { type: Number, default: 0 },
  deliveryFeeUSD: { type: Number, default: 0 },
  totalUSD: { type: Number, default: 0 },

  address: { type: addressSnapshotSchema, required: true },
  distanceKm: { type: Number, default: null },
  etaMinutes: { type: Number, default: null },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  // Stage timestamps (set as the order advances)
  placedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  preparingAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  cancelledBy: { type: String, enum: ['customer', 'merchant', 'admin', null], default: null },

  courier: {
    name: String,
    phone: String,
  },
  customerNotes: String,
}, { timestamps: true });

deliveryOrderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
deliveryOrderSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('DeliveryOrder', deliveryOrderSchema);
