const { customAlphabet } = require('nanoid');
const DeliveryOrder = require('../models/DeliveryOrder');
const Merchant = require('../models/Merchant');
const User = require('../models/User');
const siteSettingService = require('./siteSettingService');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const trackingId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

// ---------------- Settings ----------------
// Stored as a SiteSetting so the admin can tune fees without a deploy.
const SETTINGS_KEY = 'delivery_settings';
const DEFAULT_SETTINGS = {
  baseFeeUSD: 4.99,        // flat fee every delivery starts from
  perKmUSD: 1.0,           // added per km of distance (when coords known)
  freeOverUSD: 50,         // order subtotal at/above this ships free (0 = never)
  minOrderUSD: 0,          // minimum bag subtotal to allow delivery
  maxRadiusKm: 15,         // beyond this we refuse delivery
  prepMinutes: 15,         // kitchen prep time baked into the ETA
  minutesPerKm: 3,         // courier travel pace for the ETA
};

async function getSettings() {
  const stored = await siteSettingService.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

async function updateSettings(patch, userId) {
  const current = await getSettings();
  const next = { ...current };
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (patch[k] !== undefined && patch[k] !== null && patch[k] !== '') {
      const n = Number(patch[k]);
      if (Number.isNaN(n) || n < 0) throw new BadRequestError(`Invalid value for ${k}`);
      next[k] = n;
    }
  }
  await siteSettingService.set(SETTINGS_KEY, next, userId);
  return next;
}

// ---------------- Quoting ----------------
function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const round2 = (n) => Math.round(n * 100) / 100;

// Computes fee + ETA for delivering from `merchant` to `address`.
// Throws when delivery is not possible (too far / below minimum).
async function quote({ merchant, address, subtotalUSD = 0 }) {
  const s = await getSettings();
  if (s.minOrderUSD > 0 && subtotalUSD > 0 && subtotalUSD < s.minOrderUSD) {
    throw new BadRequestError(`Delivery requires a minimum order of $${s.minOrderUSD.toFixed(2)}`);
  }
  const km = haversineKm(merchant?.address?.lat, merchant?.address?.lng, address?.lat, address?.lng);
  if (km != null && km > s.maxRadiusKm) {
    throw new BadRequestError(`This address is outside the delivery area (max ${s.maxRadiusKm} km)`);
  }
  let feeUSD = s.baseFeeUSD + (km != null ? km * s.perKmUSD : 0);
  feeUSD = round2(feeUSD);
  const free = s.freeOverUSD > 0 && subtotalUSD >= s.freeOverUSD;
  if (free) feeUSD = 0;
  const etaMinutes = Math.round(s.prepMinutes + (km != null ? km * s.minutesPerKm : 10));
  return {
    feeUSD,
    distanceKm: km != null ? round2(km) : null,
    etaMinutes,
    freeDelivery: free,
    settings: { maxRadiusKm: s.maxRadiusKm, freeOverUSD: s.freeOverUSD, minOrderUSD: s.minOrderUSD },
  };
}

// Resolve one of the customer's saved addresses.
async function resolveAddress(customerId, addressId) {
  const user = await User.findById(customerId);
  if (!user) throw new NotFoundError('User not found');
  const addr = (user.addresses || []).id(addressId)
    || (user.addresses || []).find((a) => a._id.toString() === String(addressId));
  if (!addr) throw new BadRequestError('Delivery address not found — add one in your profile');
  return { user, address: addr };
}

async function quoteForCustomer({ customerId, merchantId, addressId, subtotalUSD = 0 }) {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new NotFoundError('Merchant not found');
  const { address } = await resolveAddress(customerId, addressId);
  const q = await quote({ merchant, address, subtotalUSD });
  return { ...q, merchantId, addressId };
}

// ---------------- Order creation (called from couponService.purchaseSurpriseBag) ----------------
async function createOrder({ customer, merchant, coupon, purchased, payment, address, quoteResult, notes }) {
  return DeliveryOrder.create({
    customerId: customer._id,
    merchantId: merchant._id,
    vendorId: merchant.vendorId,
    couponId: coupon._id,
    purchasedCouponId: purchased._id,
    paymentId: payment ? payment._id : undefined,
    trackingCode: `HH-${trackingId()}`,
    itemLabel: coupon.title,
    bagPriceUSD: coupon.priceUSD || 0,
    deliveryFeeUSD: quoteResult.feeUSD,
    totalUSD: round2((coupon.priceUSD || 0) + quoteResult.feeUSD),
    address: {
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      lat: address.lat,
      lng: address.lng,
      notes: address.notes,
      phone: address.phone || customer.phone,
    },
    distanceKm: quoteResult.distanceKm,
    etaMinutes: quoteResult.etaMinutes,
    status: 'pending',
    placedAt: new Date(),
    customerNotes: notes || '',
  });
}

// ---------------- Status transitions ----------------
const FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};
const STAMP = {
  confirmed: 'confirmedAt',
  preparing: 'preparingAt',
  out_for_delivery: 'outForDeliveryAt',
  delivered: 'deliveredAt',
  cancelled: 'cancelledAt',
};

function applyTransition(order, nextStatus, { courierName, courierPhone, cancelReason, cancelledBy, force } = {}) {
  if (!force && !FLOW[order.status].includes(nextStatus)) {
    throw new BadRequestError(`Cannot move a ${order.status.replace(/_/g, ' ')} order to ${nextStatus.replace(/_/g, ' ')}`);
  }
  order.status = nextStatus;
  const stampField = STAMP[nextStatus];
  if (stampField) order[stampField] = new Date();
  if (nextStatus === 'out_for_delivery' && (courierName || courierPhone)) {
    order.courier = { name: courierName || '', phone: courierPhone || '' };
  }
  if (nextStatus === 'cancelled') {
    order.cancelReason = cancelReason || '';
    order.cancelledBy = cancelledBy || null;
  }
  return order;
}

const POPULATE = [
  { path: 'merchantId', select: 'name slug logoUrl address phone' },
  { path: 'customerId', select: 'fullName email phone' },
  { path: 'couponId', select: 'title heroImageUrl' },
];

async function getOrder(id) {
  const order = await DeliveryOrder.findById(id).populate(POPULATE);
  if (!order) throw new NotFoundError('Delivery order not found');
  return order;
}

// Customer -------------------------------------------------
async function listForCustomer(customerId) {
  return DeliveryOrder.find({ customerId }).sort({ createdAt: -1 }).limit(50).populate(POPULATE);
}

async function getForCustomer(customerId, id) {
  const order = await getOrder(id);
  if (order.customerId._id.toString() !== customerId.toString()) throw new ForbiddenError('Not your delivery');
  return order;
}

async function cancelByCustomer(customerId, id) {
  const order = await getForCustomer(customerId, id);
  if (order.status !== 'pending') {
    throw new BadRequestError('This order is already being prepared — call the store to cancel');
  }
  applyTransition(order, 'cancelled', { cancelledBy: 'customer', cancelReason: 'Cancelled by customer' });
  await order.save();
  return order;
}

// Merchant -------------------------------------------------
async function listForMerchant(merchantId, { status } = {}) {
  const filter = { merchantId };
  if (status) filter.status = status;
  return DeliveryOrder.find(filter).sort({ createdAt: -1 }).limit(100).populate(POPULATE);
}

async function updateStatusByMerchant({ merchantId, id, status, courierName, courierPhone, cancelReason }) {
  const order = await getOrder(id);
  if (order.merchantId._id.toString() !== merchantId.toString()) throw new ForbiddenError('Not your delivery order');
  if (status === 'cancelled' && order.status === 'out_for_delivery') {
    throw new BadRequestError('Order is already out for delivery');
  }
  applyTransition(order, status, { courierName, courierPhone, cancelReason, cancelledBy: status === 'cancelled' ? 'merchant' : null });
  await order.save();
  return order;
}

// Vendor ---------------------------------------------------
async function listForVendor(vendorId, { status } = {}) {
  const filter = { vendorId };
  if (status) filter.status = status;
  return DeliveryOrder.find(filter).sort({ createdAt: -1 }).limit(100).populate(POPULATE);
}

// Admin ----------------------------------------------------
async function listAll({ status, page = 1, limit = 30 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    DeliveryOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(POPULATE),
    DeliveryOrder.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

async function updateStatusByAdmin({ id, status, courierName, courierPhone, cancelReason }) {
  const order = await getOrder(id);
  // Admin can force any transition (fix mistakes, resolve disputes).
  applyTransition(order, status, { courierName, courierPhone, cancelReason, cancelledBy: status === 'cancelled' ? 'admin' : null, force: true });
  await order.save();
  return order;
}

async function adminStats() {
  const rows = await DeliveryOrder.aggregate([
    { $group: { _id: '$status', n: { $sum: 1 }, fees: { $sum: '$deliveryFeeUSD' }, total: { $sum: '$totalUSD' } } },
  ]);
  const byStatus = {};
  rows.forEach((r) => { byStatus[r._id] = { count: r.n, fees: round2(r.fees), total: round2(r.total) }; });
  return { byStatus };
}

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  quote,
  quoteForCustomer,
  resolveAddress,
  createOrder,
  listForCustomer,
  getForCustomer,
  cancelByCustomer,
  listForMerchant,
  updateStatusByMerchant,
  listForVendor,
  listAll,
  updateStatusByAdmin,
  adminStats,
};
