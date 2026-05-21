const paymentRepo = require('../repositories/paymentRepository');

function rangeStart(range, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === 'today') return start;
  if (range === 'week') { start.setDate(start.getDate() - 7); return start; }
  if (range === 'month') { start.setMonth(start.getMonth() - 1); return start; }
  if (range === 'year') { start.setFullYear(start.getFullYear() - 1); return start; }
  return new Date(0);
}

async function overview(range = 'month') {
  const now = new Date();
  const from = rangeStart(range, now);
  const filter = { createdAt: { $gte: from, $lte: now } };
  const [totals, byMethod, byKind, daily, top] = await Promise.all([
    paymentRepo.sumAmount(filter),
    paymentRepo.groupByMethod(filter),
    paymentRepo.groupByKind(filter),
    paymentRepo.dailyTrend(from, now),
    paymentRepo.topCustomers(from, now, 10),
  ]);
  return {
    range,
    from,
    to: now,
    totalUSD: totals.total,
    paymentsCount: totals.count,
    byMethod,
    byKind,
    daily,
    topCustomers: top,
  };
}

async function todayWeekMonth() {
  const now = new Date();
  const [today, week, month, allTime] = await Promise.all([
    paymentRepo.sumAmount({ createdAt: { $gte: rangeStart('today', now), $lte: now } }),
    paymentRepo.sumAmount({ createdAt: { $gte: rangeStart('week', now), $lte: now } }),
    paymentRepo.sumAmount({ createdAt: { $gte: rangeStart('month', now), $lte: now } }),
    paymentRepo.sumAmount({}),
  ]);
  return { today, week, month, allTime };
}

async function listPayments({ page = 1, limit = 20, method, kind, status }) {
  const filter = {};
  if (method) filter.method = method;
  if (kind) filter['context.kind'] = kind;
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    paymentRepo.listAll(filter, { skip, limit }),
    paymentRepo.count(filter),
  ]);
  return { items, total, page, limit };
}

module.exports = { overview, todayWeekMonth, listPayments };
