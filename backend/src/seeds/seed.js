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

const RESET = process.argv.includes('--reset');

// ---------------- CATEGORIES (نسخه فارسی) ----------------
const CATEGORIES = [
  { slug: 'restaurants', name: 'رستوران', sortOrder: 1, iconUrl: 'fa-utensils', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
  { slug: 'cafes', name: 'کافه', sortOrder: 2, iconUrl: 'fa-mug-hot', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
  { slug: 'fastfood', name: 'فست‌فود', sortOrder: 3, iconUrl: 'fa-burger', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800' },
  { slug: 'entertainment', name: 'سرگرمی', sortOrder: 4, iconUrl: 'fa-masks-theater', imageUrl: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=800' },
  { slug: 'beauty', name: 'زیبایی', sortOrder: 5, iconUrl: 'fa-spa', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800' },
];

// ---------------- VENDORS ----------------
const VENDORS = [
  { slug: 'reyhoun', name: 'ریحون', logoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', description: 'شبکه رستوران‌های زنجیره‌ای کباب و چلوغذا.' },
  { slug: 'lamiz-coffee', name: 'لمیز کافی', logoUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200', description: 'قهوه دستی و میکرولات‌های ایرانی.' },
  { slug: 'iran-mall-fun', name: 'سرزمین موج‌های آبی', logoUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=200', description: 'پارک آبی و سرگرمی خانوادگی.' },
];

// ---------------- MERCHANTS (شعب) ----------------
const MERCHANTS = [
  { vendorSlug: 'reyhoun', slug: 'reyhoun-tajrish', name: 'ریحون - تجریش', category: 'restaurant', address: { street: 'میدان تجریش، خیابان ولیعصر', city: 'تهران', state: 'تهران', zip: '1936914311', lat: 35.8050, lng: 51.4319 }, phone: '02122713456' },
  { vendorSlug: 'reyhoun', slug: 'reyhoun-vanak', name: 'ریحون - ونک', category: 'restaurant', address: { street: 'خیابان ولیعصر، نرسیده به ونک', city: 'تهران', state: 'تهران', zip: '1969733511', lat: 35.7569, lng: 51.4099 }, phone: '02188778899' },
  { vendorSlug: 'reyhoun', slug: 'reyhoun-saadatabad', name: 'ریحون - سعادت‌آباد', category: 'restaurant', address: { street: 'سعادت‌آباد، میدان کاج', city: 'تهران', state: 'تهران', zip: '1997875411', lat: 35.7800, lng: 51.3700 }, phone: '02122062006' },
  { vendorSlug: 'lamiz-coffee', slug: 'lamiz-tajrish', name: 'لمیز کافی - تجریش', category: 'cafe', address: { street: 'تجریش، خیابان شهرداری', city: 'تهران', state: 'تهران', zip: '1936914312', lat: 35.8055, lng: 51.4330 }, phone: '02122774450' },
  { vendorSlug: 'lamiz-coffee', slug: 'lamiz-jordan', name: 'لمیز کافی - جردن', category: 'cafe', address: { street: 'خیابان جردن (آفریقا)، روبروی فریور', city: 'تهران', state: 'تهران', zip: '1915774444', lat: 35.7700, lng: 51.4200 }, phone: '02188658070' },
  { vendorSlug: 'lamiz-coffee', slug: 'lamiz-darband', name: 'لمیز کافی - دربند', category: 'cafe', address: { street: 'سربند، دربند، نزدیک پل', city: 'تهران', state: 'تهران', zip: '1986900000', lat: 35.8350, lng: 51.4310 }, phone: '02122713400' },
  { vendorSlug: 'iran-mall-fun', slug: 'iran-mall-fun-iranmall', name: 'سرزمین موج‌های آبی - ایران‌مال', category: 'entertainment', address: { street: 'ایران‌مال، اتوبان همت', city: 'تهران', state: 'تهران', zip: '1481948333', lat: 35.7700, lng: 51.2500 }, phone: '02174416000' },
];

// ---------------- COUPONS ----------------
const COUPONS_TEMPLATE = [
  { vendorSlug: 'reyhoun', title: 'چلو کباب کوبیده ویژه', subtitle: 'به همراه نوشیدنی و سالاد', heroImageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=1000', offerType: 'BUNDLE', priceUSD: 0, maxUsesPerCustomer: 3, categorySlug: 'restaurants', description: 'پرس کامل چلو کباب کوبیده با نوشیدنی و سالاد، فقط برای اعضای هپی‌اَور.' },
  { vendorSlug: 'reyhoun', title: 'یکی بخر دوتا ببر — جوجه', subtitle: 'جوجه کباب اضافه رایگان', heroImageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1000', offerType: 'BOGO', priceUSD: 0, maxUsesPerCustomer: 1, categorySlug: 'restaurants' },
  { vendorSlug: 'reyhoun', title: 'منوی ناهار شنبه', subtitle: 'تا ۳۰٪ تخفیف روی همه پرس‌ها', heroImageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1000', offerType: 'PERCENT_OFF', discountValue: 30, priceUSD: 0, maxUsesPerCustomer: 4, categorySlug: 'restaurants' },
  { vendorSlug: 'lamiz-coffee', title: 'فلایت قهوه دم‌آور', subtitle: 'سه قهوه میکرولات', heroImageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=1000', offerType: 'BUNDLE', priceUSD: 0, maxUsesPerCustomer: 5, categorySlug: 'cafes' },
  { vendorSlug: 'lamiz-coffee', title: 'لاته رایگان روزهای جمعه', subtitle: 'هر جمعه یک لاته رایگان', heroImageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000', offerType: 'FREE_ITEM', priceUSD: 0, maxUsesPerCustomer: 4, categorySlug: 'cafes' },
  { vendorSlug: 'lamiz-coffee', title: 'ست صبحانه + لاته', subtitle: 'صبحانه کامل با لاته', heroImageUrl: 'https://images.unsplash.com/photo-1525480122447-64809d765a55?w=1000', offerType: 'BUNDLE', priceUSD: 0, maxUsesPerCustomer: 5, categorySlug: 'cafes' },
  { vendorSlug: 'iran-mall-fun', title: 'بلیط روز - دو نفره', subtitle: 'ورودی کامل پارک آبی برای دو نفر', heroImageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1000', offerType: 'BUNDLE', priceUSD: 0, maxUsesPerCustomer: 2, categorySlug: 'entertainment' },
  { vendorSlug: 'iran-mall-fun', title: 'پکیج خانوادگی', subtitle: '۴ نفر + ساعت غرفه بازی', heroImageUrl: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=1000', offerType: 'FLAT_OFF', discountValue: 200000, priceUSD: 0, maxUsesPerCustomer: 1, categorySlug: 'entertainment' },
  { vendorSlug: 'reyhoun', title: 'دیزی سنتی', subtitle: 'دیزی به همراه دوغ', heroImageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1000', offerType: 'FLAT_OFF', discountValue: 50000, priceUSD: 0, maxUsesPerCustomer: 5, categorySlug: 'restaurants' },
  { vendorSlug: 'lamiz-coffee', title: 'تستینگ اسپرسو', subtitle: 'چهار شات اسپرسوی متفاوت', heroImageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=1000', offerType: 'BUNDLE', priceUSD: 0, maxUsesPerCustomer: 1, categorySlug: 'cafes' },
];

async function upsertAdmin() {
  const adminPhone = '09120000000';
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  return User.findOneAndUpdate(
    { phone: adminPhone },
    {
      phone: adminPhone, passwordHash, fullName: 'مدیر هپی‌اَور',
      role: 'admin', status: 'active', phoneVerifiedAt: new Date(),
    },
    { new: true, upsert: true }
  );
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
      { ...v, status: 'active', billingAddress: { country: 'IR' } },
      { upsert: true, new: true }
    );
    result[v.slug] = vendor;
  }
  return result;
}

async function upsertMerchants(vendorsBySlug) {
  const result = {};
  for (const m of MERCHANTS) {
    const vendor = vendorsBySlug[m.vendorSlug];
    if (!vendor) continue;
    const merchant = await Merchant.findOneAndUpdate(
      { slug: m.slug },
      {
        vendorId: vendor._id,
        name: m.name, slug: m.slug,
        logoUrl: vendor.logoUrl,
        coverImageUrl: m.coverImageUrl || vendor.logoUrl,
        category: m.category,
        address: { ...m.address, country: 'IR' },
        phone: m.phone, acceptsNFC: true, status: 'active',
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
        offerKind: 'member_perk',
        vendorId: vendor._id,
        merchantIds: vendorMerchants.map((m) => m._id),
        validFrom, validUntil, status: 'active',
        termsAndConditions: 'فقط در شعبه‌های منتخب معتبر است. قابل ترکیب با سایر تخفیف‌ها نیست.',
        disabledOnHolidays: true,
        activeWindow: { days: ['daily'], start: '14:00', end: '17:00' },
      },
      { upsert: true, new: true }
    );
  }
}

async function upsertCustomers() {
  const customers = [
    { phone: '09121111111', fullName: 'سارا محمدی' },
    { phone: '09122222222', fullName: 'علی رضایی' },
    { phone: '09123333333', fullName: 'مهسا کریمی' },
  ];
  for (const c of customers) {
    await User.findOneAndUpdate(
      { phone: c.phone },
      { ...c, role: 'customer', status: 'active', phoneVerifiedAt: new Date() },
      { upsert: true, new: true }
    );
  }
}

async function upsertVendorOwner(vendorsBySlug) {
  const roleService = require('../services/roleService');
  const ownerPerms = await roleService.permissionsForRole('vendor_owner');
  const passwordHash = await bcrypt.hash('Vendor@123', 12);
  const vendor = vendorsBySlug['reyhoun'];
  if (!vendor) return;
  await User.findOneAndUpdate(
    { phone: '09121234567' },
    {
      phone: '09121234567', fullName: 'مدیر ریحون', passwordHash,
      role: 'vendor', vendorId: vendor._id, status: 'active',
      phoneVerifiedAt: new Date(),
      roleSlug: 'vendor_owner', permissions: ownerPerms,
    },
    { upsert: true, new: true }
  );
}

async function upsertMerchantStaff(merchantsBySlug) {
  const roleService = require('../services/roleService');
  const cashierPerms = await roleService.permissionsForRole('vendor_cashier');
  const managerPerms = await roleService.permissionsForRole('vendor_manager');
  const passwordHash = await bcrypt.hash('Merchant@123', 12);
  const staff = [
    { phone: '09127777777', fullName: 'حسین احمدی', merchantSlug: 'reyhoun-tajrish', roleSlug: 'vendor_cashier', perms: cashierPerms },
    { phone: '09128888888', fullName: 'فاطمه نوری', merchantSlug: 'lamiz-tajrish', roleSlug: 'vendor_manager', perms: managerPerms },
  ];
  for (const s of staff) {
    const merchant = merchantsBySlug[s.merchantSlug];
    if (!merchant) continue;
    await User.findOneAndUpdate(
      { phone: s.phone },
      {
        phone: s.phone, fullName: s.fullName, passwordHash,
        role: 'merchant_staff',
        merchantId: merchant._id, vendorId: merchant.vendorId,
        status: 'active', phoneVerifiedAt: new Date(),
        roleSlug: s.roleSlug, permissions: s.perms,
      },
      { upsert: true, new: true }
    );
  }
}

async function upsertRolesAndSettings() {
  const roleService = require('../services/roleService');
  await roleService.syncSystemRoles();
  const siteSettingService = require('../services/siteSettingService');
  await siteSettingService.ensureSeed();
}

async function run() {
  await connectDB();
  logger.info('شروع seed دیتابیس...');
  await upsertRolesAndSettings();
  await upsertAdmin();
  await upsertCategories();
  const vendorsBySlug = await upsertVendors();
  const merchantsBySlug = await upsertMerchants(vendorsBySlug);
  await upsertCoupons(vendorsBySlug, merchantsBySlug);
  await upsertCustomers();
  await upsertVendorOwner(vendorsBySlug);
  await upsertMerchantStaff(merchantsBySlug);
  logger.info('===== SEED COMPLETE =====');
  logger.info(`Admin:        09120000000 / ${env.ADMIN_PASSWORD}`);
  logger.info('Vendor owner: 09121234567 / Vendor@123');
  logger.info('Merchant cashier: 09127777777 / Merchant@123');
  logger.info('Merchant manager: 09128888888 / Merchant@123');
  logger.info('Customer:     09121111111 (OTP login — کد در لاگ سرور)');
  logger.info(`Vendors: ${VENDORS.length} · Merchants: ${MERCHANTS.length} · Coupons: ${COUPONS_TEMPLATE.length}`);
  logger.info('=========================');
  await disconnectDB();
}

if (require.main === module) {
  run().catch((err) => { logger.error({ err }, 'Seed failed'); mongoose.disconnect(); process.exit(1); });
}

module.exports = { run };
