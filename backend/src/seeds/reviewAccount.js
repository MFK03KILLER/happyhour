// Apple App Review demo account with an EXPIRED membership, so the reviewer can
// walk through starting a membership (App Review asked for exactly this,
// Sept 2026). Re-run any time to put it back to "expired" before a review:
//   node src/seeds/reviewAccount.js
// testMode is on so that, once the reviewer starts a membership, claiming works
// at any hour - reviews rarely happen inside the 2-5 PM window.
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const logger = require('../utils/logger');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const siteSettingService = require('../services/siteSettingService');

const REVIEW = {
  email: 'review@happyhour.demo',
  password: 'Review-MCzmv444!',
  fullName: 'App Review',
  phone: '(415) 555-2077',
};
const DAY = 24 * 60 * 60 * 1000;

async function run() {
  await connectDB();
  let termsVersion = 1;
  try { const t = await siteSettingService.getTerms('consumer'); termsVersion = t.version || 1; } catch {}

  const passwordHash = await bcrypt.hash(REVIEW.password, 12);
  const user = await User.findOneAndUpdate(
    { email: REVIEW.email },
    { $set: {
      email: REVIEW.email, passwordHash, fullName: REVIEW.fullName, phone: REVIEW.phone,
      role: 'customer', status: 'active', testMode: true, planTier: 'basic',
      acceptedTerms: { version: termsVersion, acceptedAt: new Date() },
    } },
    { upsert: true, new: true },
  );

  // A Gold month that ended yesterday.
  const end = new Date(Date.now() - DAY);
  const start = new Date(end.getTime() - 30 * DAY);
  await Subscription.findOneAndUpdate(
    { audience: 'customer', customerId: user._id },
    { $set: {
      audience: 'customer', customerId: user._id, tier: 'gold', plan: 'monthly', status: 'expired',
      startedAt: start, currentPeriodStart: start, currentPeriodEnd: end,
      cancelAtPeriodEnd: false, amountUSD: 0, dailyClaimLimit: 1,
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  logger.info(`App Review account ready: ${REVIEW.email} (membership expired ${end.toDateString()})`);
  await disconnectDB();
}

if (require.main === module) {
  run().catch((err) => { logger.error({ err }, 'reviewAccount failed'); process.exit(1); });
}

module.exports = { run };
