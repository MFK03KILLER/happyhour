const merchantRepo = require('../repositories/merchantRepository');
const Merchant = require('../models/Merchant');
const { NotFoundError, BadRequestError } = require('../utils/errors');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function create(data) {
  if (!data.slug) data.slug = slugify(data.name);
  // Enforce locations limit per vendor plan
  if (data.vendorId) {
    const planService = require('./planService');
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findById(data.vendorId);
    if (vendor && vendor.ownerUserId) {
      const User = require('../models/User');
      const owner = await User.findById(vendor.ownerUserId);
      if (owner) {
        const { plan } = await planService.getUserPlan(owner, 'merchant');
        const limit = plan?.limits?.locations || 1;
        const currentCount = await Merchant.countDocuments({ vendorId: data.vendorId });
        if (currentCount >= limit) {
          throw new BadRequestError(`Your ${plan.label} plan allows ${limit} location${limit === 1 ? '' : 's'}. Upgrade to add more.`);
        }
      }
    }
  }
  return merchantRepo.create(data);
}
async function update(id, data) {
  const updated = await merchantRepo.update(id, data);
  if (!updated) throw new NotFoundError('Merchant not found');
  return updated;
}
async function remove(id) {
  const deleted = await merchantRepo.delete(id);
  if (!deleted) throw new NotFoundError('Merchant not found');
  return deleted;
}
async function list(filter = {}, opts) {
  const items = await merchantRepo.list(filter, opts);
  const total = await merchantRepo.count(filter);
  return { items, total };
}
async function getById(id) {
  const m = await merchantRepo.findById(id);
  if (!m) throw new NotFoundError('Merchant not found');
  return m;
}
async function getBySlug(slug) {
  const m = await merchantRepo.findBySlug(slug);
  if (!m) throw new NotFoundError('Merchant not found');
  return m;
}
async function listByVendor(vendorId) {
  return merchantRepo.findByVendor(vendorId);
}

async function discover({ category, search, lat, lng, sort = 'distance', order = 'asc', priceMin, priceMax, ratingMin, page = 1, limit = 30 }) {
  const filter = { status: 'active' };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (priceMin != null) filter.priceLevel = { ...(filter.priceLevel || {}), $gte: priceMin };
  if (priceMax != null) filter.priceLevel = { ...(filter.priceLevel || {}), $lte: priceMax };
  if (ratingMin != null) filter.rating = { $gte: ratingMin };

  let items = await Merchant.find(filter).populate('vendorId').lean();
  if (lat != null && lng != null) {
    items = items.map((m) => ({ ...m, distanceKm: haversineKm(lat, lng, m.address && m.address.lat, m.address && m.address.lng) }));
  }
  const dir = order === 'desc' ? -1 : 1;
  if (sort === 'distance' && lat != null) {
    items.sort((a, b) => {
      const aa = a.distanceKm == null ? Infinity : a.distanceKm;
      const bb = b.distanceKm == null ? Infinity : b.distanceKm;
      return (aa - bb) * dir;
    });
  } else if (sort === 'rating') {
    items.sort((a, b) => ((b.rating || 0) - (a.rating || 0)) * dir);
  } else if (sort === 'price') {
    items.sort((a, b) => ((a.priceLevel || 0) - (b.priceLevel || 0)) * dir);
  }
  const total = items.length;
  const paged = items.slice((page - 1) * limit, (page - 1) * limit + limit);
  return { items: paged, total, page, limit };
}

module.exports = { create, update, remove, list, getById, getBySlug, listByVendor, discover, haversineKm };
