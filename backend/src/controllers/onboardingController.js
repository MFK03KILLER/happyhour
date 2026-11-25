// One-screen restaurant onboarding for the admin team: find the place, add its
// locations, pick happy hour and offers from presets, and create the
// restaurant, every location, the offers, the logins and (optionally) the
// contract link in one go.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const Vendor = require('../models/Vendor');
const Merchant = require('../models/Merchant');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Contract = require('../models/Contract');
const ContractSignature = require('../models/ContractSignature');
const roleService = require('../services/roleService');
const auditService = require('../services/auditService');
const logger = require('../utils/logger');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

const UA = 'HappyHour/1.0 (+https://happyhourz.org)';
const STATES = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT',
  delaware: 'DE', 'district of columbia': 'DC', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
};
const stateAbbr = (s) => (s && s.length === 2 ? s.toUpperCase() : STATES[String(s || '').toLowerCase()] || s || '');

// Cover photos by category, so a new place never shows an empty box.
const COVERS = {
  dining: '/uimg/photo-1517248135467-4c7edcad34c4?w=1000',
  pizza: '/uimg/photo-1513104890138-7c749659a591?w=1000',
  cafe: '/uimg/photo-1525480122447-64809d765a55?w=1000',
  bar: '/uimg/photo-1514933651103-005eec06c04b?w=1000',
  activities: '/uimg/photo-1511512578047-dfb367046420?w=1000',
  wellness: '/uimg/photo-1544161515-4ab6ce6db874?w=1000',
};

// ---------- place search (address autocomplete, restaurant lookup) ----------
exports.places = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 3) return res.json({ items: [] });
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('lat', '37.6');            // bias to the Bay Area
  url.searchParams.set('lon', '-122.2');
  let data;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
    data = await r.json();
  } catch (err) {
    logger.warn({ err: err.message }, 'place search failed');
    return res.json({ items: [], unavailable: true });
  }
  const items = (data.features || [])
    .filter((f) => f.properties?.countrycode === 'US' && (f.properties.street || f.properties.name))
    .map((f) => {
      const p = f.properties;
      const street = [p.housenumber, p.street].filter(Boolean).join(' ');
      const isBusiness = ['amenity', 'shop', 'tourism', 'leisure'].includes(p.osm_key) && !!p.name;
      return {
        name: isBusiness ? p.name : '',
        kind: isBusiness ? p.osm_value : 'address',
        street: street || (isBusiness ? '' : p.name),
        city: p.city || p.town || p.village || p.district || '',
        state: stateAbbr(p.state),
        zip: p.postcode || '',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    })
    .filter((x) => x.street && x.city)
    .slice(0, 6);
  res.json({ items });
});

// US Census geocoder for a typed address that wasn't picked from suggestions.
async function geocode(loc) {
  const line = `${loc.street}, ${loc.city}, ${loc.state} ${loc.zip || ''}`;
  try {
    const u = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=${encodeURIComponent(line)}`;
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    const m = (await r.json())?.result?.addressMatches?.[0];
    if (m) return { lat: m.coordinates.y, lng: m.coordinates.x, zip: loc.zip || m.addressComponents?.zip };
  } catch { /* fall through */ }
  return null;
}

// ---------- create everything ----------
const id24 = z.string().regex(/^[a-f0-9]{24}$/i);
const locationSchema = z.object({
  name: z.string().trim().max(120).optional(),
  street: z.string().trim().min(3, 'Each location needs a street address'),
  city: z.string().trim().min(2, 'Each location needs a city'),
  state: z.string().trim().min(2).max(30),
  zip: z.string().trim().max(10).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().trim().max(30).optional(),
});
const onboardSchema = z.object({
  existingVendorId: id24.optional(),
  restaurant: z.object({
    name: z.string().trim().min(2, 'Enter the restaurant name').max(120),
    category: z.enum(['dining', 'cafe', 'bar', 'activities', 'services', 'wellness', 'hotels']).default('dining'),
    cuisineTags: z.array(z.string().max(30)).max(8).default([]),
    phone: z.string().trim().max(30).optional(),
    website: z.string().trim().max(200).optional(),
    email: z.string().trim().email().optional().or(z.literal('')),
    description: z.string().trim().max(600).optional(),
    priceLevel: z.number().int().min(1).max(4).default(2),
    coverImageUrl: z.string().trim().max(500).optional(),
  }),
  locations: z.array(locationSchema).min(1, 'Add at least one location').max(50),
  happyHour: z.object({
    days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).min(1),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  offers: z.array(z.object({
    title: z.string().trim().min(3).max(120),
    subtitle: z.string().trim().max(160).optional(),
    offerType: z.enum(['BOGO', 'PERCENT_OFF', 'FREE_ITEM', 'FLAT_OFF', 'BUNDLE']),
    priceUSD: z.number().min(0).max(10000).default(0),
    requiredPlanTier: z.enum(['basic', 'gold', 'premium']).default('basic'),
  })).max(20).default([]),
  owner: z.object({
    fullName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid owner email'),
  }).optional(),
  staffPerLocation: z.boolean().default(false),
  canPauseHappyHour: z.boolean().default(false),
  contract: z.object({ contractId: id24, sendEmail: z.boolean().default(true) }).optional(),
});

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 60) || 'place';
async function uniqueSlug(Model, base) {
  let slug = slugify(base);
  for (let i = 2; await Model.exists({ slug }); i++) slug = `${slugify(base)}-${i}`;
  return slug;
}
const password = () => `HH-${crypto.randomBytes(6).toString('base64url')}`;

exports.onboard = asyncHandler(async (req, res) => {
  const parsed = onboardSchema.safeParse(req.body);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message || 'Check the form');
  const d = parsed.data;
  const created = { vendor: null, merchants: [], coupons: [], users: [], signature: null };
  const logins = [];

  // Plan the logins first so an email clash fails before anything is created.
  const brandSlug = slugify(d.restaurant.name).replace(/-/g, '');
  const wantedEmails = [];
  if (d.owner) wantedEmails.push(d.owner.email);
  if (d.staffPerLocation) {
    d.locations.forEach((l, i) => wantedEmails.push(`${brandSlug}.${slugify(l.city).replace(/-/g, '')}${d.locations.length > 1 ? i + 1 : ''}@happyhourz.org`));
  }
  const clash = await User.findOne({ email: { $in: wantedEmails } }).select('email').lean();
  if (clash) throw new ConflictError(`${clash.email} already has an account`);
  if (d.contract && !(await Contract.exists({ _id: d.contract.contractId }))) throw new NotFoundError('Contract not found');

  try {
    // 1) the restaurant
    let vendor;
    if (d.existingVendorId) {
      vendor = await Vendor.findById(d.existingVendorId);
      if (!vendor) throw new NotFoundError('Restaurant not found');
    } else {
      vendor = await Vendor.create({
        name: d.restaurant.name,
        slug: await uniqueSlug(Vendor, d.restaurant.name),
        description: d.restaurant.description,
        contactEmail: d.restaurant.email || d.owner?.email,
        contactPhone: d.restaurant.phone,
        billingAddress: { street: d.locations[0].street, city: d.locations[0].city, state: stateAbbr(d.locations[0].state), zip: d.locations[0].zip },
      });
      created.vendor = vendor;
    }

    // 2) its locations - shared details once, only the address differs
    const offPeakHours = d.happyHour.days.map((day) => ({ day, start: d.happyHour.start, end: d.happyHour.end }));
    const tags = d.restaurant.cuisineTags.map((t) => t.toLowerCase());
    const cover = d.restaurant.coverImageUrl || (tags.includes('pizza') ? COVERS.pizza : COVERS[d.restaurant.category] || COVERS.dining);
    const multi = d.locations.length > 1 || !!d.existingVendorId;
    for (const l of d.locations) {
      let { lat, lng, zip } = l;
      if (lat == null || lng == null) {
        const g = await geocode(l);
        if (g) ({ lat, lng } = g);
        if (g && !zip) zip = g.zip;
      }
      const name = l.name || (multi ? `${vendor.name} — ${l.city}` : vendor.name);
      const m = await Merchant.create({
        vendorId: vendor._id,
        name,
        slug: await uniqueSlug(Merchant, name),
        description: d.restaurant.description,
        category: d.restaurant.category,
        subCategory: d.restaurant.cuisineTags[0],
        cuisineTags: tags,
        coverImageUrl: cover,
        logoUrl: cover,
        address: { street: l.street, city: l.city, state: stateAbbr(l.state), zip, country: 'US', lat, lng },
        phone: l.phone || d.restaurant.phone,
        website: d.restaurant.website,
        priceLevel: d.restaurant.priceLevel,
        offPeakHours,
        canPauseHappyHour: d.canPauseHappyHour,
      });
      created.merchants.push(m);
    }

    // 3) offers, valid at every new location
    const now = new Date();
    for (const o of d.offers) {
      const c = await Coupon.create({
        vendorId: vendor._id,
        merchantIds: created.merchants.map((m) => m._id),
        title: o.title,
        subtitle: o.subtitle || `Happy hour at ${vendor.name}`,
        description: o.subtitle || o.title,
        offerType: o.offerType,
        offerKind: 'member_perk',
        priceUSD: o.priceUSD,
        requiredPlanTier: o.requiredPlanTier,
        categorySlug: tags.includes('pizza') ? 'pizza' : d.restaurant.category,
        heroImageUrl: cover,
        status: 'active',
        activeWindow: { days: d.happyHour.days, start: d.happyHour.start, end: d.happyHour.end },
        disabledOnHolidays: true,
        maxUsesPerCustomer: 1,
        termsAndConditions: 'Valid during happy hour at participating locations. One coupon per visit. Cannot be combined with other offers.',
        validFrom: now,
        validUntil: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
      });
      created.coupons.push(c);
    }

    // 4) logins
    if (d.owner) {
      const pw = password();
      const perms = await roleService.permissionsForRole('vendor_owner');
      const u = await User.create({
        email: d.owner.email, passwordHash: await bcrypt.hash(pw, 12), fullName: d.owner.fullName,
        role: 'vendor', roleSlug: 'vendor_owner', permissions: perms, vendorId: vendor._id, status: 'active',
      });
      created.users.push(u);
      if (!vendor.ownerUserId) { vendor.ownerUserId = u._id; await vendor.save(); }
      logins.push({ role: 'Owner (manager portal)', email: u.email, password: pw });
    }
    if (d.staffPerLocation) {
      const perms = await roleService.permissionsForRole('vendor_location_manager');
      const staffEmails = wantedEmails.slice(d.owner ? 1 : 0);
      for (const [i, m] of created.merchants.entries()) {
        const pw = password();
        const u = await User.create({
          email: staffEmails[i], passwordHash: await bcrypt.hash(pw, 12), fullName: `${m.name} Staff`,
          role: 'merchant_staff', roleSlug: 'vendor_location_manager', permissions: perms,
          vendorId: vendor._id, merchantId: m._id, status: 'active',
        });
        created.users.push(u);
        logins.push({ role: `Staff · ${m.address.city}`, email: u.email, password: pw });
      }
    }

    // 5) contract link
    let contract = null;
    if (d.contract) {
      const tpl = await Contract.findById(d.contract.contractId);
      const sig = await ContractSignature.create({
        contractId: tpl._id, title: tpl.title, body: tpl.body,
        bodyHash: crypto.createHash('sha256').update(tpl.body, 'utf8').digest('hex'),
        token: crypto.randomBytes(24).toString('base64url'),
        recipientName: d.owner?.fullName ? `${d.owner.fullName} (${vendor.name})` : vendor.name,
        recipientEmail: d.owner?.email || d.restaurant.email || undefined,
        vendorId: vendor._id, createdBy: req.user._id,
      });
      created.signature = sig;
      const link = `https://happyhourz.org/merchant/sign/${sig.token}`;
      let emailed = false;
      if (d.contract.sendEmail && sig.recipientEmail) {
        emailed = await require('../services/mailService').send({
          to: sig.recipientEmail,
          subject: `Please sign: ${sig.title}`,
          text: `Hi,\n\nWelcome to Happy Hour! Please review and sign "${sig.title}":\n\n${link}\n\nHappy Hour`,
        }).catch(() => false);
      }
      contract = { link, title: sig.title, emailed };
    }

    await auditService.log({
      actorUserId: req.user._id, action: 'restaurant.onboard', targetType: 'Vendor', targetId: String(vendor._id),
      after: { locations: created.merchants.length, offers: created.coupons.length, logins: logins.length }, req,
    });
    res.status(201).json({
      vendor: { _id: vendor._id, name: vendor.name },
      locations: created.merchants.map((m) => ({ _id: m._id, name: m.name, address: m.address, mapped: m.address.lat != null })),
      offers: created.coupons.map((c) => ({ _id: c._id, title: c.title })),
      logins,
      contract,
    });
  } catch (err) {
    // Nothing half-made: undo what this request created.
    await Promise.allSettled([
      ...created.users.map((u) => User.deleteOne({ _id: u._id })),
      ...created.coupons.map((c) => Coupon.deleteOne({ _id: c._id })),
      ...created.merchants.map((m) => Merchant.deleteOne({ _id: m._id })),
      created.signature && ContractSignature.deleteOne({ _id: created.signature._id }),
      created.vendor && Vendor.deleteOne({ _id: created.vendor._id }),
    ].filter(Boolean));
    throw err;
  }
});
