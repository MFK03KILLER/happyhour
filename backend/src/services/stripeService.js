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
    _stripe = Stripe(env.STRIPE_SECRET_KEY);
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

function verifyWebhook(rawBody, signature) {
  const stripe = getStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) throw new BadRequestError('Stripe webhook secret not configured');
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

module.exports = { isEnabled, getStripe, createCheckoutSession, verifyWebhook };
