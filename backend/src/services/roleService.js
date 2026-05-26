const Role = require('../models/Role');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const SYSTEM_ROLES = [
  {
    slug: 'vendor_owner',
    name: 'Owner',
    description: 'Full access to everything — coupons, locations, team, stats, payments.',
    scope: 'vendor',
    permissions: ['manage_coupons','view_coupons','manage_merchants','view_merchants','manage_team','view_team','manage_hours','manage_profile','view_stats','view_payments','scan_coupons'],
    isSystem: true,
  },
  {
    slug: 'vendor_manager',
    name: 'Manager',
    description: 'Manages day-to-day operations: coupons, locations, hours, stats. Cannot manage team or billing.',
    scope: 'vendor',
    permissions: ['manage_coupons','view_coupons','manage_merchants','view_merchants','view_team','manage_hours','view_stats','scan_coupons'],
    isSystem: true,
  },
  {
    slug: 'vendor_marketing',
    name: 'Marketing',
    description: 'Creates and edits coupons, sees performance stats. Cannot edit locations or team.',
    scope: 'vendor',
    permissions: ['manage_coupons','view_coupons','view_merchants','view_stats','manage_profile'],
    isSystem: true,
  },
  {
    slug: 'vendor_accountant',
    name: 'Accountant',
    description: 'Read-only access to stats, payments, and revenue data for bookkeeping.',
    scope: 'vendor',
    permissions: ['view_stats','view_payments','view_coupons','view_merchants'],
    isSystem: true,
  },
  {
    slug: 'vendor_cashier',
    name: 'Cashier / Staff',
    description: 'Front-of-house staff. Can only scan customer QR codes to redeem coupons.',
    scope: 'vendor',
    permissions: ['scan_coupons'],
    isSystem: true,
  },
];

async function syncSystemRoles() {
  for (const r of SYSTEM_ROLES) {
    await Role.findOneAndUpdate({ slug: r.slug }, r, { upsert: true, new: true });
  }
}

async function listAvailable(vendorId) {
  return Role.find({ $or: [{ scope: 'vendor', vendorId: null }, { vendorId }] }).sort({ name: 1 });
}

async function getBySlug(slug) {
  const r = await Role.findOne({ slug });
  if (!r) throw new NotFoundError('Role not found');
  return r;
}

async function permissionsForRole(slug) {
  if (!slug) return [];
  const r = await Role.findOne({ slug });
  return r ? r.permissions : [];
}

async function createCustomRole(vendorId, { name, description, permissions = [] }) {
  const slug = `vendor_${vendorId}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return Role.create({ slug, name, description, scope: 'vendor', permissions, vendorId, isSystem: false });
}

async function deleteRole(slug, vendorId) {
  const r = await Role.findOne({ slug });
  if (!r) throw new NotFoundError('Role not found');
  if (r.isSystem) throw new ForbiddenError('System roles cannot be deleted');
  if (r.vendorId?.toString() !== vendorId.toString()) throw new ForbiddenError('Not your role');
  await Role.deleteOne({ _id: r._id });
  return r;
}

module.exports = { syncSystemRoles, listAvailable, getBySlug, permissionsForRole, createCustomRole, deleteRole, SYSTEM_ROLES };
