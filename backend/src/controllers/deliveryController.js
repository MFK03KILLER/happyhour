const asyncHandler = require('../utils/asyncHandler');
const deliveryService = require('../services/deliveryService');
const auditService = require('../services/auditService');
const User = require('../models/User');
const { NotFoundError } = require('../utils/errors');

// ---------------- Customer: address book ----------------
exports.listAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ items: user.addresses || [] });
});

exports.createAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const makeDefault = !!req.body.isDefault || (user.addresses || []).length === 0;
  if (makeDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  user.addresses.push({
    label: req.body.label || 'Home',
    street: req.body.street,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    lat: req.body.lat,
    lng: req.body.lng,
    notes: req.body.notes,
    phone: req.body.phone,
    isDefault: makeDefault,
  });
  await user.save();
  res.status(201).json({ items: user.addresses });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw new NotFoundError('Address not found');
  const fields = ['label', 'street', 'city', 'state', 'zip', 'lat', 'lng', 'notes', 'phone'];
  fields.forEach((f) => { if (req.body[f] !== undefined) addr[f] = req.body[f]; });
  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
    addr.isDefault = true;
  }
  await user.save();
  res.json({ items: user.addresses });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw new NotFoundError('Address not found');
  const wasDefault = addr.isDefault;
  addr.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  res.json({ items: user.addresses });
});

// ---------------- Customer: quote + orders ----------------
exports.quote = asyncHandler(async (req, res) => {
  const q = await deliveryService.quoteForCustomer({
    customerId: req.user._id,
    merchantId: req.body.merchantId,
    addressId: req.body.addressId,
    subtotalUSD: Number(req.body.subtotalUSD) || 0,
  });
  res.json(q);
});

exports.myDeliveries = asyncHandler(async (req, res) => {
  const items = await deliveryService.listForCustomer(req.user._id);
  res.json({ items });
});

exports.myDeliveryDetail = asyncHandler(async (req, res) => {
  const order = await deliveryService.getForCustomer(req.user._id, req.params.id);
  res.json(order);
});

exports.cancelMyDelivery = asyncHandler(async (req, res) => {
  const order = await deliveryService.cancelByCustomer(req.user._id, req.params.id);
  res.json(order);
});

// ---------------- Merchant staff ----------------
exports.merchantList = asyncHandler(async (req, res) => {
  const items = await deliveryService.listForMerchant(req.user.merchantId, { status: req.query.status });
  res.json({ items });
});

exports.merchantUpdateStatus = asyncHandler(async (req, res) => {
  const order = await deliveryService.updateStatusByMerchant({
    merchantId: req.user.merchantId,
    id: req.params.id,
    status: req.body.status,
    courierName: req.body.courierName,
    courierPhone: req.body.courierPhone,
    cancelReason: req.body.cancelReason,
  });
  await auditService.log({
    actorUserId: req.user._id, action: `delivery.${req.body.status}`,
    targetType: 'DeliveryOrder', targetId: order._id.toString(), req,
  });
  res.json(order);
});

// ---------------- Vendor ----------------
exports.vendorList = asyncHandler(async (req, res) => {
  const items = await deliveryService.listForVendor(req.user.vendorId, { status: req.query.status });
  res.json({ items });
});

// ---------------- Admin ----------------
exports.adminList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
  const [list, stats] = await Promise.all([
    deliveryService.listAll({ status: req.query.status, page, limit }),
    deliveryService.adminStats(),
  ]);
  res.json({ ...list, stats });
});

exports.adminUpdateStatus = asyncHandler(async (req, res) => {
  const order = await deliveryService.updateStatusByAdmin({
    id: req.params.id,
    status: req.body.status,
    courierName: req.body.courierName,
    courierPhone: req.body.courierPhone,
    cancelReason: req.body.cancelReason,
  });
  await auditService.log({
    actorUserId: req.user._id, action: `delivery.admin.${req.body.status}`,
    targetType: 'DeliveryOrder', targetId: order._id.toString(), req,
  });
  res.json(order);
});

exports.adminGetSettings = asyncHandler(async (req, res) => {
  const settings = await deliveryService.getSettings();
  res.json(settings);
});

exports.adminUpdateSettings = asyncHandler(async (req, res) => {
  const before = await deliveryService.getSettings();
  const settings = await deliveryService.updateSettings(req.body, req.user._id);
  await auditService.log({
    actorUserId: req.user._id, action: 'delivery.settings.update',
    targetType: 'SiteSetting', targetId: 'delivery_settings', before, after: settings, req,
  });
  res.json(settings);
});
