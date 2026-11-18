// Thin wrapper around the Stripe SDK. Everything is lazy so the app runs fine
// with no Stripe keys (mock mode). See docs/PAYMENTS_SETUP.md.
const env = require('../config/env');
const { BadRequestError } = require('../utils/errors');

let _stripe = null;

function isEnabled() {
  return env.PAYMENTS_PROVIDER === 'stripe' && !!env.STRIPE_SECRET_KEY;
}

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) throw new BadRequestError('Stripe is not configured on this server');
  if (!_stripe) {
    // Required lazily so a missing `stripe` package never crashes boot in mock mode.
    const Stripe = require('stripe');
    // Pin the API version so a future Stripe release can't change behaviour under us.
    _stripe = Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      maxNetworkRetries: 2,
      appInfo: { name: 'Happy Hour', url: 'https://happyhourz.org' },
    });
  }
  return _stripe;
}

// Creates a one-time Checkout Session for `amountUSD`. We charge the plan/coupon
// price once; the app's own Subscription document tracks the billing period.
async function createCheckoutSession({ amountUSD, label, customerEmail, metadata, successPath, cancelPath }) {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail || undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        product_data: { name: label || 'Happy Hour' },
        unit_amount: Math.round(Number(amountUSD) * 100),
      },
    }],
    success_url: `${env.APP_BASE_URL}${successPath || '/subscribe?checkout=success'}`,
    cancel_url: `${env.APP_BASE_URL}${cancelPath || '/subscribe?checkout=cancel'}`,
    metadata: metadata || {},
  });
}

// ---------------- Recurring memberships ----------------
// One Stripe Product per plan (found by metadata, created on first use). Prices
// are sent inline on each subscription, so the admin's price for new members
// lives in our database (Admin -> Pricing), not in Stripe.
const productCache = {};
async function ensureProduct(tier, label) {
  if (productCache[tier]) return productCache[tier];
  const stripe = getStripe();
  const found = await stripe.products.search({ query: `metadata['hh_tier']:'${tier}' AND active:'true'` }).catch(() => ({ data: [] }));
  const product = found.data[0] || await stripe.products.create({
    name: `Happy Hour ${label} membership`,
    metadata: { hh_tier: tier },
  });
  productCache[tier] = product.id;
  return product.id;
}

async function ensureCustomer(user) {
  const stripe = getStripe();
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName,
    metadata: { userId: String(user._id) },
  });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

function monthlyPriceData(productId, amountUSD) {
  return { currency: 'usd', product: productId, unit_amount: Math.round(Number(amountUSD) * 100), recurring: { interval: 'month' } };
}

// Checkout for a monthly auto-renewing membership. A promo code takes money
// off the first month only.
async function createSubscriptionCheckout({ user, tier, label, amountUSD, discountUSD, metadata, successPath, cancelPath }) {
  const stripe = getStripe();
  const [customer, product] = await Promise.all([ensureCustomer(user), ensureProduct(tier, label)]);
  let discounts;
  if (discountUSD > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(Number(discountUSD) * 100), currency: 'usd', duration: 'once',
      name: metadata?.promoCode ? `Promo ${metadata.promoCode}` : 'Promo',
    });
    discounts = [{ coupon: coupon.id }];
  }
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ quantity: 1, price_data: monthlyPriceData(product, amountUSD) }],
    discounts,
    subscription_data: { metadata: metadata || {} },
    metadata: metadata || {},
    success_url: `${env.APP_BASE_URL}${successPath}`,
    cancel_url: `${env.APP_BASE_URL}${cancelPath}`,
  });
}

// Switch an existing membership to another plan, charging/crediting the
// difference for the rest of the month right away.
async function changeSubscriptionPlan({ subscriptionId, tier, label, amountUSD }) {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const product = await ensureProduct(tier, label);
  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: sub.items.data[0].id, price_data: monthlyPriceData(product, amountUSD) }],
    proration_behavior: 'always_invoice',
    cancel_at_period_end: false,
    metadata: { ...sub.metadata, tier },
  });
}

async function setCancelAtPeriodEnd(subscriptionId, cancel) {
  return getStripe().subscriptions.update(subscriptionId, { cancel_at_period_end: !!cancel });
}

async function retrieveSubscription(subscriptionId) {
  return getStripe().subscriptions.retrieve(subscriptionId);
}

function verifyWebhook(rawBody, signature) {
  const stripe = getStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) throw new BadRequestError('Stripe webhook secret not configured');
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

module.exports = {
  isEnabled, getStripe, createCheckoutSession, verifyWebhook,
  createSubscriptionCheckout, changeSubscriptionPlan, setCancelAtPeriodEnd, retrieveSubscription,
};
