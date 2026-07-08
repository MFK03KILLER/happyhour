const PromoCode = require('../models/PromoCode');
const { BadRequestError, NotFoundError } = require('../utils/errors');

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Admin CRUD ---------------------------------------------------------------
async function list() {
  return PromoCode.find({}).sort({ createdAt: -1 });
}

async function create(data, createdByUserId) {
  const code = String(data.code || '').toUpperCase().trim();
  if (!code) throw new BadRequestError('Code is required');
  const existing = await PromoCode.findOne({ code });
  if (existing) throw new BadRequestError('A promo code with that code already exists');
  return PromoCode.create({
    code,
    description: data.description || '',
    discountType: data.discountType,
    discountValue: data.discountValue,
    audience: data.audience || 'customer',
    appliesToTiers: data.appliesToTiers || [],
    minAmountUSD: data.minAmountUSD || 0,
    maxRedemptions: data.maxRedemptions ?? null,
    perUserLimit: data.perUserLimit || 1,
    active: data.active !== false,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    createdByUserId,
  });
}

async function update(id, data) {
  const promo = await PromoCode.findById(id);
  if (!promo) throw new NotFoundError('Promo code not found');
  const fields = ['description', 'discountType', 'discountValue', 'audience', 'appliesToTiers',
    'minAmountUSD', 'maxRedemptions', 'perUserLimit', 'active'];
  for (const f of fields) if (data[f] !== undefined) promo[f] = data[f];
  if (data.code !== undefined) promo.code = String(data.code).toUpperCase().trim();
  if (data.startsAt !== undefined) promo.startsAt = data.startsAt ? new Date(data.startsAt) : null;
  if (data.expiresAt !== undefined) promo.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  await promo.save();
  return promo;
}

async function remove(id) {
  const promo = await PromoCode.findByIdAndDelete(id);
  if (!promo) throw new NotFoundError('Promo code not found');
  return promo;
}

// Validation + pricing -----------------------------------------------------
// Returns { promo, discountUSD, finalUSD }. Throws BadRequestError with a
// customer-friendly message when the code cannot be applied.
async function validateAndPrice({ code, audience, tier, amountUSD, userId }) {
  if (!code) return { promo: null, discountUSD: 0, finalUSD: amountUSD };
  const promo = await PromoCode.findOne({ code: String(code).toUpperCase().trim() });
  if (!promo || !promo.active) throw new BadRequestError('Invalid promo code');
  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) throw new BadRequestError('This promo code is not active yet');
  if (promo.expiresAt && promo.expiresAt < now) throw new BadRequestError('This promo code has expired');
  if (promo.audience !== 'all' && audience && promo.audience !== audience) {
    throw new BadRequestError('This promo code is not valid for this plan');
  }
  if (promo.appliesToTiers.length && tier && !promo.appliesToTiers.includes(tier)) {
    throw new BadRequestError('This promo code does not apply to the selected plan');
  }
  if (promo.maxRedemptions != null && promo.timesRedeemed >= promo.maxRedemptions) {
    throw new BadRequestError('This promo code has reached its redemption limit');
  }
  if (userId && promo.perUserLimit != null) {
    const used = promo.redeemedBy.filter((u) => u.toString() === userId.toString()).length;
    if (used >= promo.perUserLimit) throw new BadRequestError('You have already used this promo code');
  }
  if (amountUSD != null && promo.minAmountUSD && amountUSD < promo.minAmountUSD) {
    throw new BadRequestError(`This code requires a minimum of $${promo.minAmountUSD.toFixed(2)}`);
  }
  let discountUSD = 0;
  if (amountUSD != null) {
    discountUSD = promo.discountType === 'percent'
      ? (amountUSD * promo.discountValue) / 100
      : promo.discountValue;
    discountUSD = round2(Math.min(discountUSD, amountUSD));
  }
  const finalUSD = amountUSD != null ? round2(amountUSD - discountUSD) : null;
  return { promo, discountUSD, finalUSD };
}

// Record that a user redeemed the code (call once payment succeeds).
async function recordRedemption(promoId, userId) {
  if (!promoId) return;
  await PromoCode.findByIdAndUpdate(promoId, {
    $inc: { timesRedeemed: 1 },
    ...(userId ? { $push: { redeemedBy: userId } } : {}),
  });
}

module.exports = { list, create, update, remove, validateAndPrice, recordRedemption };
