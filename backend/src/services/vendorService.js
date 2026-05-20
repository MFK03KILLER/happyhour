const vendorRepo = require('../repositories/vendorRepository');
const { NotFoundError } = require('../utils/errors');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function create(data) {
  if (!data.slug) data.slug = slugify(data.name);
  return vendorRepo.create(data);
}
async function update(id, data) {
  const updated = await vendorRepo.update(id, data);
  if (!updated) throw new NotFoundError('Vendor not found');
  return updated;
}
async function remove(id) {
  const deleted = await vendorRepo.delete(id);
  if (!deleted) throw new NotFoundError('Vendor not found');
  return deleted;
}
async function list(opts) {
  const items = await vendorRepo.list({}, opts);
  const total = await vendorRepo.count();
  return { items, total };
}
async function getById(id) {
  const v = await vendorRepo.findById(id);
  if (!v) throw new NotFoundError('Vendor not found');
  return v;
}

module.exports = { create, update, remove, list, getById };
