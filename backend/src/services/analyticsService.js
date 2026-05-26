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

async function couponPerformanceByLocation(vendorId, couponId) {
  const Redemption = require('../models/Redemption');
  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOne({ _id: couponId, vendorId });
  if (!coupon) return null;
  const merchantIds = coupon.merchantIds;
  const stats = await Redemption.aggregate([
    { $match: { couponId: coupon._id, status: 'completed' } },
    { $group: { _id: '$merchantId', count: { $sum: 1 }, savings: { $sum: '$amountSavedUSD' }, last: { $max: '$scannedAt' } } },
    { $lookup: { from: 'merchants', localField: '_id', foreignField: '_id', as: 'merchant' } },
    { $unwind: '$merchant' },
    { $sort: { count: -1 } },
  ]);
  const nonZero = stats.map((s) => ({ merchantId: s._id, merchant: s.merchant, count: s.count, savings: s.savings, lastScan: s.last }));
  const seenIds = new Set(nonZero.map((s) => String(s.merchantId)));
  const Merchant = require('../models/Merchant');
  const zeroMerchants = await Merchant.find({ _id: { $in: merchantIds.filter((id) => !seenIds.has(String(id))) } });
  const zeros = zeroMerchants.map((m) => ({ merchantId: m._id, merchant: m, count: 0, savings: 0, lastScan: null }));
  return { coupon, breakdown: [...nonZero, ...zeros] };
}

async function bestCouponNow(vendorId) {
  const Coupon = require('../models/Coupon');
  const Merchant = require('../models/Merchant');
  const now = new Date();
  const DAY_NAMES = ['sun','mon','tue','wed','thu','fri','sat'];
  const today = DAY_NAMES[now.getDay()];
  const curMin = now.getHours() * 60 + now.getMinutes();

  const merchants = await Merchant.find({ vendorId, status: 'active' });
  const slowMerchants = merchants.filter((m) => {
    const slots = m.offPeakHours || [];
    return slots.some((s) => {
      if (s.day !== 'daily' && s.day !== today) return false;
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return curMin >= sh * 60 + sm && curMin <= eh * 60 + em;
    });
  });

  const activeCoupons = await Coupon.find({ vendorId, status: 'active', validUntil: { $gte: now } });
  const liveNow = activeCoupons.filter((c) => {
    if (!c.activeWindow || !c.activeWindow.start) return true;
    const days = c.activeWindow.days || ['daily'];
    if (!days.includes('daily') && !days.includes(today)) return false;
    const [sh, sm] = c.activeWindow.start.split(':').map(Number);
    const [eh, em] = c.activeWindow.end.split(':').map(Number);
    return curMin >= sh * 60 + sm && curMin <= eh * 60 + em;
  });

  const Redemption = require('../models/Redemption');
  const ranked = await Promise.all(liveNow.map(async (c) => {
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentScans = await Redemption.countDocuments({ couponId: c._id, status: 'completed', scannedAt: { $gte: fromDate } });
    return { coupon: c, recentScans, isToday: !!c.todaysOffer, isFeatured: !!c.featured, isPopup: !!c.popupOffer };
  }));
  ranked.sort((a, b) => {
    const aScore = a.recentScans * 10 + (a.isPopup ? 25 : 0) + (a.isToday ? 15 : 0) + (a.isFeatured ? 5 : 0);
    const bScore = b.recentScans * 10 + (b.isPopup ? 25 : 0) + (b.isToday ? 15 : 0) + (b.isFeatured ? 5 : 0);
    return bScore - aScore;
  });

  return {
    now,
    slowMerchantCount: slowMerchants.length,
    slowMerchants: slowMerchants.slice(0, 5),
    activeNow: ranked.length,
    top: ranked.slice(0, 3),
  };
}

async function vendorActivityFeed(vendorId, { limit = 50 } = {}) {
  const AuditLog = require('../models/AuditLog');
  const User = require('../models/User');
  const teamUserIds = await User.find({ vendorId }).distinct('_id');
  const items = await AuditLog.find({ actorUserId: { $in: teamUserIds } }).sort({ createdAt: -1 }).limit(limit).populate('actorUserId', 'fullName email roleSlug');
  return items;
}

async function redemptionsExportCsv(vendorId, { from, to } = {}) {
  const Redemption = require('../models/Redemption');
  const Merchant = require('../models/Merchant');
  const merchants = await Merchant.find({ vendorId }).distinct('_id');
  const filter = { merchantId: { $in: merchants }, status: 'completed' };
  if (from) filter.scannedAt = { ...(filter.scannedAt || {}), $gte: new Date(from) };
  if (to) filter.scannedAt = { ...(filter.scannedAt || {}), $lte: new Date(to) };
  const rows = await Redemption.find(filter).sort({ scannedAt: -1 }).limit(5000).populate('couponId merchantId customerId');
  const header = 'Date,Time,Merchant,Coupon,Customer,Email,Discount USD,Redemption ID';
  const csv = [header];
  for (const r of rows) {
    const dt = new Date(r.scannedAt);
    const date = dt.toISOString().slice(0, 10);
    const time = dt.toISOString().slice(11, 19);
    const merchantName = (r.merchantId?.name || '').replace(/,/g, ' ');
    const couponTitle = (r.couponId?.title || '').replace(/,/g, ' ');
    const custName = (r.customerId?.fullName || r.customerSnapshot?.name || '').replace(/,/g, ' ');
    const custEmail = r.customerId?.email || r.customerSnapshot?.email || '';
    const savings = (r.amountSavedUSD || 0).toFixed(2);
    csv.push(`${date},${time},${merchantName},${couponTitle},${custName},${custEmail},${savings},${r._id}`);
  }
  return csv.join('\n');
}

module.exports = {
  vendorAnalytics, vendorSuggestions,
  couponPerformanceByLocation, bestCouponNow,
  vendorActivityFeed, redemptionsExportCsv,
};
