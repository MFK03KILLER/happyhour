const Redemption = require('../models/Redemption');

module.exports = {
  findById: (id) => Redemption.findById(id).populate('couponId merchantId customerId purchasedCouponId'),
  findByNonce: (qrNonce) => Redemption.findOne({ qrNonce }).populate('couponId customerId purchasedCouponId'),
  create: (data) => Redemption.create(data),
  update: (id, data) => Redemption.findByIdAndUpdate(id, data, { new: true }),
  listByMerchant: (merchantId, opts = {}) => Redemption.find({ merchantId, status: 'completed' }, null, opts).populate('couponId customerId').sort({ scannedAt: -1 }),
  listByCustomer: (customerId, opts = {}) => Redemption.find({ customerId, status: 'completed' }, null, opts).populate('couponId merchantId').sort({ scannedAt: -1 }),
  countByMerchantBetween: (merchantId, from, to) => Redemption.countDocuments({ merchantId, status: 'completed', scannedAt: { $gte: from, $lt: to } }),
  countByVendorBetween: async (vendorId, from, to) => {
    const Merchant = require('../models/Merchant');
    const merchantIds = await Merchant.find({ vendorId }).distinct('_id');
    return Redemption.countDocuments({ merchantId: { $in: merchantIds }, status: 'completed', scannedAt: { $gte: from, $lt: to } });
  },
  aggregateMerchantTopCoupons: (merchantId, limit = 5) => Redemption.aggregate([
    { $match: { merchantId, status: 'completed' } },
    { $group: { _id: '$couponId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]),
  aggregateMerchantUniqueCustomers: (merchantId) => Redemption.distinct('customerId', { merchantId, status: 'completed' }),
  expirePending: () => Redemption.updateMany({ status: 'pending', qrExpiresAt: { $lt: new Date() } }, { status: 'expired' }),
};
