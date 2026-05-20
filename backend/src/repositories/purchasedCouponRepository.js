const PurchasedCoupon = require('../models/PurchasedCoupon');

module.exports = {
  findById: (id) => PurchasedCoupon.findById(id).populate('couponId'),
  findByCustomer: (customerId) => PurchasedCoupon.find({ customerId }).populate({ path: 'couponId', populate: { path: 'merchantIds vendorId' } }).sort({ createdAt: -1 }),
  create: (data) => PurchasedCoupon.create(data),
  update: (id, data) => PurchasedCoupon.findByIdAndUpdate(id, data, { new: true }),
  decrementUses: (id) => PurchasedCoupon.findByIdAndUpdate(id, { $inc: { usesRemaining: -1 } }, { new: true }),
  countByCustomer: (customerId) => PurchasedCoupon.countDocuments({ customerId }),
};
