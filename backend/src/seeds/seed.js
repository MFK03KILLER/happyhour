const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const logger = require('../utils/logger');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Merchant = require('../models/Merchant');
const Coupon = require('../models/Coupon');
const Category = require('../models/Category');

const CATEGORIES = [
  { slug: 'restaurants', name: 'Restaurants', sortOrder: 1, imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
  { slug: 'cafes', name: 'Cafés', sortOrder: 2, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
  { slug: 'bars', name: 'Bars', sortOrder: 3, imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800' },
  { slug: 'entertainment', name: 'Entertainment', sortOrder: 4, imageUrl: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=800' },
  { slug: 'fitness', name: 'Fitness', sortOrder: 5, imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' },
];

const VENDORS = [
  { slug: 'pizza-my-heart', name: 'Pizza My Heart', logoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', description: 'Wood-fired California pizza since 1981.' },
  { slug: 'bay-brew-coffee', name: 'Bay Brew Coffee', logoUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200', description: 'Slow-roasted single-origin coffee, San Francisco.' },
  { slug: 'skyline-bowling', name: 'Skyline Bowling', logoUrl: 'https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=200', description: 'Family-friendly bowling lanes with arcade.' },
  { slug: 'iron-forge-gym', name: 'Iron Forge Gym', logoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200', description: 'Strength training, classes, sauna.' },
  { slug: 'sunset-cinema', name: 'Sunset Cinema', logoUrl: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=200', description: 'Independent cinema with craft concessions.' },
  { slug: 'coastal-tacos', name: 'Coastal Tacos', logoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', description: 'Fresh Baja-style tacos on the coast.' },
];

const MERCHANTS = [
  { vendorSlug: 'pizza-my-heart', slug: 'pizza-my-heart-redwood-city', name: 'Pizza My Heart - Redwood City', category: 'restaurant', address: { street: '831 Middlefield Rd', city: 'Redwood City', state: 'CA', zip: '94063', lat: 37.4848, lng: -122.2281 }, phone: '(650) 555-0123' },
  { vendorSlug: 'pizza-my-heart', slug: 'pizza-my-heart-palo-alto', name: 'Pizza My Heart - Palo Alto', category: 'restaurant', address: { street: '407 University Ave', city: 'Palo Alto', state: 'CA', zip: '94301', lat: 37.4454, lng: -122.1612 }, phone: '(650) 555-0145' },
  { vendorSlug: 'pizza-my-heart', slug: 'pizza-my-heart-san-jose', name: 'Pizza My Heart - San Jose', category: 'restaurant', address: { street: '88 S Almaden Ave', city: 'San Jose', state: 'CA', zip: '95113', lat: 37.3318, lng: -121.8923 }, phone: '(408) 555-0188' },
  { vendorSlug: 'bay-brew-coffee', slug: 'bay-brew-mission', name: 'Bay Brew - Mission', category: 'cafe', address: { street: '2200 Mission St', city: 'San Francisco', state: 'CA', zip: '94110', lat: 37.7615, lng: -122.4191 }, phone: '(415) 555-0102' },
  { vendorSlug: 'bay-brew-coffee', slug: 'bay-brew-soma', name: 'Bay Brew - SoMa', category: 'cafe', address: { street: '525 Howard St', city: 'San Francisco', state: 'CA', zip: '94105', lat: 37.7872, lng: -122.3984 }, phone: '(415) 555-0119' },
  { vendorSlug: 'bay-brew-coffee', slug: 'bay-brew-mountain-view', name: 'Bay Brew - Mountain View', category: 'cafe', address: { street: '241 Castro St', city: 'Mountain View', state: 'CA', zip: '94041', lat: 37.3934, lng: -122.0801 }, phone: '(650) 555-0145' },
  { vendorSlug: 'skyline-bowling', slug: 'skyline-bowling-sf', name: 'Skyline Bowling - SF', category: 'entertainment', address: { street: '200 King St', city: 'San Francisco', state: 'CA', zip: '94107', lat: 37.7765, lng: -122.3892 }, phone: '(415) 555-0220' },
  { vendorSlug: 'skyline-bowling', slug: 'skyline-bowling-sj', name: 'Skyline Bowling - San Jose', category: 'entertainment', address: { street: '1325 Saratoga Ave', city: 'San Jose', state: 'CA', zip: '95129', lat: 37.3115, lng: -121.9999 }, phone: '(408) 555-0233' },
  { vendorSlug: 'iron-forge-gym', slug: 'iron-forge-redwood-city', name: 'Iron Forge - Redwood City', category: 'fitness', address: { street: '1200 El Camino Real', city: 'Redwood City', state: 'CA', zip: '94063', lat: 37.4838, lng: -122.2280 }, phone: '(650) 555-0177' },
  { vendorSlug: 'iron-forge-gym', slug: 'iron-forge-palo-alto', name: 'Iron Forge - Palo Alto', category: 'fitness', address: { street: '855 El Camino Real', city: 'Palo Alto', state: 'CA', zip: '94301', lat: 37.4421, lng: -122.1644 }, phone: '(650) 555-0188' },
  { vendorSlug: 'sunset-cinema', slug: 'sunset-cinema-sf', name: 'Sunset Cinema - SF', category: 'entertainment', address: { street: '1572 Sloat Blvd', city: 'San Francisco', state: 'CA', zip: '94132', lat: 37.7349, lng: -122.4944 }, phone: '(415) 555-0300' },
  { vendorSlug: 'sunset-cinema', slug: 'sunset-cinema-sj', name: 'Sunset Cinema - San Jose', category: 'entertainment', address: { street: '3041 Stevens Creek Blvd', city: 'San Jose', state: 'CA', zip: '95117', lat: 37.3231, lng: -121.9711 }, phone: '(408) 555-0322' },
  { vendorSlug: 'coastal-tacos', slug: 'coastal-tacos-mission', name: 'Coastal Tacos - Mission', category: 'restaurant', address: { street: '3500 16th St', city: 'San Francisco', state: 'CA', zip: '94114', lat: 37.7649, lng: -122.4294 }, phone: '(415) 555-0411' },
  { vendorSlug: 'coastal-tacos-redwood', slug: 'coastal-tacos-redwood', name: 'Coastal Tacos - Redwood City', category: 'restaurant', address: { street: '2090 Broadway', city: 'Redwood City', state: 'CA', zip: '94063', lat: 37.4865, lng: -122.2356 }, phone: '(650) 555-0422' },
  { vendorSlug: 'coastal-tacos', slug: 'coastal-tacos-mv', name: 'Coastal Tacos - Mountain View', category: 'restaurant', address: { street: '600 Showers Dr', city: 'Mountain View', state: 'CA', zip: '94040', lat: 37.4012, lng: -122.1078 }, phone: '(650) 555-0433' },
];

const COUPONS_TEMPLATE = [
  { vendorSlug: 'pizza-my-heart', title: 'Morning Slices', subtitle: 'Two slices + drink', heroImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000', offerType: 'BUNDLE', priceUSD: 6.58, maxUsesPerCustomer: 3, categorySlug: 'restaurants', description: 'Two fresh-baked slices and a soft drink. Valid weekdays before noon.' },
  { vendorSlug: 'pizza-my-heart', title: 'BOGO Large Pizza', subtitle: 'Buy one, get one free', heroImageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1000', offerType: 'BOGO', priceUSD: 9.99, maxUsesPerCustomer: 1, categorySlug: 'restaurants' },
  { vendorSlug: 'pizza-my-heart', title: 'Family Sunday Stack', subtitle: '4 medium pizzas + sides', heroImageUrl: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=1000', offerType: 'FLAT_OFF', discountValue: 15, priceUSD: 12.00, maxUsesPerCustomer: 1, categorySlug: 'restaurants' },
  { vendorSlug: 'bay-brew-coffee', title: 'Cold Brew Flight', subtitle: '3 small cold brews', heroImageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=1000', offerType: 'BUNDLE', priceUSD: 4.50, maxUsesPerCustomer: 5, categorySlug: 'cafes' },
  { vendorSlug: 'bay-brew-coffee', title: 'Free Pour-Over Friday', subtitle: 'Complimentary single-origin', heroImageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000', offerType: 'FREE_ITEM', priceUSD: 0, maxUsesPerCustomer: 3, categorySlug: 'cafes' },
  { vendorSlug: 'bay-brew-coffee', title: 'Latte & Croissant', subtitle: 'Morning combo', heroImageUrl: 'https://images.unsplash.com/photo-1525480122447-64809d765a55?w=1000', offerType: 'BUNDLE', priceUSD: 5.99, maxUsesPerCustomer: 5, categorySlug: 'cafes' },
  { vendorSlug: 'skyline-bowling', title: '2 Games + Shoes', subtitle: 'Strike night special', heroImageUrl: 'https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=1000', offerType: 'FLAT_OFF', discountValue: 10, priceUSD: 8.00, maxUsesPerCustomer: 3, categorySlug: 'entertainment' },
  { vendorSlug: 'skyline-bowling', title: 'Family Pack', subtitle: '4 players, 1 hour', heroImageUrl: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=1000', offerType: 'BUNDLE', priceUSD: 14.99, maxUsesPerCustomer: 1, categorySlug: 'entertainment' },
  { vendorSlug: 'iron-forge-gym', title: 'Day Pass', subtitle: 'Full access for one day', heroImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000', offerType: 'FLAT_OFF', discountValue: 12, priceUSD: 0, maxUsesPerCustomer: 1, categorySlug: 'fitness' },
  { vendorSlug: 'iron-forge-gym', title: '5-Class Strength Pack', subtitle: 'Mix and match classes', heroImageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000', offerType: 'BUNDLE', priceUSD: 14.50, maxUsesPerCustomer: 5, categorySlug: 'fitness' },
  { vendorSlug: 'iron-forge-gym', title: '1-on-1 Coaching', subtitle: '30 min personal session', heroImageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1000', offerType: 'PERCENT_OFF', discountValue: 25, priceUSD: 9.99, maxUsesPerCustomer: 1, categorySlug: 'fitness' },
  { vendorSlug: 'sunset-cinema', title: 'Tuesday Matinee', subtitle: 'Any movie before 5 PM', heroImageUrl: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=1000', offerType: 'PERCENT_OFF', discountValue: 30, priceUSD: 3.50, maxUsesPerCustomer: 3, categorySlug: 'entertainment' },
  { vendorSlug: 'sunset-cinema', title: 'Popcorn Combo', subtitle: 'Large popcorn + drink', heroImageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=1000', offerType: 'BUNDLE', priceUSD: 4.00, maxUsesPerCustomer: 5, categorySlug: 'entertainment' },
  { vendorSlug: 'coastal-tacos', title: 'Taco Tuesday Trio', subtitle: '3 tacos + chips', heroImageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1000', offerType: 'BUNDLE', priceUSD: 6.00, maxUsesPerCustomer: 5, categorySlug: 'restaurants' },
  { vendorSlug: 'coastal-tacos', title: 'Sunday Brunch Stack', subtitle: 'Breakfast burritos + horchata', heroImageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1000', offerType: 'FLAT_OFF', discountValue: 6, priceUSD: 5.50, maxUsesPerCustomer: 1, categorySlug: 'restaurants' },
  { vendorSlug: 'coastal-tacos', title: 'Margarita Hour', subtitle: 'House margaritas', heroImageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1000', offerType: 'PERCENT_OFF', discountValue: 50, priceUSD: 3.00, maxUsesPerCustomer: 3, categorySlug: 'restaurants' },
  { vendorSlug: 'pizza-my-heart', title: 'Veggie Vibes Slice', subtitle: 'Seasonal veggie slice', heroImageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1000', offerType: 'FLAT_OFF', discountValue: 3, priceUSD: 2.50, maxUsesPerCustomer: 5, categorySlug: 'restaurants' },
  { vendorSlug: 'bay-brew-coffee', title: 'Espresso Tasting', subtitle: '4-shot tasting flight', heroImageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=1000', offerType: 'BUNDLE', priceUSD: 7.50, maxUsesPerCustomer: 1, categorySlug: 'cafes' },
  { vendorSlug: 'skyline-bowling', title: 'Arcade Token Pack', subtitle: '40 arcade tokens', heroImageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1000', offerType: 'FLAT_OFF', discountValue: 5, priceUSD: 6.99, maxUsesPerCustomer: 3, categorySlug: 'entertainment' },
  { vendorSlug: 'sunset-cinema', title: 'Indie Festival Pass', subtitle: 'Weekend access', heroImageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000', offerType: 'BUNDLE', priceUSD: 14.99, maxUsesPerCustomer: 1, categorySlug: 'entertainment' },
];

async function upsertAdmin() {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const admin = await User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL.toLowerCase() },
    { email: env.ADMIN_EMAIL.toLowerCase(), passwordHash, fullName: 'Happy Hour Admin', role: 'admin', status: 'active' },
    { new: true, upsert: true }
  );
  return admin;
}

async function upsertCategories() {
  for (const c of CATEGORIES) {
    await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
  }
}

async function upsertVendors() {
  const result = {};
  for (const v of VENDORS) {
    const vendor = await Vendor.findOneAndUpdate(
      { slug: v.slug },
      { ...v, status: 'active', billingAddress: { country: 'US' } },
      { upsert: true, new: true }
    );
    result[v.slug] = vendor;
  }
  return result;
}

async function upsertMerchants(vendorsBySlug) {
  const result = {};
  for (const m of MERCHANTS) {
    const vendor = vendorsBySlug[m.vendorSlug] || vendorsBySlug['coastal-tacos'];
    const merchant = await Merchant.findOneAndUpdate(
      { slug: m.slug },
      {
        vendorId: vendor._id,
        name: m.name,
        slug: m.slug,
        logoUrl: vendor.logoUrl,
        coverImageUrl: m.coverImageUrl || vendor.logoUrl,
        category: m.category,
        address: { ...m.address, country: 'US' },
        phone: m.phone,
        acceptsNFC: true,
        status: 'active',
      },
      { upsert: true, new: true }
    );
    result[m.slug] = merchant;
  }
  return result;
}

async function upsertCoupons(vendorsBySlug, merchantsBySlug) {
  const validFrom = new Date();
  const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  for (const c of COUPONS_TEMPLATE) {
    const vendor = vendorsBySlug[c.vendorSlug];
    if (!vendor) continue;
    const vendorMerchants = Object.values(merchantsBySlug).filter((m) => m.vendorId.toString() === vendor._id.toString());
    await Coupon.findOneAndUpdate(
      { title: c.title, vendorId: vendor._id },
      {
        ...c,
        vendorId: vendor._id,
        merchantIds: vendorMerchants.map((m) => m._id),
        validFrom,
        validUntil,
        status: 'active',
        termsAndConditions: 'Valid at participating locations. Cannot be combined with other offers.',
      },
      { upsert: true, new: true }
    );
  }
}

async function upsertCustomers() {
  const passwordHash = await bcrypt.hash('Customer@123', 12);
  const customers = [
    { email: 'customer1@happyhour.demo', fullName: 'Sarah Johnson', phone: '(415) 555-1001' },
    { email: 'customer2@happyhour.demo', fullName: 'Michael Chen', phone: '(415) 555-1002' },
    { email: 'customer3@happyhour.demo', fullName: 'Aisha Patel', phone: '(650) 555-1003' },
  ];
  for (const c of customers) {
    await User.findOneAndUpdate(
      { email: c.email },
      { ...c, passwordHash, role: 'customer', status: 'active' },
      { upsert: true, new: true }
    );
  }
}

async function upsertMerchantStaff(merchantsBySlug) {
  const passwordHash = await bcrypt.hash('Merchant@123', 12);
  const staff = [
    { email: 'pizza.staff@happyhour.demo', fullName: 'Diego Ramirez', merchantSlug: 'pizza-my-heart-redwood-city' },
    { email: 'cafe.staff@happyhour.demo', fullName: 'Emma Wilson', merchantSlug: 'bay-brew-mission' },
  ];
  for (const s of staff) {
    const merchant = merchantsBySlug[s.merchantSlug];
    if (!merchant) continue;
    await User.findOneAndUpdate(
      { email: s.email },
      {
        email: s.email,
        fullName: s.fullName,
        passwordHash,
        role: 'merchant_staff',
        merchantId: merchant._id,
        vendorId: merchant.vendorId,
        status: 'active',
      },
      { upsert: true, new: true }
    );
  }
}

async function run() {
  await connectDB();
  logger.info('Seeding database...');
  const admin = await upsertAdmin();
  logger.info({ adminEmail: admin.email }, 'Admin upserted');
  await upsertCategories();
  logger.info('Categories upserted');
  const vendorsBySlug = await upsertVendors();
  logger.info({ count: Object.keys(vendorsBySlug).length }, 'Vendors upserted');
  const merchantsBySlug = await upsertMerchants(vendorsBySlug);
  logger.info({ count: Object.keys(merchantsBySlug).length }, 'Merchants upserted');
  await upsertCoupons(vendorsBySlug, merchantsBySlug);
  logger.info({ count: COUPONS_TEMPLATE.length }, 'Coupons upserted');
  await upsertCustomers();
  logger.info('Test customers upserted');
  await upsertMerchantStaff(merchantsBySlug);
  logger.info('Test merchant staff upserted');
  logger.info('');
  logger.info('===== SEED COMPLETE =====');
  logger.info(`Admin login:    ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
  logger.info(`Customer login: customer1@happyhour.demo / Customer@123`);
  logger.info(`Merchant login: pizza.staff@happyhour.demo / Merchant@123`);
  logger.info('=========================');
  logger.info('CHANGE THESE CREDENTIALS BEFORE GOING TO PRODUCTION!');
  await disconnectDB();
}

if (require.main === module) {
  run().catch((err) => {
    logger.error({ err }, 'Seed failed');
    mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = { run };
