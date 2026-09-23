const asyncHandler = require('../utils/asyncHandler');
const plans = require('../config/plans');
const pricingService = require('../services/pricingService');
const auditService = require('../services/auditService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

// Defaults straight from config/plans.js, before any admin override.
const DEFAULTS = { customer: plans.CUSTOMER_PLANS, merchant: plans.MERCHANT_PLANS };

function requirePaidPlan(audience, tier) {
  const def = DEFAULTS[audience] && DEFAULTS[audience][tier];
  if (!def) throw new NotFoundError('Unknown plan');
  if (!(def.price.monthly > 0)) throw new BadRequestError('The free plan has no price to set');
  return def;
}

function describe(audience) {
  return Object.values(DEFAULTS[audience])
    .filter((d) => d.price.monthly > 0)
    .map((d) => {
      const m = pricingService.meta(audience, d.tier);
      return {
        audience,
        tier: d.tier,
        label: d.label,
        badge: d.badge,
        price: m ? { monthly: m.monthly, yearly: m.yearly } : { ...d.price },
        defaultPrice: { ...d.price },
        overridden: !!m,
        updatedAt: m ? m.updatedAt : null,
      };
    });
}

const snapshot = () => ({ customer: describe('customer'), merchant: describe('merchant') });

exports.list = asyncHandler(async (req, res) => {
  await pricingService.load(); // show exactly what is stored
  res.json(snapshot());
});

exports.update = asyncHandler(async (req, res) => {
  const { audience, tier } = req.params;
  requirePaidPlan(audience, tier);
  const before = pricingService.meta(audience, tier);
  const saved = await pricingService.setPrice({
    audience, tier, monthly: req.body.monthly, yearly: req.body.yearly, userId: req.user._id,
  });
  await auditService.log({
    actorUserId: req.user._id, action: 'plan_price.update',
    targetType: 'Plan', targetId: `${audience}:${tier}`, before, after: saved, req,
  });
  res.json(snapshot());
});

exports.reset = asyncHandler(async (req, res) => {
  const { audience, tier } = req.params;
  requirePaidPlan(audience, tier);
  const before = pricingService.meta(audience, tier);
  await pricingService.resetPrice({ audience, tier, userId: req.user._id });
  await auditService.log({
    actorUserId: req.user._id, action: 'plan_price.reset',
    targetType: 'Plan', targetId: `${audience}:${tier}`, before, after: null, req,
  });
  res.json(snapshot());
});
