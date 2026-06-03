const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const vendorService = require('../services/vendorService');
const merchantService = require('../services/merchantService');
const couponService = require('../services/couponService');
const statsService = require('../services/statsService');
const auditService = require('../services/auditService');
const revenueService = require('../services/revenueService');
const siteSettingService = require('../services/siteSettingService');
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
  const m = await merchantService.create(req.body, { bypassPlanLimits: true });
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
  const c = await couponService.createCoupon(req.body, { bypassPlanLimits: true });
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
  const roleService = require('../services/roleService');
  const exists = await userRepo.findByEmail(req.body.email);
  if (exists) throw new ConflictError('Email already in use');
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const data = { ...req.body, passwordHash };
  delete data.password;
  if (data.roleSlug) {
    const perms = await roleService.permissionsForRole(data.roleSlug);
    if (perms.length) data.permissions = perms;
  }
  const user = await userRepo.create(data);
  await auditService.log({ actorUserId: req.user._id, action: 'user.create', targetType: 'User', targetId: user._id.toString(), after: user, req });
  res.status(201).json(user);
});

exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.vendorId) filter.vendorId = req.query.vendorId;
  if (req.query.q) filter.$or = [
    { fullName: { $regex: req.query.q, $options: 'i' } },
    { email: { $regex: req.query.q, $options: 'i' } },
  ];
  const items = await userRepo.list(filter, { skip: 0, limit: 500 });
  res.json({ items, total: items.length });
});

exports.listRoles = asyncHandler(async (req, res) => {
  const Role = require('../models/Role');
  const items = await Role.find().sort({ scope: 1, name: 1 });
  res.json({ items });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const roleService = require('../services/roleService');
  const { NotFoundError } = require('../utils/errors');
  const before = await userRepo.findById(req.params.id);
  if (!before) throw new NotFoundError('User not found');
  const data = { ...req.body };
  delete data.email;
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 12);
    delete data.password;
  }
  if (data.roleSlug && data.roleSlug !== before.roleSlug) {
    const perms = await roleService.permissionsForRole(data.roleSlug);
    if (perms.length) data.permissions = perms;
  }
  if (!data.vendorId) delete data.vendorId;
  if (!data.merchantId) delete data.merchantId;
  const updated = await userRepo.update(req.params.id, data);
  await auditService.log({ actorUserId: req.user._id, action: 'user.update', targetType: 'User', targetId: updated._id.toString(), before, after: updated, req });
  res.json(updated);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { NotFoundError, BadRequestError } = require('../utils/errors');
  const target = await userRepo.findById(req.params.id);
  if (!target) throw new NotFoundError('User not found');
  if (target._id.toString() === req.user._id.toString()) throw new BadRequestError('Cannot delete your own account');
  await userRepo.delete(req.params.id);
  await auditService.log({ actorUserId: req.user._id, action: 'user.delete', targetType: 'User', targetId: req.params.id, before: target, req });
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

exports.getTerms = asyncHandler(async (req, res) => {
  const audience = req.query.audience === 'merchant' ? 'merchant' : 'consumer';
  const terms = await siteSettingService.getTerms(audience);
  res.json(terms);
});

exports.updateTerms = asyncHandler(async (req, res) => {
  const audience = (req.body.audience === 'merchant' || req.query.audience === 'merchant') ? 'merchant' : 'consumer';
  const before = await siteSettingService.getTerms(audience);
  const updated = await siteSettingService.updateTerms({
    audience,
    content: req.body.content,
    userId: req.user._id,
  });
  await auditService.log({
    actorUserId: req.user._id,
    action: `terms.update.${audience}`,
    targetType: 'SiteSetting',
    targetId: `terms_${audience}`,
    before,
    after: updated.value,
    req,
  });
  res.json(updated.value);
});

// ---------- Site content (footer blocks) ----------
exports.listSiteContent = asyncHandler(async (req, res) => {
  const items = await siteSettingService.listContent();
  res.json({ items });
});

exports.updateSiteContent = asyncHandler(async (req, res) => {
  const key = req.params.key;
  const before = await siteSettingService.getContent(key);
  if (!before) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown content key' } });
  }
  const updated = await siteSettingService.setContent({
    key,
    title: req.body.title,
    content: req.body.content,
    userId: req.user._id,
  });
  await auditService.log({
    actorUserId: req.user._id,
    action: `site_content.update.${key}`,
    targetType: 'SiteSetting',
    targetId: key,
    before,
    after: updated.value,
    req,
  });
  res.json(updated.value);
});
