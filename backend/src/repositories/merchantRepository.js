const Merchant = require('../models/Merchant');

module.exports = {
  findById: (id) => Merchant.findById(id).populate('vendorId'),
  findBySlug: (slug) => Merchant.findOne({ slug }).populate('vendorId'),
  create: (data) => Merchant.create(data),
  update: (id, data) => Merchant.findByIdAndUpdate(id, data, { new: true }),
  delete: (id) => Merchant.findByIdAndDelete(id),
  list: (filter = {}, opts = {}) => Merchant.find(filter, null, opts).populate('vendorId').sort({ createdAt: -1 }),
  count: (filter = {}) => Merchant.countDocuments(filter),
  upsertBySlug: (slug, data) => Merchant.findOneAndUpdate({ slug }, data, { new: true, upsert: true }),
  findByVendor: (vendorId) => Merchant.find({ vendorId }),
};
