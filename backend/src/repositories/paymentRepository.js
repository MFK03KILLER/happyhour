const Payment = require('../models/Payment');

module.exports = {
  findById: (id) => Payment.findById(id),
  create: (data) => Payment.create(data),
  listByCustomer: (customerId) => Payment.find({ customerId }).sort({ createdAt: -1 }),
  listAll: (filter = {}, opts = {}) => Payment.find(filter, null, opts).populate('customerId', 'fullName email').sort({ createdAt: -1 }),
  count: (filter = {}) => Payment.countDocuments(filter),
  sumAmount: async (filter = {}) => {
    const r = await Payment.aggregate([
      { $match: { status: 'succeeded', ...filter } },
      { $group: { _id: null, total: { $sum: '$amountUSD' }, count: { $sum: 1 } } },
    ]);
    return r[0] ? { total: r[0].total, count: r[0].count } : { total: 0, count: 0 };
  },
  groupByMethod: (filter = {}) => Payment.aggregate([
    { $match: { status: 'succeeded', ...filter } },
    { $group: { _id: '$method', total: { $sum: '$amountUSD' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]),
  groupByKind: (filter = {}) => Payment.aggregate([
    { $match: { status: 'succeeded', ...filter } },
    { $group: { _id: '$context.kind', total: { $sum: '$amountUSD' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]),
  dailyTrend: (from, to) => Payment.aggregate([
    { $match: { status: 'succeeded', createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amountUSD' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]),
  topCustomers: (from, to, limit = 10) => Payment.aggregate([
    { $match: { status: 'succeeded', createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: '$customerId', total: { $sum: '$amountUSD' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
    { $project: { total: 1, count: 1, 'customer.fullName': 1, 'customer.email': 1 } },
  ]),
};
