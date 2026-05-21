const { nanoid } = require('nanoid');
const paymentRepo = require('../repositories/paymentRepository');
const env = require('../config/env');
const { BadRequestError } = require('../utils/errors');

const GATEWAYS = {
  zibal: { brand: 'زیبال', last4: 'ZBL' },
  zarinpal: { brand: 'زرین‌پال', last4: 'ZRP' },
  saman: { brand: 'سامان', last4: 'SMN' },
  card_to_card: { brand: 'کارت به کارت', last4: 'C2C' },
};

async function processMockPayment({ customerId, amountUSD, method, context }) {
  if (!env.MOCK_PAYMENTS) throw new BadRequestError('پرداخت واقعی در حالت دمو فعال نیست');
  if (!GATEWAYS[method]) throw new BadRequestError('درگاه پرداخت پشتیبانی نمی‌شود');
  const card = GATEWAYS[method];
  const payment = await paymentRepo.create({
    customerId,
    amountUSD,
    method,
    brand: card.brand,
    last4: card.last4,
    status: 'succeeded',
    mockTransactionId: `mock_${nanoid(12)}`,
    context: context || { kind: 'other' },
  });
  return payment;
}

module.exports = { processMockPayment };
