// Admin-editable subscription prices.
//
// Default prices live in config/plans.js. An admin can override the monthly and
// yearly price of any paid tier from the admin panel. Overrides are stored in the
// SiteSetting 'plan_pricing' and held in memory, so plans.getPlan() - which has
// many synchronous callers - picks them up without becoming async.
//
// The API runs as a single PM2 process: setPrice()/resetPrice() update the cache
// the moment they write, and a periodic reload covers anything written elsewhere.
const SiteSetting = require('../models/SiteSetting');

const KEY = 'plan_pricing';
const AUDIENCES = ['customer', 'merchant'];

let cache = { customer: {}, merchant: {} };

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// Keep only well-formed { monthly, yearly } entries with positive prices.
function normalise(value) {
  const out = { customer: {}, merchant: {} };
  for (const audience of AUDIENCES) {
    const tiers = (value && value[audience]) || {};
    for (const [tier, p] of Object.entries(tiers)) {
      const monthly = Number(p && p.monthly);
      const yearly = Number(p && p.yearly);
      if (Number.isFinite(monthly) && monthly > 0 && Number.isFinite(yearly) && yearly > 0) {
        out[audience][tier] = {
          monthly: round2(monthly),
          yearly: round2(yearly),
          updatedAt: p.updatedAt || null,
          updatedBy: p.updatedBy || null,
        };
      }
    }
  }
  return out;
}

async function load() {
  const doc = await SiteSetting.findOne({ key: KEY }).lean();
  cache = normalise(doc && doc.value);
  return cache;
}

// { monthly, yearly } if an admin has set this tier's price, otherwise null.
function overrideFor(audience, tier) {
  const o = cache[audience] && cache[audience][tier];
  return o ? { monthly: o.monthly, yearly: o.yearly } : null;
}

// The stored override including who changed it and when, or null.
function meta(audience, tier) {
  return (cache[audience] && cache[audience][tier]) || null;
}

async function save(value, userId) {
  await SiteSetting.findOneAndUpdate(
    { key: KEY },
    { $set: { value, updatedBy: userId } },
    { upsert: true, new: true },
  );
  cache = value;
}

async function setPrice({ audience, tier, monthly, yearly, userId }) {
  const doc = await SiteSetting.findOne({ key: KEY }).lean();
  const value = normalise(doc && doc.value);
  value[audience][tier] = {
    monthly: round2(monthly),
    yearly: round2(yearly),
    updatedAt: new Date(),
    updatedBy: userId ? String(userId) : null,
  };
  await save(value, userId);
  return value[audience][tier];
}

// Back to the default price from config/plans.js.
async function resetPrice({ audience, tier, userId }) {
  const doc = await SiteSetting.findOne({ key: KEY }).lean();
  const value = normalise(doc && doc.value);
  delete value[audience][tier];
  await save(value, userId);
}

let timer = null;
function startAutoReload(ms = 60 * 1000) {
  if (timer) return;
  timer = setInterval(() => { load().catch(() => {}); }, ms);
  if (timer.unref) timer.unref();
}

module.exports = { KEY, load, overrideFor, meta, setPrice, resetPrice, startAutoReload };
