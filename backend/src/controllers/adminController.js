const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const vendorService = require('../services/vendorService');
const merchantService = require('../services/merchantService');
const couponService = require('../services/couponService');
const statsService = require('../services/statsService');
const auditService = require('../services/auditService');
const revenueService = require('../services/revenueService');
const userRepo = require('../repositories/userRepository');
const { ConflictError } = require('../utils/errors');

exports.listVendors = asyncHandler(async (req, res) => {
  const result = await vendorService.list({ skip: 0, limit: 100 });
  res.json(result);
});
exports.createVendor = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const { ownerPhone, ownerPassword, ownerFullName, ...vendorData } = req.body;
  const v = await vendorService.create(vendorData);
  let owner = null;
  if (ownerPhone && ownerPassword) {
    const existing = await User.findOne({ phone: ownerPhone });
    if (existing) throw new ConflictError('شماره موبایل قبلاً ثبت شده است');
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    owner = await userRepo.create({
      phone: ownerPhone,
      passwordHash,
      fullName: ownerFullName || `مدیر ${vendorData.name}`,
      role: 'vendor',
      vendorId: v._id,
      permissions: ['manage_coupons', 'view_stats', 'manage_team', 'manage_merchants'],
      status: 'active',
      phoneVerifiedAt: new Date(),
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
  const User = require('../models/User');
  const exists = await User.findOne({ phone: req.body.phone });
  if (exists) throw new ConflictError('شماره موبایل قبلاً ثبت شده است');
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await userRepo.create({ ...req.body, passwordHash, phoneVerifiedAt: new Date() });
  await auditService.log({ actorUserId: req.user._id, action: 'user.create', targetType: 'User', targetId: user._id.toString(), after: user, req });
  res.status(201).json(user);
});
exports.listUsers = asyncHandler(async (req, res) => {
  const items = await userRepo.list({}, { skip: 0, limit: 200 });
  res.json({ items, total: items.length });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 12);
    delete data.password;
  }
  const updated = await userRepo.update(req.params.id, data);
  if (!updated) throw new (require('../utils/errors').NotFoundError)('User not found');
  await auditService.log({ actorUserId: req.user._id, action: 'user.update', targetType: 'User', targetId: updated._id.toString(), after: updated, req });
  res.json(updated);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const deleted = await userRepo.delete(req.params.id);
  if (!deleted) throw new (require('../utils/errors').NotFoundError)('User not found');
  await auditService.log({ actorUserId: req.user._id, action: 'user.delete', targetType: 'User', targetId: req.params.id, before: deleted, req });
  res.status(204).end();
});

exports.overview = asyncHandler(async (req, res) => {
  const [base, money] = await Promise.all([
    statsService.adminOverview(),
    revenueService.todayWeekMonth(),
  ]);
  res.json({ ...base, revenue: money });
});

exports.auditLogs = asyncHandler(async (req, res) => {
  const data = await auditService.list({ skip: 0, limit: 100 });
  res.json(data);
});

exports.payments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const data = await revenueService.listPayments({
    page,
    limit,
    method: req.query.method,
    kind: req.query.kind,
    status: req.query.status,
  });
  res.json(data);
});

exports.revenue = asyncHandler(async (req, res) => {
  const data = await revenueService.overview(req.query.range || 'month');
  res.json(data);
});
