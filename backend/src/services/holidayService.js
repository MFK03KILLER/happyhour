const Holiday = require('../models/Holiday');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// US Federal Holidays for 2025-2027 (date-precomputed; no DST/timezone surprises)
// Sources: US OPM official schedule
const US_FEDERAL_HOLIDAYS = [
  // 2025
  { date: '2025-01-01', name: "New Year's Day" },
  { date: '2025-01-20', name: 'Martin Luther King Jr. Day' },
  { date: '2025-02-17', name: 'Presidents Day' },
  { date: '2025-05-26', name: 'Memorial Day' },
  { date: '2025-06-19', name: 'Juneteenth' },
  { date: '2025-07-04', name: 'Independence Day' },
  { date: '2025-09-01', name: 'Labor Day' },
  { date: '2025-10-13', name: 'Columbus Day' },
  { date: '2025-11-11', name: 'Veterans Day' },
  { date: '2025-11-27', name: 'Thanksgiving Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
  // 2026
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
  { date: '2026-02-16', name: 'Presidents Day' },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-06-19', name: 'Juneteenth' },
  { date: '2026-07-03', name: 'Independence Day (observed)' },
  { date: '2026-07-04', name: 'Independence Day' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-10-12', name: 'Columbus Day' },
  { date: '2026-11-11', name: 'Veterans Day' },
  { date: '2026-11-26', name: 'Thanksgiving Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
  // 2027
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-01-18', name: 'Martin Luther King Jr. Day' },
  { date: '2027-02-15', name: 'Presidents Day' },
  { date: '2027-05-31', name: 'Memorial Day' },
  { date: '2027-06-18', name: 'Juneteenth (observed)' },
  { date: '2027-07-05', name: 'Independence Day (observed)' },
  { date: '2027-09-06', name: 'Labor Day' },
  { date: '2027-10-11', name: 'Columbus Day' },
  { date: '2027-11-11', name: 'Veterans Day' },
  { date: '2027-11-25', name: 'Thanksgiving Day' },
  { date: '2027-12-24', name: 'Christmas Day (observed)' },
  { date: '2027-12-25', name: 'Christmas Day' },
];

function todayYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function seedUSFederalHolidays() {
  for (const h of US_FEDERAL_HOLIDAYS) {
    await Holiday.updateOne(
      { scope: 'global', date: h.date, name: h.name },
      { $setOnInsert: { scope: 'global', date: h.date, name: h.name } },
      { upsert: true },
    );
  }
}

async function listGlobal({ year } = {}) {
  const q = { scope: 'global' };
  if (year) {
    q.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
  }
  return Holiday.find(q).sort({ date: 1 });
}

async function listCustom(merchantId) {
  return Holiday.find({ scope: 'merchant', merchantId }).sort({ date: 1 });
}

async function listForMerchant(merchantId, { year } = {}) {
  const [global, custom] = await Promise.all([listGlobal({ year }), listCustom(merchantId)]);
  return { global, custom };
}

async function addCustom({ merchantId, date, name, userId }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestError('Invalid date — must be YYYY-MM-DD');
  if (!name || name.trim().length < 2) throw new BadRequestError('Name required');
  const existing = await Holiday.findOne({ scope: 'merchant', merchantId, date });
  if (existing) throw new BadRequestError('You already have a holiday on this date');
  return Holiday.create({ scope: 'merchant', merchantId, date, name: name.trim(), createdBy: userId });
}

async function removeCustom({ holidayId, merchantId }) {
  const found = await Holiday.findOne({ _id: holidayId, scope: 'merchant', merchantId });
  if (!found) throw new NotFoundError('Custom holiday not found');
  await found.deleteOne();
  return found;
}

// Returns { isHoliday: true, name: '...' } if today is a holiday for the given merchant
// (union of global + custom). Otherwise { isHoliday: false }.
async function isHolidayTodayFor(merchantId, opts = {}) {
  const date = opts.date || todayYmd();
  const q = {
    date,
    $or: [{ scope: 'global' }, { scope: 'merchant', merchantId }],
  };
  const found = await Holiday.findOne(q);
  if (!found) return { isHoliday: false };
  return { isHoliday: true, name: found.name, scope: found.scope, date };
}

// Build a Set of YYYY-MM-DD strings that count as holidays for the given merchant.
// Use this when checking many coupons at once.
async function holidaySetForMerchant(merchantId) {
  const q = { $or: [{ scope: 'global' }, { scope: 'merchant', merchantId }] };
  const items = await Holiday.find(q, 'date name');
  const set = new Map();
  for (const h of items) set.set(h.date, h.name);
  return set;
}

module.exports = {
  US_FEDERAL_HOLIDAYS,
  seedUSFederalHolidays,
  listGlobal,
  listCustom,
  listForMerchant,
  addCustom,
  removeCustom,
  isHolidayTodayFor,
  holidaySetForMerchant,
  todayYmd,
};
