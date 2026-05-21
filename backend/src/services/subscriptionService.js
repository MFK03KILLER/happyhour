const subRepo = require('../repositories/subscriptionRepository');
const paymentService = require('./paymentService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const PLANS = {
  monthly: { amountUSD: 4.99, days: 30 },
  yearly: { amountUSD: 41.99, days: 365 },
};

async function getMine(customerId) {
  return subRepo.findByCustomer(customerId);
}

async function subscribe({ customerId, plan, paymentMethod }) {
  if (!PLANS[plan]) throw new BadRequestError('Invalid plan');
  const def = PLANS[plan];
  const payment = await paymentService.processMockPayment({
    customerId,
    amountUSD: def.amountUSD,
    method: paymentMethod,
    context: { kind: 'subscription', label: `${plan.charAt(0).toUpperCase() + plan.slice(1)} membership`, refType: 'Subscription' },
  });
  const now = new Date();
  const periodEnd = new Date(now.getTime() + def.days * 24 * 60 * 60 * 1000);
  const sub = await subRepo.upsertForCustomer(customerId, {
    customerId,
    plan,
    status: 'active',
    startedAt: now,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    paymentMethod,
    amountUSD: def.amountUSD,
  });
  await subRepo.pushPayment(sub._id, payment._id);
  return { subscription: sub, payment };
}

async function cancel(customerId) {
  const sub = await subRepo.findByCustomer(customerId);
  if (!sub) throw new NotFoundError('No subscription');
  sub.cancelAtPeriodEnd = true;
  await sub.save();
  return sub;
}

async function resume(customerId) {
  const sub = await subRepo.findByCustomer(customerId);
  if (!sub) throw new NotFoundError('No subscription');
  sub.cancelAtPeriodEnd = false;
  await sub.save();
  return sub;
}

async function ensureActive(customerId) {
  const sub = await subRepo.findByCustomer(customerId);
  if (!sub || sub.status !== 'active' || sub.currentPeriodEnd < new Date()) {
    throw new BadRequestError('Subscription required to claim coupons');
  }
  return sub;
}

module.exports = { getMine, subscribe, cancel, resume, ensureActive, PLANS };
