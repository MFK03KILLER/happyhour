const Vendor = require('../models/Vendor');

module.exports = {
  findById: (id) => Vendor.findById(id),
  findBySlug: (slug) => Vendor.findOne({ slug }),
  create: (data) => Vendor.create(data),
  update: (id, data) => Vendor.findByIdAndUpdate(id, data, { new: true }),
  delete: (id) => Vendor.findByIdAndDelete(id),
  list: (filter = {}, opts = {}) => Vendor.find(filter, null, opts).sort({ createdAt: -1 }),
  count: (filter = {}) => Vendor.countDocuments(filter),
  upsertBySlug: (slug, data) => Vendor.findOneAndUpdate({ slug }, data, { new: true, upsert: true }),
};
