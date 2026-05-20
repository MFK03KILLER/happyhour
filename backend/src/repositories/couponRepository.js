const Coupon = require('../models/Coupon');

module.exports = {
  findById: (id) => Coupon.findById(id).populate('vendorId').populate('merchantIds'),
  create: (data) => Coupon.create(data),
  update: (id, data) => Coupon.findByIdAndUpdate(id, data, { new: true }),
  delete: (id) => Coupon.findByIdAndDelete(id),
  list: (filter = {}, opts = {}) => Coupon.find(filter, null, opts).populate('vendorId').populate('merchantIds').sort({ createdAt: -1 }),
  count: (filter = {}) => Coupon.countDocuments(filter),
  upsertByTitle: (title, data) => Coupon.findOneAndUpdate({ title }, data, { new: true, upsert: true }),
  incrementRedemptions: (id) => Coupon.findByIdAndUpdate(id, { $inc: { totalRedemptionsCount: 1 } }),
};
