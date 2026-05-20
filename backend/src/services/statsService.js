const redemptionRepo = require('../repositories/redemptionRepository');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const User = require('../models/User');

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d = new Date()) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function startOfMonth(d = new Date()) { const x = startOfDay(d); x.setDate(1); return x; }

async function merchantStats(merchantId) {
  const now = new Date();
  const [today, week, month, uniqueCustomers, topCoupons, recent] = await Promise.all([
    redemptionRepo.countByMerchantBetween(merchantId, startOfDay(), now),
    redemptionRepo.countByMerchantBetween(merchantId, startOfWeek(), now),
    redemptionRepo.countByMerchantBetween(merchantId, startOfMonth(), now),
    redemptionRepo.aggregateMerchantUniqueCustomers(merchantId),
    Redemption.aggregate([
      { $match: { merchantId, status: 'completed' } },
      { $group: { _id: '$couponId', count: { $sum: 1 }, savings: { $sum: '$amountSavedUSD' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'coupons', localField: '_id', foreignField: '_id', as: 'coupon' } },
      { $unwind: '$coupon' },
    ]),
    Redemption.find({ merchantId, status: 'completed' }).sort({ scannedAt: -1 }).limit(10).populate('couponId customerId'),
  ]);
  const dailyTrend = await Redemption.aggregate([
    { $match: { merchantId, status: 'completed', scannedAt: { $gte: startOfMonth(), $lte: now } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return {
    today,
    week,
    month,
    uniqueCustomers: uniqueCustomers.length,
    topCoupons,
    recent,
    dailyTrend,
    revenueImpact: topCoupons.reduce((s, c) => s + (c.savings || 0), 0),
  };
}

async function vendorStats(vendorId) {
  const now = new Date();
  const merchants = await Merchant.find({ vendorId }).distinct('_id');
  const [today, week, month] = await Promise.all([
    Redemption.countDocuments({ merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: startOfDay(), $lt: now } }),
    Redemption.countDocuments({ merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: startOfWeek(), $lt: now } }),
    Redemption.countDocuments({ merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: startOfMonth(), $lt: now } }),
  ]);
  return { today, week, month, merchantCount: merchants.length };
}

async function adminOverview() {
  const now = new Date();
  const [totalRedemptions, todayRedemptions, totalCustomers, totalMerchants, totalVendors] = await Promise.all([
    Redemption.countDocuments({ status: 'completed' }),
    Redemption.countDocuments({ status: 'completed', scannedAt: { $gte: startOfDay(), $lt: now } }),
    User.countDocuments({ role: 'customer' }),
    Merchant.countDocuments({ status: 'active' }),
    require('../models/Vendor').countDocuments({ status: 'active' }),
  ]);
  const topMerchant = await Redemption.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$merchantId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    { $lookup: { from: 'merchants', localField: '_id', foreignField: '_id', as: 'merchant' } },
    { $unwind: '$merchant' },
  ]);
  return {
    totalRedemptions,
    todayRedemptions,
    totalCustomers,
    totalMerchants,
    totalVendors,
    topMerchant: topMerchant[0] || null,
  };
}

module.exports = { merchantStats, vendorStats, adminOverview };
