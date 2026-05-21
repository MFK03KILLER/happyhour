const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const vendorService = require('../services/vendorService');
const merchantService = require('../services/merchantService');
const couponService = require('../services/couponService');
const statsService = require('../services/statsService');
const auditService = require('../services/auditService');
const userRepo = require('../repositories/userRepository');
const { ConflictError } = require('../utils/errors');

exports.listVendors = asyncHandler(async (req, res) => {
  const result = await vendorService.list({ skip: 0, limit: 100 });
  res.json(result);
});
exports.createVendor = asyncHandler(async (req, res) => {
  const { ownerEmail, ownerPassword, ownerFullName, ...vendorData } = req.body;
  const v = await vendorService.create(vendorData);
  let owner = null;
  if (ownerEmail && ownerPassword) {
    const existing = await userRepo.findByEmail(ownerEmail);
    if (existing) throw new ConflictError('Owner email already in use');
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    owner = await userRepo.create({
      email: ownerEmail,
      passwordHash,
      fullName: ownerFullName || `${vendorData.name} Owner`,
      role: 'vendor',
      vendorId: v._id,
      permissions: ['manage_coupons', 'view_stats', 'manage_team', 'manage_merchants'],
      status: 'active',
    });
    v.ownerUserId = owner._id;
    await v.save();
  }
  await auditService.log({ actorUserId: req.user._id, action: 'vendor.create', targetType: 'Vendor', targetId: v._id.toString(), after: v, req });
  res.status(201).json({ vendor: v, owner });
});
exports.updateVendor = asyncHandler(async (req, res) => {
  const before = await vendorService.getById(req.params.id);
  const v = await vendorService.update(req.params.id, req.body);
  await auditService.log({ actorUserId: req.user._id, action: 'vendor.update', targetType: 'Vendor', targetId: v._id.toString(), before, after: v, req });
  res.json(v);
});
exports.deleteVendor = asyncHandler(async (req, res) => {
  const v = await vendorService.remove(req.params.id);
  await auditService.log({ actorUserId: req.user._id, action: 'vendor.delete', targetType: 'Vendor', targetId: req.params.id, before: v, req });
  res.status(204).end();
});

exports.listMerchants = asyncHandler(async (req, res) => {
  const result = await merchantService.list({}, { skip: 0, limit: 200 });
  res.json(result);
});
exports.createMerchant = asyncHandler(async (req, res) => {
  const m = await merchantService.create(req.body);
  await auditService.log({ actorUserId: req.user._id, action: 'merchant.create', targetType: 'Merchant', targetId: m._id.toString(), after: m, req });
  res.status(201).json(m);
});
exports.updateMerchant = asyncHandler(async (req, res) => {
  const before = await merchantService.getById(req.params.id);
  const m = await merchantService.update(req.params.id, req.body);
  await auditService.log({ actorUserId: req.user._id, action: 'merchant.update', targetType: 'Merchant', targetId: m._id.toString(), before, after: m, req });
  res.json(m);
});
exports.deleteMerchant = asyncHandler(async (req, res) => {
  const m = await merchantService.remove(req.params.id);
  await auditService.log({ actorUserId: req.user._id, action: 'merchant.delete', targetType: 'Merchant', targetId: req.params.id, before: m, req });
  res.status(204).end();
});

exports.listCoupons = asyncHandler(async (req, res) => {
  const result = await couponService.listCoupons({}, { skip: 0, limit: 200 });
  res.json(result);
});
exports.createCoupon = asyncHandler(async (req, res) => {
  const c = await couponService.createCoupon(req.body);
  await auditService.log({ actorUserId: req.user._id, action: 'coupon.create', targetType: 'Coupon', targetId: c._id.toString(), after: c, req });
  res.status(201).json(c);
});
exports.updateCoupon = asyncHandler(async (req, res) => {
  const c = await couponService.updateCoupon(req.params.id, req.body);
  await auditService.log({ actorUserId: req.user._id, action: 'coupon.update', targetType: 'Coupon', targetId: c._id.toString(), after: c, req });
  res.json(c);
});
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const c = await couponService.deleteCoupon(req.params.id);
  await auditService.log({ actorUserId: req.user._id, action: 'coupon.delete', targetType: 'Coupon', targetId: req.params.id, before: c, req });
  res.status(204).end();
});

exports.createUser = asyncHandler(async (req, res) => {
  const exists = await userRepo.findByEmail(req.body.email);
  if (exists) throw new ConflictError('Email already in use');
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await userRepo.create({ ...req.body, passwordHash });
  await auditService.log({ actorUserId: req.user._id, action: 'user.create', targetType: 'User', targetId: user._id.toString(), after: user, req });
  res.status(201).json(user);
});
exports.listUsers = asyncHandler(async (req, res) => {
  const items = await userRepo.list({}, { skip: 0, limit: 200 });
  res.json({ items, total: items.length });
});

exports.overview = asyncHandler(async (req, res) => {
  const data = await statsService.adminOverview();
  res.json(data);
});

exports.auditLogs = asyncHandler(async (req, res) => {
  const data = await auditService.list({ skip: 0, limit: 100 });
  res.json(data);
});
