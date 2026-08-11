const { nanoid } = require('nanoid');
const paymentRepo = require('../repositories/paymentRepository');
const env = require('../config/env');
const { BadRequestError } = require('../utils/errors');

const MOCK_CARDS = {
  apple_pay: { brand: 'Visa', last4: '4242' },
  google_pay: { brand: 'Mastercard', last4: '5555' },
  card: { brand: 'Amex', last4: '0005' },
  paypal: { brand: 'PayPal', last4: 'PP' },
};

async function processMockPayment({ customerId, amountUSD, method, context }) {
  // Hard safety net: once real card processing is configured, no code path may
  // ever record a fake payment (that would hand out paid goods for free).
  const stripeService = require('./stripeService');
  if (stripeService.isEnabled()) {
    throw new BadRequestError('Card payments are live — this purchase must go through Stripe checkout');
  }
  if (!MOCK_CARDS[method]) throw new BadRequestError('Unsupported payment method');
  const card = MOCK_CARDS[method];
  const payment = await paymentRepo.create({
    customerId,
    amountUSD,
    method,
    brand: card.brand,
    last4: card.last4,
    status: 'succeeded',
    provider: 'mock',
    mockTransactionId: `mock_${nanoid(12)}`,
    context: context || { kind: 'other' },
  });
  return payment;
}

// Persist a successful Stripe payment (called from the webhook after Stripe
// confirms a Checkout Session). Idempotent on providerRef.
async function recordStripePayment({ customerId, amountUSD, context, providerRef, brand, last4 }) {
  const existing = providerRef ? await paymentRepo.findOne({ providerRef }) : null;
  if (existing) return existing;
  return paymentRepo.create({
    customerId,
    amountUSD,
    method: 'card',
    brand: brand || 'Card',
    last4: last4 || '',
    status: 'succeeded',
    provider: 'stripe',
    providerRef,
    context: context || { kind: 'other' },
  });
}

module.exports = { processMockPayment, recordStripePayment };
