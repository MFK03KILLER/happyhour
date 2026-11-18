const Subscription = require('../models/Subscription');
const User = require('../models/User');
const paymentService = require('./paymentService');
const stripeService = require('./stripeService');
const promoCodeService = require('./promoCodeService');
const plans = require('../config/plans');
const planService = require('./planService');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function getMine(userOrId, audience) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const result = await planService.getUserPlan(user, aud);
  return {
    audience: aud,
    tier: result.tier || (aud === 'merchant' ? 'basic' : 'free'),
    plan: result.plan,
    subscription: result.subscription,
  };
}

// Resolve the plan + price the caller is trying to buy. Throws on invalid input.
async function resolvePlan({ user, tier, plan, audience }) {
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const tierKey = tier || (aud === 'merchant' ? 'gold' : 'basic');
  // Customer memberships are monthly only since Nov 2026.
  const billing = aud === 'customer' ? 'monthly' : (plan === 'yearly' ? 'yearly' : 'monthly');
  const def = plans.getPlan(tierKey, aud);
  const freeTier = aud === 'merchant' ? 'basic' : 'free';
  if (!def || def.tier !== tierKey || def.tier === freeTier) throw new BadRequestError('Choose a paid plan');
  const amount = def.price[billing];
  if (!amount || amount <= 0) throw new BadRequestError('Invalid plan price');
  const days = billing === 'yearly' ? 365 : 30;
  return { aud, tierKey, billing, def, amount, days };
}

// Upsert the Subscription document + cache the tier on the user.
async function activateSubscription({ user, aud, tierKey, billing, days, amountUSD, paymentMethod, payment, def, periodEnd: exactEnd, stripe }) {
  const now = new Date();
  const periodEnd = exactEnd || new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const baseDoc = {
    audience: aud,
    tier: tierKey,
    plan: billing,
    status: 'active',
    startedAt: now,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    paymentMethod,
    amountUSD,
    dailyClaimLimit: def?.limits?.redemptionsPerRestaurantMonthly ?? 1,
    ...(stripe ? { stripeSubscriptionId: stripe.subscriptionId, stripeCustomerId: stripe.customerId } : {}),
  };
  let filter;
  if (aud === 'merchant') {
    if (!user.vendorId) throw new BadRequestError('Merchant user must be linked to a vendor');
    baseDoc.vendorId = user.vendorId;
    filter = { audience: 'merchant', vendorId: user.vendorId };
  } else {
    baseDoc.customerId = user._id;
    filter = { audience: 'customer', customerId: user._id };
  }
  const sub = await Subscription.findOneAndUpdate(
    filter,
    {
      $set: baseDoc,
      ...(stripe ? {} : { $unset: { stripeSubscriptionId: '', stripeCustomerId: '' } }),
      ...(payment ? { $push: { payments: payment._id } } : {}),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  user.planTier = tierKey;
  await user.save();
  return sub;
}

// No payment processor configured yet: membership is free during launch.
// Nothing is charged, so no payment or revenue is recorded, and the period is
// always one month so nobody locks in a free year before online payment opens.
// (This used to fake a successful card/Apple Pay charge, which App Review rejects.)
async function subscribe({ userOrId, tier, audience }) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  if (stripeService.isEnabled()) {
    throw new BadRequestError('Card payments are enabled — start Stripe checkout instead of /subscribe');
  }
  const { aud, tierKey, billing, def, days } = await resolvePlan({ user, tier, plan: 'monthly', audience });
  const sub = await activateSubscription({
    user, aud, tierKey, billing, days, amountUSD: 0, paymentMethod: undefined, payment: null, def,
  });
  return { subscription: sub, payment: null, plan: def, discountUSD: 0, promoCode: null, freeLaunch: true };
}

// Stripe path: create a Checkout Session and return its URL. Nothing is
// activated until the webhook confirms payment (see finalizeStripeCheckout).
// returnTo 'app': the native apps open Checkout in an in-app browser sheet
// (SFSafariViewController / Custom Tabs, where Apple Pay and Google Pay work),
// so Stripe sends the customer to a small page that says "return to the app".
async function createCheckout({ userOrId, tier, plan, audience, promoCode, returnTo }) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const { aud, tierKey, billing, def, amount, days } = await resolvePlan({ user, tier, plan, audience });
  const { promo, discountUSD, finalUSD } = await promoCodeService.validateAndPrice({
    code: promoCode, audience: aud, tier: tierKey, amountUSD: amount, userId: user._id,
  });
  // A 100% promo code (e.g. the one given to App Review) leaves nothing to
  // charge, and Stripe can't take $0 - activate directly instead.
  if (finalUSD <= 0) {
    if (promo) await promoCodeService.recordRedemption(promo._id, user._id);
    const subscription = await activateSubscription({
      user, aud, tierKey, billing, days, amountUSD: 0, paymentMethod: undefined, payment: null, def,
    });
    return { activated: true, subscription, plan: def, amountUSD: 0, discountUSD };
  }
  const inApp = returnTo === 'app';
  const successPath = inApp ? '/checkout-done?status=success' : '/subscribe?checkout=success';
  const cancelPath = inApp ? '/checkout-done?status=cancel' : '/subscribe?checkout=cancel';
  if (aud === 'customer') {
    const current = await Subscription.findOne({ audience: 'customer', customerId: user._id, status: 'active', stripeSubscriptionId: { $exists: true } });
    if (current && current.currentPeriodEnd > new Date()) {
      throw new BadRequestError('You already have a membership. Change your plan instead.');
    }
    const session = await stripeService.createSubscriptionCheckout({
      user, tier: tierKey, label: def.label, amountUSD: amount, discountUSD,
      successPath, cancelPath,
      metadata: {
        kind: 'subscription', recurring: '1', userId: String(user._id), audience: aud, tier: tierKey, billing,
        promoId: promo ? String(promo._id) : '', promoCode: promo ? promo.code : '', discountUSD: String(discountUSD),
      },
    });
    return { url: session.url, sessionId: session.id, amountUSD: finalUSD, discountUSD };
  }
  const session = await stripeService.createCheckoutSession({
    amountUSD: finalUSD,
    label: `Happy Hour — ${def.label} ${billing}`,
    customerEmail: user.email,
    successPath: inApp ? '/checkout-done?status=success' : '/subscribe?checkout=success',
    cancelPath: inApp ? '/checkout-done?status=cancel' : '/subscribe?checkout=cancel',
    metadata: {
      kind: 'subscription',
      userId: String(user._id),
      audience: aud,
      tier: tierKey,
      billing,
      amountUSD: String(finalUSD),
      promoId: promo ? String(promo._id) : '',
      promoCode: promo ? promo.code : '',
      discountUSD: String(discountUSD),
    },
  });
  return { url: session.url, sessionId: session.id, amountUSD: finalUSD, discountUSD };
}

// Called from the Stripe webhook on checkout.session.completed. Idempotent.
async function finalizeStripeCheckout(session) {
  const md = session.metadata || {};
  if (md.kind !== 'subscription') return null;
  if (session.mode === 'subscription') return finalizeRecurringCheckout(session);
  const user = await User.findById(md.userId);
  if (!user) return null;
  const aud = md.audience || 'customer';
  const tierKey = md.tier || 'gold';
  const billing = md.billing === 'yearly' ? 'yearly' : 'monthly';
  const def = plans.getPlan(tierKey, aud);
  const days = billing === 'yearly' ? 365 : 30;
  const amountUSD = Number(md.amountUSD || (session.amount_total || 0) / 100);
  const payment = await paymentService.recordStripePayment({
    customerId: user._id,
    amountUSD,
    providerRef: session.payment_intent || session.id,
    context: {
      kind: 'subscription',
      label: `${def.label} ${billing} (${aud})`,
      refType: 'Subscription',
      promoCode: md.promoCode || undefined,
      discountUSD: Number(md.discountUSD || 0),
    },
  });
  // Stripe retries webhooks; a payment that already activated a membership
  // must not restart its period.
  if (await Subscription.exists({ payments: payment._id })) return { payment, alreadyProcessed: true };
  if (md.promoId) await promoCodeService.recordRedemption(md.promoId, user._id);
  const sub = await activateSubscription({
    user, aud, tierKey, billing, days, amountUSD, paymentMethod: 'card', payment, def,
  });
  return { subscription: sub, payment };
}

async function finalizeRecurringCheckout(session) {
  const md = session.metadata || {};
  const user = await User.findById(md.userId);
  if (!user) return null;
  const stripeSub = await stripeService.retrieveSubscription(session.subscription);
  const tierKey = md.tier || stripeSub.metadata?.tier || 'basic';
  const def = plans.getPlan(tierKey, 'customer');
  const amountUSD = (session.amount_total || 0) / 100;
  const payment = amountUSD > 0 ? await paymentService.recordStripePayment({
    customerId: user._id,
    amountUSD,
    providerRef: session.invoice || session.id,
    context: { kind: 'subscription', label: `${def.label} monthly (customer)`, refType: 'Subscription', promoCode: md.promoCode || undefined, discountUSD: Number(md.discountUSD || 0) },
  }) : null;
  const existing = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
  if (existing && payment && existing.payments.some((x) => String(x) === String(payment._id))) return { subscription: existing, alreadyProcessed: true };
  if (md.promoId && !existing) await promoCodeService.recordRedemption(md.promoId, user._id);
  const sub = await activateSubscription({
    user, aud: 'customer', tierKey, billing: 'monthly', days: 30,
    amountUSD: (stripeSub.items.data[0]?.price?.unit_amount || 0) / 100 || amountUSD,
    paymentMethod: 'card', payment, def,
    periodEnd: new Date(stripeSub.current_period_end * 1000),
    stripe: { subscriptionId: stripeSub.id, customerId: stripeSub.customer },
  });
  return { subscription: sub, payment };
}

// invoice.paid - monthly renewals (and the charge for a mid-month upgrade).
async function handleInvoicePaid(invoice) {
  if (!invoice.subscription) return null;
  const sub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
  if (!sub) return null;                     // first invoice: handled by checkout.session.completed
  const amountUSD = (invoice.amount_paid || 0) / 100;
  const line = (invoice.lines?.data || []).find((l) => l.period?.end) || {};
  if (line.period?.end) sub.currentPeriodEnd = new Date(Math.max(sub.currentPeriodEnd?.getTime() || 0, line.period.end * 1000));
  sub.status = 'active';
  if (amountUSD > 0) {
    const def = plans.getPlan(sub.tier, 'customer');
    const payment = await paymentService.recordStripePayment({
      customerId: sub.customerId,
      amountUSD,
      providerRef: invoice.id,
      context: { kind: 'subscription', label: `${def.label} monthly (customer) - ${invoice.billing_reason === 'subscription_cycle' ? 'renewal' : 'plan change'}`, refType: 'Subscription' },
    });
    if (!sub.payments.some((x) => String(x) === String(payment._id))) sub.payments.push(payment._id);
  }
  await sub.save();
  return sub;
}

// customer.subscription.updated / .deleted - plan changes, cancellations,
// failed renewals.
async function syncStripeSubscription(stripeSub, deleted = false) {
  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
  if (!sub) return null;
  const tier = stripeSub.metadata?.tier;
  if (tier && plans.getPlan(tier, 'customer').tier === tier) sub.tier = tier;
  const unit = stripeSub.items?.data?.[0]?.price?.unit_amount;
  if (unit) sub.amountUSD = unit / 100;
  sub.cancelAtPeriodEnd = !!stripeSub.cancel_at_period_end;
  if (stripeSub.current_period_end) sub.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
  if (deleted || stripeSub.status === 'canceled') {
    sub.status = 'cancelled';
    sub.currentPeriodEnd = new Date((stripeSub.ended_at || Date.now() / 1000) * 1000);
  } else if (['past_due', 'unpaid', 'incomplete_expired'].includes(stripeSub.status)) {
    sub.status = 'past_due';
  } else if (['active', 'trialing'].includes(stripeSub.status)) {
    sub.status = 'active';
  }
  await sub.save();
  await User.updateOne({ _id: sub.customerId }, { $set: { planTier: sub.status === 'active' ? sub.tier : 'free' } });
  return sub;
}

// Upgrade/downgrade an auto-renewing membership.
async function changePlan({ userOrId, tier }) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const { tierKey, def, amount } = await resolvePlan({ user, tier, plan: 'monthly', audience: 'customer' });
  const sub = await Subscription.findOne({ audience: 'customer', customerId: user._id });
  if (!sub || !sub.stripeSubscriptionId || sub.status !== 'active') {
    throw new BadRequestError("Your membership can't be changed in the app. Contact support.");
  }
  if (sub.tier === tierKey) throw new BadRequestError(`You're already on ${def.label}`);
  await stripeService.changeSubscriptionPlan({ subscriptionId: sub.stripeSubscriptionId, tier: tierKey, label: def.label, amountUSD: amount });
  sub.tier = tierKey;
  sub.amountUSD = amount;
  sub.cancelAtPeriodEnd = false;
  sub.dailyClaimLimit = def.limits?.redemptionsPerRestaurantMonthly ?? 1;
  await sub.save();
  user.planTier = tierKey;
  await user.save();
  return { subscription: sub, plan: def };
}

async function cancel(userOrId, audience) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const filter = aud === 'merchant'
    ? { audience: 'merchant', vendorId: user.vendorId }
    : { audience: 'customer', customerId: user._id };
  const sub = await Subscription.findOne(filter);
  if (!sub) throw new NotFoundError('No subscription');
  if (sub.stripeSubscriptionId) await stripeService.setCancelAtPeriodEnd(sub.stripeSubscriptionId, true);
  sub.cancelAtPeriodEnd = true;
  await sub.save();
  return sub;
}

async function resume(userOrId, audience) {
  const user = userOrId._id ? userOrId : await User.findById(userOrId);
  if (!user) throw new NotFoundError('User not found');
  const aud = audience || (user.role === 'vendor' || user.role === 'merchant_staff' ? 'merchant' : 'customer');
  const filter = aud === 'merchant'
    ? { audience: 'merchant', vendorId: user.vendorId }
    : { audience: 'customer', customerId: user._id };
  const sub = await Subscription.findOne(filter);
  if (!sub) throw new NotFoundError('No subscription');
  if (sub.stripeSubscriptionId) await stripeService.setCancelAtPeriodEnd(sub.stripeSubscriptionId, false);
  sub.cancelAtPeriodEnd = false;
  await sub.save();
  return sub;
}

// Used by couponService.claim — gate behind any active paid plan (Gold or Premium).
async function ensureActive(customerId) {
  const user = await User.findById(customerId);
  if (!user) throw new NotFoundError('User not found');
  const { plan } = await planService.getUserPlan(user, 'customer');
  if (plan.tier === 'free') {
    const err = new BadRequestError('Join a membership plan to claim coupons');
    err.code = 'MEMBERSHIP_REQUIRED';
    throw err;
  }
  const sub = await Subscription.findOne({ audience: 'customer', customerId, status: 'active' })
    || await Subscription.findOne({ customerId, status: 'active' });
  if (!sub || sub.currentPeriodEnd < new Date()) {
    throw new BadRequestError('Subscription required to claim coupons');
  }
  return sub;
}

module.exports = {
  getMine,
  changePlan,
  handleInvoicePaid,
  syncStripeSubscription,
  subscribe,
  createCheckout,
  finalizeStripeCheckout,
  cancel,
  resume,
  ensureActive,
};
