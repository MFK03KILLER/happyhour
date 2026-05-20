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

async function processMockPayment({ customerId, amountUSD, method }) {
  if (!env.MOCK_PAYMENTS) throw new BadRequestError('Real payments not enabled in demo');
  if (!MOCK_CARDS[method]) throw new BadRequestError('Unsupported payment method');
  const card = MOCK_CARDS[method];
  const payment = await paymentRepo.create({
    customerId,
    amountUSD,
    method,
    brand: card.brand,
    last4: card.last4,
    status: 'succeeded',
    mockTransactionId: `mock_${nanoid(12)}`,
  });
  return payment;
}

module.exports = { processMockPayment };
