const merchantRepo = require('../repositories/merchantRepository');
const { NotFoundError } = require('../utils/errors');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function create(data) {
  if (!data.slug) data.slug = slugify(data.name);
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

module.exports = { create, update, remove, list, getById, getBySlug, listByVendor };
