const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const merchantService = require('../services/merchantService');
const couponService = require('../services/couponService');
const statsService = require('../services/statsService');
const roleService = require('../services/roleService');
const analyticsService = require('../services/analyticsService');
const userRepo = require('../repositories/userRepository');
const { ForbiddenError, ConflictError, NotFoundError } = require('../utils/errors');

function ensureVendor(req) {
  if (!req.user.vendorId) throw new ForbiddenError('User not linked to vendor');
  return req.user.vendorId;
}

exports.listMyMerchants = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const items = await merchantService.listByVendor(vendorId);
  res.json({ items, total: items.length });
});

exports.createMyMerchant = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const m = await merchantService.create({ ...req.body, vendorId });
  res.status(201).json(m);
});

exports.updateMyMerchant = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const existing = await merchantService.getById(req.params.id);
  if (existing.vendorId._id.toString() !== vendorId.toString()) throw new ForbiddenError('Not your merchant');
  const m = await merchantService.update(req.params.id, req.body);
  res.json(m);
});

exports.deleteMyMerchant = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const existing = await merchantService.getById(req.params.id);
  if (existing.vendorId._id.toString() !== vendorId.toString()) throw new ForbiddenError('Not your merchant');
  await merchantService.remove(req.params.id);
  res.status(204).end();
});

exports.listMyCoupons = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const result = await couponService.listCoupons({ vendorId }, { skip: 0, limit: 100 });
  res.json(result);
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const c = await couponService.createCoupon({ ...req.body, vendorId });
  res.status(201).json(c);
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const existing = await couponService.getById(req.params.id);
  if (existing.vendorId._id.toString() !== vendorId.toString()) throw new ForbiddenError('Not your coupon');
  const c = await couponService.updateCoupon(req.params.id, req.body);
  res.json(c);
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const existing = await couponService.getById(req.params.id);
  if (existing.vendorId._id.toString() !== vendorId.toString()) throw new ForbiddenError('Not your coupon');
  await couponService.deleteCoupon(req.params.id);
  res.status(204).end();
});

exports.listTeam = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const items = await userRepo.list({ vendorId, role: { $in: ['vendor', 'merchant_staff'] } }, { limit: 200 });
  res.json({ items });
});

exports.createTeamMember = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const { email, password, fullName, merchantId, roleSlug, permissions } = req.body;
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ConflictError('Email already in use');
  const passwordHash = await bcrypt.hash(password, 12);
  let perms = permissions;
  let chosenRole = roleSlug;
  if (roleSlug) {
    perms = await roleService.permissionsForRole(roleSlug);
    if (!perms.length) throw new NotFoundError('Role not found');
  }
  if (!perms || !perms.length) {
    chosenRole = 'vendor_cashier';
    perms = await roleService.permissionsForRole('vendor_cashier');
  }
  const user = await userRepo.create({
    email, passwordHash, fullName,
    role: 'merchant_staff',
    vendorId,
    merchantId: merchantId || undefined,
    roleSlug: chosenRole,
    permissions: perms,
    status: 'active',
  });
  res.status(201).json(user);
});

exports.updateTeamMember = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const user = await userRepo.findById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  if (user.vendorId?.toString() !== vendorId.toString()) throw new ForbiddenError('Not in your team');
  const update = {};
  if (req.body.fullName) update.fullName = req.body.fullName;
  if (req.body.merchantId !== undefined) update.merchantId = req.body.merchantId || undefined;
  if (req.body.status) update.status = req.body.status;
  if (req.body.roleSlug) {
    const perms = await roleService.permissionsForRole(req.body.roleSlug);
    if (!perms.length) throw new NotFoundError('Role not found');
    update.roleSlug = req.body.roleSlug;
    update.permissions = perms;
  }
  if (req.body.password) update.passwordHash = await bcrypt.hash(req.body.password, 12);
  const updated = await userRepo.update(req.params.id, update);
  res.json(updated);
});

exports.listRoles = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const items = await roleService.listAvailable(vendorId);
  res.json({ items });
});

exports.analytics = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const data = await analyticsService.vendorAnalytics(vendorId, req.query);
  res.json(data);
});

exports.suggestions = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const data = await analyticsService.vendorSuggestions(vendorId);
  res.json({ items: data });
});

exports.removeTeamMember = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const user = await userRepo.findById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  if (user.vendorId?.toString() !== vendorId.toString()) throw new ForbiddenError('Not in your team');
  await userRepo.delete(req.params.id);
  res.status(204).end();
});

exports.stats = asyncHandler(async (req, res) => {
  const vendorId = ensureVendor(req);
  const data = await statsService.vendorStats(vendorId);
  res.json(data);
});
