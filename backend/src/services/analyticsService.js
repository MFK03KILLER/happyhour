const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const Coupon = require('../models/Coupon');
const PurchasedCoupon = require('../models/PurchasedCoupon');

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function daysAgo(n) { const d = startOfDay(); d.setDate(d.getDate() - n); return d; }

async function vendorAnalytics(vendorId, { range = '30d' } = {}) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const from = daysAgo(days);
  const now = new Date();
  const merchants = await Merchant.find({ vendorId }).distinct('_id');

  const [
    total,
    dailyTrend,
    hourlyDist,
    weekdayDist,
    topCoupons,
    repeatRate,
    inventorySnapshot,
    activeCoupons,
  ] = await Promise.all([
    Redemption.countDocuments({ merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: from } }),
    Redemption.aggregate([
      { $match: { merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } }, count: { $sum: 1 }, savings: { $sum: '$amountSavedUSD' } } },
      { $sort: { _id: 1 } },
    ]),
    Redemption.aggregate([
      { $match: { merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: from } } },
      { $group: { _id: { $hour: '$scannedAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Redemption.aggregate([
      { $match: { merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: from } } },
      { $group: { _id: { $dayOfWeek: '$scannedAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Redemption.aggregate([
      { $match: { merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: from } } },
      { $group: { _id: '$couponId', count: { $sum: 1 }, savings: { $sum: '$amountSavedUSD' } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'coupons', localField: '_id', foreignField: '_id', as: 'coupon' } },
      { $unwind: '$coupon' },
    ]),
    Redemption.aggregate([
      { $match: { merchantId: { $in: merchants }, status: 'completed', scannedAt: { $gte: from } } },
      { $group: { _id: '$customerId', count: { $sum: 1 } } },
      { $group: { _id: null, total: { $sum: 1 }, repeats: { $sum: { $cond: [{ $gt: ['$count', 1] }, 1, 0] } } } },
    ]),
    Coupon.find({ vendorId, offerKind: 'surprise_bag', status: { $in: ['active', 'sold_out'] } }).select('title inventoryCount inventoryRemaining'),
    Coupon.countDocuments({ vendorId, status: 'active', validUntil: { $gte: now } }),
  ]);

  const hourly = Array.from({ length: 24 }, (_, h) => {
    const found = hourlyDist.find((x) => x._id === h);
    return { hour: h, count: found ? found.count : 0 };
  });

  const weekday = Array.from({ length: 7 }, (_, d) => {
    const found = weekdayDist.find((x) => x._id === d + 1);
    return { day: DAY_NAMES[d], count: found ? found.count : 0 };
  });

  const repeats = repeatRate[0] || { total: 0, repeats: 0 };
  const repeatPct = repeats.total > 0 ? Math.round((repeats.repeats / repeats.total) * 100) : 0;

  const totalSavings = dailyTrend.reduce((s, d) => s + (d.savings || 0), 0);

  return {
    range,
    from,
    to: now,
    totalRedemptions: total,
    totalSavings,
    avgPerDay: days > 0 ? Math.round((total / days) * 10) / 10 : 0,
    dailyTrend,
    hourly,
    weekday,
    topCoupons,
    repeatCustomers: repeats.repeats,
    uniqueCustomers: repeats.total,
    repeatRate: repeatPct,
    activeCoupons,
    inventorySnapshot,
  };
}

async function vendorSuggestions(vendorId) {
  const merchants = await Merchant.find({ vendorId }).select('_id name category offPeakHours');
  const merchantIds = merchants.map((m) => m._id);
  const suggestions = [];

  const totalActive = await Coupon.countDocuments({ vendorId, status: 'active' });
  if (totalActive === 0) {
    suggestions.push({
      severity: 'critical', icon: 'fa-circle-exclamation', color: 'coral',
      title: 'No active coupons',
      body: 'Your locations have no offers running. Customers can\'t claim anything until you create at least one coupon.',
      action: { label: 'Create coupon', to: '/vendor/coupons' },
    });
  }

  const merchantsNoHours = merchants.filter((m) => !m.offPeakHours || m.offPeakHours.length === 0);
  if (merchantsNoHours.length) {
    suggestions.push({
      severity: 'warn', icon: 'fa-clock', color: 'amber',
      title: `${merchantsNoHours.length} location(s) without happy hours`,
      body: `${merchantsNoHours.map((m) => m.name).slice(0,2).join(', ')}${merchantsNoHours.length > 2 ? '…' : ''} — set happy hour times to drive off-peak traffic.`,
      action: { label: 'Set hours', to: '/vendor/merchants' },
    });
  }

  const hourly = await Redemption.aggregate([
    { $match: { merchantId: { $in: merchantIds }, status: 'completed', scannedAt: { $gte: daysAgo(30) } } },
    { $group: { _id: { $hour: '$scannedAt' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);
  if (hourly.length) {
    const top = hourly[0];
    const fmt = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${h12}${ampm}`;
    };
    suggestions.push({
      severity: 'info', icon: 'fa-chart-line', color: 'teal',
      title: `Your busiest hour is ${fmt(top._id)}`,
      body: `Most redemptions happen at ${fmt(top._id)}. Consider featuring different deals at quieter hours to balance traffic.`,
    });
  }

  const weekday = await Redemption.aggregate([
    { $match: { merchantId: { $in: merchantIds }, status: 'completed', scannedAt: { $gte: daysAgo(30) } } },
    { $group: { _id: { $dayOfWeek: '$scannedAt' }, count: { $sum: 1 } } },
  ]);
  if (weekday.length === 7) {
    const sorted = [...weekday].sort((a,b) => a.count - b.count);
    const slowest = sorted[0];
    if (slowest && slowest.count < (sorted[6]?.count || 0) * 0.3) {
      const dayName = DAY_NAMES[slowest._id - 1];
      suggestions.push({
        severity: 'opportunity', icon: 'fa-lightbulb', color: 'purple',
        title: `${dayName.toUpperCase()} is your slowest day`,
        body: `Only ${slowest.count} redemptions over 30 days. Create a ${dayName}-only coupon to boost traffic.`,
        action: { label: 'Create coupon', to: '/vendor/coupons' },
      });
    }
  }

  const topPerformers = await Redemption.aggregate([
    { $match: { merchantId: { $in: merchantIds }, status: 'completed', scannedAt: { $gte: daysAgo(30) } } },
    { $group: { _id: '$couponId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    { $lookup: { from: 'coupons', localField: '_id', foreignField: '_id', as: 'coupon' } },
    { $unwind: '$coupon' },
  ]);
  if (topPerformers[0]) {
    suggestions.push({
      severity: 'success', icon: 'fa-trophy', color: 'green',
      title: `"${topPerformers[0].coupon.title}" is your top performer`,
      body: `${topPerformers[0].count} redemptions in the last 30 days. Consider running similar deals.`,
    });
  }

  const lowInv = await Coupon.find({ vendorId, offerKind: 'surprise_bag', inventoryRemaining: { $lt: 3, $gt: 0 } }).select('title inventoryRemaining');
  if (lowInv.length) {
    suggestions.push({
      severity: 'warn', icon: 'fa-box-open', color: 'amber',
      title: `${lowInv.length} surprise bag(s) low on stock`,
      body: lowInv.map((c) => `"${c.title}" (${c.inventoryRemaining} left)`).join(', '),
    });
  }

  return suggestions;
}

module.exports = { vendorAnalytics, vendorSuggestions };
