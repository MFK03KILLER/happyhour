// Idempotent migration for the two internal test accounts.
// Safe to run against a live DB (no wipes):
//   node src/seeds/testAccounts.js
//
//  1. customer1@happyhour.demo ("sara")  -> testMode ON (no daily limit,
//     no 2-5PM window, no holiday blackout — can test freely, anytime).
//  2. test@happyhour.demo                -> a NORMAL customer (all limits
//     apply) with an active Gold subscription so it can test the real flow.
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const logger = require('../utils/logger');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const siteSettingService = require('../services/siteSettingService');

const SARA_EMAIL = 'customer1@happyhour.demo';
const TEST = { email: 'test@happyhour.demo', password: 'HourTest#2026', fullName: 'Test User', phone: '(415) 555-2099' };

async function ensureActiveGoldSub(userId, amountUSD) {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await Subscription.findOneAndUpdate(
    { audience: 'customer', customerId: userId },
    { $set: {
      audience: 'customer', customerId: userId, tier: 'gold', plan: 'monthly',
      status: 'active', startedAt: now, currentPeriodStart: now, currentPeriodEnd: end,
      cancelAtPeriodEnd: false, amountUSD, dailyClaimLimit: 1,
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function run() {
  await connectDB();
  let termsVersion = 1;
  try { const t = await siteSettingService.getTerms('consumer'); termsVersion = t.version || 1; } catch {}

  // 1. sara → unlimited testMode
  const sara = await User.findOne({ email: SARA_EMAIL });
  if (sara) {
    sara.testMode = true;
    await sara.save();
    logger.info(`sara (${SARA_EMAIL}) -> testMode ON`);
  } else {
    logger.warn(`${SARA_EMAIL} not found — run the main seed first`);
  }

  // 2. normal test account + Gold sub
  const passwordHash = await bcrypt.hash(TEST.password, 12);
  const test = await User.findOneAndUpdate(
    { email: TEST.email },
    { $set: {
      email: TEST.email, passwordHash, fullName: TEST.fullName, phone: TEST.phone,
      role: 'customer', status: 'active', testMode: false, planTier: 'gold',
      acceptedTerms: { version: termsVersion, acceptedAt: new Date() },
    } },
    { upsert: true, new: true },
  );
  await ensureActiveGoldSub(test._id, 12.99);

  logger.info('===== TEST ACCOUNTS READY =====');
  logger.info(`Unlimited (testMode):  ${SARA_EMAIL} / Customer@123`);
  logger.info(`Normal (Gold sub):     ${TEST.email} / ${TEST.password}`);
  logger.info('===============================');
  await disconnectDB();
}

if (require.main === module) {
  run().catch((err) => { logger.error({ err }, 'testAccounts failed'); process.exit(1); });
}

module.exports = { run };
