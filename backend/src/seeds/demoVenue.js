// Puts the App Review demo venue's offers back (Pizza My Heart, used by
// pizza.staff / pizza.manager / pizza.owner). Reviewers can edit and delete
// offers with those accounts, and in Oct 2026 both offers were gone, leaving an
// empty app. Re-run before a review:
//   node src/seeds/demoVenue.js
// Same _ids as before, so redemption history shows the offer names again.
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const logger = require('../utils/logger');
const Coupon = require('../models/Coupon');
const Merchant = require('../models/Merchant');

const VENDOR_ID = '6a39bb0f07c9058684e7d26c';
const YEAR = 365 * 24 * 60 * 60 * 1000;

const OFFERS = [
  {
    _id: '6a39bb0f07c9058684e7d2a6',
    title: '30% Off Family Pack',
    subtitle: 'Large pizza, salad and drinks for four',
    description: '30% off the Family Pack, dine-in or takeout.',
    offerType: 'PERCENT_OFF',
    priceUSD: 12,
    tags: ['pizza', 'family'],
  },
  {
    _id: '6a39bb0f07c9058684e7d2a8',
    title: 'Free Drink with Slice',
    subtitle: 'Any fountain drink with a slice',
    description: 'Buy any slice and get a fountain drink free.',
    offerType: 'FREE_ITEM',
    priceUSD: 3,
    tags: ['pizza', 'drink'],
  },
];

async function run() {
  await connectDB();
  const merchantIds = await Merchant.find({ vendorId: VENDOR_ID }).distinct('_id');
  for (const o of OFFERS) {
    await Coupon.updateOne(
      { _id: new mongoose.Types.ObjectId(o._id) },
      { $set: {
        ...o,
        _id: new mongoose.Types.ObjectId(o._id),
        vendorId: new mongoose.Types.ObjectId(VENDOR_ID),
        merchantIds,
        categorySlug: 'pizza',
        offerKind: 'member_perk',
        status: 'active',
        activeWindow: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '14:00', end: '17:00' },
        disabledOnHolidays: true,
        maxUsesPerCustomer: 1,
        requiredPlanTier: 'lite',
        heroImageUrl: '/uimg/photo-1513104890138-7c749659a591?w=1000',
        termsAndConditions: 'Valid at participating locations. Cannot be combined with other offers. Limit one redemption per visit.',
        validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + YEAR),
      } },
      { upsert: true },
    );
  }
  logger.info(`Demo venue offers ready: ${OFFERS.map((o) => o.title).join(', ')} at ${merchantIds.length} locations`);
  await disconnectDB();
}

if (require.main === module) {
  run().catch((err) => { logger.error({ err }, 'demoVenue failed'); process.exit(1); });
}

module.exports = { run };
