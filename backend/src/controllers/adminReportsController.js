// Redemptions per restaurant, split by the member's plan - what the business
// pays restaurants back from. Month is a Pacific-time calendar month.
const asyncHandler = require('../utils/asyncHandler');
const Redemption = require('../models/Redemption');
const Vendor = require('../models/Vendor');
const { monthRange } = require('../utils/periods');

const TIERS = ['basic', 'gold', 'premium'];

function parseMonth(q) {
  return typeof q === 'string' && /^\d{4}-\d{2}$/.test(q) ? q : null;
}

async function build(month) {
  const [start, end] = monthRange(month);
  const rows = await Redemption.aggregate([
    { $match: { status: 'completed', scannedAt: { $gte: start, $lt: end } } },
    { $group: {
      _id: { vendorId: '$vendorId', tier: { $ifNull: ['$memberTier', 'unknown'] } },
      count: { $sum: 1 },
      savedUSD: { $sum: { $ifNull: ['$amountSavedUSD', 0] } },
    } },
  ]);
  const byVendor = new Map();
  for (const r of rows) {
    const key = String(r._id.vendorId || 'none');
    if (!byVendor.has(key)) byVendor.set(key, { vendorId: r._id.vendorId || null, total: 0, savedUSD: 0, tiers: {} });
    const v = byVendor.get(key);
    v.tiers[r._id.tier] = { count: r.count, savedUSD: Math.round(r.savedUSD * 100) / 100 };
    v.total += r.count;
    v.savedUSD = Math.round((v.savedUSD + r.savedUSD) * 100) / 100;
  }
  const ids = [...byVendor.values()].map((v) => v.vendorId).filter(Boolean);
  const names = Object.fromEntries((await Vendor.find({ _id: { $in: ids } }).select('name').lean()).map((v) => [String(v._id), v.name]));
  const vendors = [...byVendor.values()]
    .map((v) => ({ ...v, name: v.vendorId ? names[String(v.vendorId)] || 'Deleted restaurant' : 'Older redemptions (no restaurant recorded)' }))
    .sort((a, b) => b.total - a.total);
  const totals = { total: 0, tiers: {} };
  for (const v of vendors) {
    totals.total += v.total;
    for (const [t, x] of Object.entries(v.tiers)) {
      totals.tiers[t] = (totals.tiers[t] || 0) + x.count;
    }
  }
  return { month: month || start.toISOString().slice(0, 7), start, end, tiers: TIERS, vendors, totals };
}

exports.redemptionsByPlan = asyncHandler(async (req, res) => {
  res.json(await build(parseMonth(req.query.month)));
});

// Every redemption of the month as CSV (one row per scan).
exports.redemptionsCsv = asyncHandler(async (req, res) => {
  const month = parseMonth(req.query.month);
  const [start, end] = monthRange(month);
  const items = await Redemption.find({ status: 'completed', scannedAt: { $gte: start, $lt: end } })
    .populate('couponId', 'title').populate('merchantId', 'name').populate('vendorId', 'name')
    .sort({ scannedAt: 1 }).lean();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['scanned_at_utc', 'restaurant', 'location', 'offer', 'member_plan', 'member_plan_price_usd', 'customer', 'customer_email', 'saved_usd'].join(',')];
  for (const r of items) {
    lines.push([
      r.scannedAt?.toISOString(), r.vendorId?.name, r.merchantId?.name, r.couponId?.title,
      r.memberTier || 'unknown', r.memberPlanPriceUSD ?? '', r.customerSnapshot?.name, r.customerSnapshot?.email, r.amountSavedUSD ?? '',
    ].map(esc).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="redemptions-${month || start.toISOString().slice(0, 7)}.csv"`);
  res.send(lines.join('\n'));
});

