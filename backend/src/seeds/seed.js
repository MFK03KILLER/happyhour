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
const Subscription = require('../models/Subscription');
const PurchasedCoupon = require('../models/PurchasedCoupon');
const Redemption = require('../models/Redemption');
const Payment = require('../models/Payment');

const RESET = process.argv.includes('--reset');

const CATEGORIES = [
  { slug: 'nearby', name: 'Nearby', sortOrder: 1, iconUrl: 'fa-location-dot', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800' },
  { slug: 'dining', name: 'Dining', sortOrder: 2, iconUrl: 'fa-utensils', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
  { slug: 'cafe', name: 'Cafés', sortOrder: 3, iconUrl: 'fa-mug-hot', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800' },
  { slug: 'bar', name: 'Bars', sortOrder: 4, iconUrl: 'fa-wine-glass', imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800' },
  { slug: 'activities', name: 'Activities', sortOrder: 5, iconUrl: 'fa-masks-theater', imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800' },
  { slug: 'wellness', name: 'Wellness', sortOrder: 6, iconUrl: 'fa-spa', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800' },
  { slug: 'hotels', name: 'Hotels', sortOrder: 7, iconUrl: 'fa-hotel', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
  { slug: 'services', name: 'Services', sortOrder: 8, iconUrl: 'fa-bag-shopping', imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800' },
];

const VENDORS = [
  { slug: 'pizza-my-heart', name: 'Pizza My Heart', logoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', description: 'Wood-fired California pizza since 1981.' },
  { slug: 'bay-brew-coffee', name: 'Bay Brew Coffee', logoUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=200', description: 'Slow-roasted single-origin coffee, San Francisco.' },
  { slug: 'coastal-tacos', name: 'Coastal Tacos', logoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', description: 'Fresh Baja-style tacos by the bay.' },
  { slug: 'marina-grill', name: 'Marina Grill', logoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200', description: 'Waterfront steakhouse with sunset views.' },
  { slug: 'sunset-cinema', name: 'Sunset Cinema', logoUrl: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=200', description: 'Independent cinema with craft concessions.' },
  { slug: 'skyline-bowling', name: 'Skyline Bowling', logoUrl: 'https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=200', description: 'Family-friendly bowling lanes with arcade.' },
  { slug: 'iron-forge-gym', name: 'Iron Forge Gym', logoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200', description: 'Strength, classes, and recovery spa.' },
  { slug: 'serenity-spa', name: 'Serenity Spa', logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200', description: 'Day spa and massage therapy.' },
  { slug: 'embarcadero-hotel', name: 'Embarcadero Hotel', logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200', description: 'Boutique downtown hotel with rooftop bar.' },
  { slug: 'fog-city-wine', name: 'Fog City Wine Bar', logoUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200', description: 'Curated California wines in North Beach.' },
];

const MERCHANTS = [
  { vendorSlug: 'pizza-my-heart', slug: 'pmh-redwood-city', name: 'Pizza My Heart — Redwood City', category: 'dining', subCategory: 'Pizza', cuisineTags: ['Italian', 'American'], priceLevel: 2, rating: 4.6, ratingCount: 312, address: { street: '831 Middlefield Rd', city: 'Redwood City', state: 'CA', zip: '94063', lat: 37.4848, lng: -122.2281 }, phone: '(650) 555-0123', offPeakHours: [{ day: 'daily', start: '14:00', end: '17:00' }] },
  { vendorSlug: 'pizza-my-heart', slug: 'pmh-palo-alto', name: 'Pizza My Heart — Palo Alto', category: 'dining', subCategory: 'Pizza', cuisineTags: ['Italian', 'American'], priceLevel: 2, rating: 4.5, ratingCount: 489, address: { street: '407 University Ave', city: 'Palo Alto', state: 'CA', zip: '94301', lat: 37.4454, lng: -122.1612 }, phone: '(650) 555-0145', offPeakHours: [{ day: 'daily', start: '14:00', end: '17:00' }] },
  { vendorSlug: 'pizza-my-heart', slug: 'pmh-san-jose', name: 'Pizza My Heart — San Jose', category: 'dining', subCategory: 'Pizza', cuisineTags: ['Italian'], priceLevel: 2, rating: 4.4, ratingCount: 256, address: { street: '88 S Almaden Ave', city: 'San Jose', state: 'CA', zip: '95113', lat: 37.3318, lng: -121.8923 }, phone: '(408) 555-0188', offPeakHours: [{ day: 'daily', start: '14:30', end: '17:30' }] },
  { vendorSlug: 'bay-brew-coffee', slug: 'bay-brew-mission', name: 'Bay Brew — Mission', category: 'cafe', subCategory: 'Coffee', cuisineTags: ['Coffee', 'Bakery'], priceLevel: 1, rating: 4.7, ratingCount: 723, address: { street: '2200 Mission St', city: 'San Francisco', state: 'CA', zip: '94110', lat: 37.7615, lng: -122.4191 }, phone: '(415) 555-0102', offPeakHours: [{ day: 'mon', start: '14:00', end: '17:00' }, { day: 'tue', start: '14:00', end: '17:00' }, { day: 'wed', start: '14:00', end: '17:00' }, { day: 'thu', start: '14:00', end: '17:00' }, { day: 'fri', start: '14:00', end: '17:00' }] },
  { vendorSlug: 'bay-brew-coffee', slug: 'bay-brew-soma', name: 'Bay Brew — SoMa', category: 'cafe', subCategory: 'Coffee', cuisineTags: ['Coffee'], priceLevel: 1, rating: 4.6, ratingCount: 412, address: { street: '525 Howard St', city: 'San Francisco', state: 'CA', zip: '94105', lat: 37.7872, lng: -122.3984 }, phone: '(415) 555-0119', offPeakHours: [{ day: 'daily', start: '14:30', end: '17:30' }] },
  { vendorSlug: 'bay-brew-coffee', slug: 'bay-brew-mountain-view', name: 'Bay Brew — Mountain View', category: 'cafe', subCategory: 'Coffee', cuisineTags: ['Coffee'], priceLevel: 1, rating: 4.5, ratingCount: 287, address: { street: '241 Castro St', city: 'Mountain View', state: 'CA', zip: '94041', lat: 37.3934, lng: -122.0801 }, phone: '(650) 555-0145', offPeakHours: [{ day: 'daily', start: '14:00', end: '17:00' }] },
  { vendorSlug: 'coastal-tacos', slug: 'coastal-tacos-mission', name: 'Coastal Tacos — Mission', category: 'dining', subCategory: 'Mexican', cuisineTags: ['Mexican', 'Tacos'], priceLevel: 2, rating: 4.8, ratingCount: 891, address: { street: '3500 16th St', city: 'San Francisco', state: 'CA', zip: '94114', lat: 37.7649, lng: -122.4294 }, phone: '(415) 555-0411', offPeakHours: [{ day: 'daily', start: '15:00', end: '17:00' }] },
  { vendorSlug: 'coastal-tacos', slug: 'coastal-tacos-redwood', name: 'Coastal Tacos — Redwood City', category: 'dining', subCategory: 'Mexican', cuisineTags: ['Mexican'], priceLevel: 2, rating: 4.6, ratingCount: 345, address: { street: '2090 Broadway', city: 'Redwood City', state: 'CA', zip: '94063', lat: 37.4865, lng: -122.2356 }, phone: '(650) 555-0422', offPeakHours: [{ day: 'daily', start: '14:30', end: '17:30' }] },
  { vendorSlug: 'marina-grill', slug: 'marina-grill-sf', name: 'Marina Grill — Marina District', category: 'dining', subCategory: 'Steakhouse', cuisineTags: ['American', 'Steakhouse'], priceLevel: 3, rating: 4.7, ratingCount: 567, address: { street: '2400 Lombard St', city: 'San Francisco', state: 'CA', zip: '94123', lat: 37.7996, lng: -122.4391 }, phone: '(415) 555-0501', offPeakHours: [{ day: 'mon', start: '14:00', end: '17:30' }, { day: 'tue', start: '14:00', end: '17:30' }, { day: 'wed', start: '14:00', end: '17:30' }, { day: 'thu', start: '14:00', end: '17:30' }] },
  { vendorSlug: 'sunset-cinema', slug: 'sunset-cinema-sf', name: 'Sunset Cinema — SF', category: 'activities', subCategory: 'Cinema', cuisineTags: ['Movies'], priceLevel: 2, rating: 4.5, ratingCount: 234, address: { street: '1572 Sloat Blvd', city: 'San Francisco', state: 'CA', zip: '94132', lat: 37.7349, lng: -122.4944 }, phone: '(415) 555-0300', offPeakHours: [{ day: 'mon', start: '12:00', end: '17:00' }, { day: 'tue', start: '12:00', end: '17:00' }, { day: 'wed', start: '12:00', end: '17:00' }] },
  { vendorSlug: 'sunset-cinema', slug: 'sunset-cinema-sj', name: 'Sunset Cinema — San Jose', category: 'activities', subCategory: 'Cinema', cuisineTags: ['Movies'], priceLevel: 2, rating: 4.4, ratingCount: 156, address: { street: '3041 Stevens Creek Blvd', city: 'San Jose', state: 'CA', zip: '95117', lat: 37.3231, lng: -121.9711 }, phone: '(408) 555-0322', offPeakHours: [{ day: 'daily', start: '12:00', end: '16:00' }] },
  { vendorSlug: 'skyline-bowling', slug: 'skyline-bowling-sf', name: 'Skyline Bowling — SF', category: 'activities', subCategory: 'Bowling', cuisineTags: ['Bowling', 'Arcade'], priceLevel: 2, rating: 4.3, ratingCount: 178, address: { street: '200 King St', city: 'San Francisco', state: 'CA', zip: '94107', lat: 37.7765, lng: -122.3892 }, phone: '(415) 555-0220', offPeakHours: [{ day: 'daily', start: '13:00', end: '18:00' }] },
  { vendorSlug: 'skyline-bowling', slug: 'skyline-bowling-sj', name: 'Skyline Bowling — San Jose', category: 'activities', subCategory: 'Bowling', cuisineTags: ['Bowling'], priceLevel: 2, rating: 4.2, ratingCount: 92, address: { street: '1325 Saratoga Ave', city: 'San Jose', state: 'CA', zip: '95129', lat: 37.3115, lng: -121.9999 }, phone: '(408) 555-0233', offPeakHours: [{ day: 'daily', start: '13:00', end: '18:00' }] },
  { vendorSlug: 'iron-forge-gym', slug: 'iron-forge-soma', name: 'Iron Forge — SoMa', category: 'wellness', subCategory: 'Gym', cuisineTags: ['Fitness'], priceLevel: 3, rating: 4.6, ratingCount: 412, address: { street: '888 Bryant St', city: 'San Francisco', state: 'CA', zip: '94103', lat: 37.7807, lng: -122.4045 }, phone: '(415) 555-0177', offPeakHours: [{ day: 'daily', start: '10:00', end: '15:00' }] },
  { vendorSlug: 'iron-forge-gym', slug: 'iron-forge-palo-alto', name: 'Iron Forge — Palo Alto', category: 'wellness', subCategory: 'Gym', cuisineTags: ['Fitness'], priceLevel: 3, rating: 4.5, ratingCount: 234, address: { street: '855 El Camino Real', city: 'Palo Alto', state: 'CA', zip: '94301', lat: 37.4421, lng: -122.1644 }, phone: '(650) 555-0188', offPeakHours: [{ day: 'daily', start: '10:00', end: '15:00' }] },
  { vendorSlug: 'serenity-spa', slug: 'serenity-spa-sf', name: 'Serenity Spa — SF', category: 'wellness', subCategory: 'Spa', cuisineTags: ['Spa', 'Massage'], priceLevel: 3, rating: 4.8, ratingCount: 389, address: { street: '1820 Polk St', city: 'San Francisco', state: 'CA', zip: '94109', lat: 37.7935, lng: -122.4216 }, phone: '(415) 555-0601', offPeakHours: [{ day: 'mon', start: '11:00', end: '15:00' }, { day: 'tue', start: '11:00', end: '15:00' }, { day: 'wed', start: '11:00', end: '15:00' }, { day: 'thu', start: '11:00', end: '15:00' }] },
  { vendorSlug: 'embarcadero-hotel', slug: 'embarcadero-hotel-sf', name: 'Embarcadero Hotel', category: 'hotels', subCategory: 'Boutique', cuisineTags: ['Hotel'], priceLevel: 4, rating: 4.7, ratingCount: 1245, address: { street: '5 Embarcadero Center', city: 'San Francisco', state: 'CA', zip: '94111', lat: 37.7951, lng: -122.3984 }, phone: '(415) 555-0700', offPeakHours: [] },
  { vendorSlug: 'fog-city-wine', slug: 'fog-city-wine-bar', name: 'Fog City Wine Bar', category: 'bar', subCategory: 'Wine Bar', cuisineTags: ['Wine', 'Tapas'], priceLevel: 3, rating: 4.6, ratingCount: 256, address: { street: '1300 Columbus Ave', city: 'San Francisco', state: 'CA', zip: '94133', lat: 37.8060, lng: -122.4156 }, phone: '(415) 555-0801', offPeakHours: [{ day: 'daily', start: '15:00', end: '18:00' }] },
];

const COUPON_TEMPLATES = [
  { vendorSlug: 'pizza-my-heart', title: 'Buy 1 Pizza, Get 1 Free', subtitle: 'Any large pizza', tags: ['featured', 'bogo'], featured: true, todaysOffer: true, offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1000', activeWindow: { days: ['daily'], start: '14:00', end: '17:00' } },
  { vendorSlug: 'pizza-my-heart', title: 'Free Drink with Slice', subtitle: 'Any single slice', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000', activeWindow: { days: ['daily'], start: '14:00', end: '17:00' } },
  { vendorSlug: 'pizza-my-heart', title: '30% Off Family Pack', subtitle: '4 medium pizzas + sides', tags: ['percent_off'], offerType: 'PERCENT_OFF', discountValue: 30, heroImageUrl: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=1000', activeWindow: { days: ['daily'], start: '14:00', end: '17:00' } },
  { vendorSlug: 'bay-brew-coffee', title: 'Buy 1 Latte, Get 1 Free', subtitle: 'Any signature latte', tags: ['featured', 'bogo'], featured: true, todaysOffer: true, offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1525480122447-64809d765a55?w=1000', activeWindow: { days: ['mon','tue','wed','thu','fri'], start: '14:00', end: '17:00' } },
  { vendorSlug: 'bay-brew-coffee', title: 'Free Pastry with Coffee', subtitle: 'Any pour-over', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1000', activeWindow: { days: ['daily'], start: '14:00', end: '17:00' } },
  { vendorSlug: 'bay-brew-coffee', title: 'Cold Brew Flight $5', subtitle: '3 cold brews to compare', tags: ['flat_off'], offerType: 'FLAT_OFF', discountValue: 4, heroImageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=1000', activeWindow: { days: ['daily'], start: '14:30', end: '17:30' } },
  { vendorSlug: 'coastal-tacos', title: 'Buy 2 Tacos, Get 1 Free', subtitle: 'Any signature taco', tags: ['featured', 'bogo'], featured: true, todaysOffer: true, offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1000', activeWindow: { days: ['daily'], start: '15:00', end: '17:00' } },
  { vendorSlug: 'coastal-tacos', title: '50% Off Margaritas', subtitle: 'House margaritas, 2 max', tags: ['percent_off', 'popup'], popupOffer: true, offerType: 'PERCENT_OFF', discountValue: 50, heroImageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1000', activeWindow: { days: ['daily'], start: '15:00', end: '17:00' } },
  { vendorSlug: 'coastal-tacos', title: 'Free Chips & Guac', subtitle: 'With entree order', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1000', activeWindow: { days: ['daily'], start: '15:00', end: '17:00' } },
  { vendorSlug: 'marina-grill', title: '25% Off Main Course', subtitle: 'Any steak or seafood', tags: ['featured', 'percent_off'], featured: true, todaysOffer: true, offerType: 'PERCENT_OFF', discountValue: 25, heroImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000', activeWindow: { days: ['mon','tue','wed','thu'], start: '14:00', end: '17:30' } },
  { vendorSlug: 'marina-grill', title: 'Complimentary Dessert', subtitle: 'With any 2-course meal', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1000', activeWindow: { days: ['mon','tue','wed','thu'], start: '14:00', end: '17:30' } },
  { vendorSlug: 'marina-grill', title: 'Buy 1 Wine Glass, Get 1 Free', subtitle: 'House selection', tags: ['bogo'], offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000', activeWindow: { days: ['mon','tue','wed','thu'], start: '14:00', end: '17:30' } },
  { vendorSlug: 'sunset-cinema', title: 'Buy 1 Ticket, Get 1 Free', subtitle: 'Matinee shows only', tags: ['featured', 'bogo'], featured: true, todaysOffer: true, offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=1000', activeWindow: { days: ['mon','tue','wed'], start: '12:00', end: '17:00' } },
  { vendorSlug: 'sunset-cinema', title: 'Free Popcorn with Ticket', subtitle: 'Medium popcorn', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=1000', activeWindow: { days: ['daily'], start: '12:00', end: '17:00' } },
  { vendorSlug: 'sunset-cinema', title: '40% Off Combo', subtitle: 'Popcorn + Drink + Candy', tags: ['percent_off'], offerType: 'PERCENT_OFF', discountValue: 40, heroImageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000', activeWindow: { days: ['daily'], start: '12:00', end: '17:00' } },
  { vendorSlug: 'skyline-bowling', title: 'Buy 1 Game, Get 1 Free', subtitle: 'Per person, shoes included', tags: ['featured', 'bogo'], featured: true, todaysOffer: true, offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=1000', activeWindow: { days: ['daily'], start: '13:00', end: '18:00' } },
  { vendorSlug: 'skyline-bowling', title: 'Free 20 Arcade Tokens', subtitle: 'With any game purchase', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1000', activeWindow: { days: ['daily'], start: '13:00', end: '18:00' } },
  { vendorSlug: 'skyline-bowling', title: '30% Off Family Pack', subtitle: '4 players, 1 hour', tags: ['percent_off'], offerType: 'PERCENT_OFF', discountValue: 30, heroImageUrl: 'https://images.unsplash.com/photo-1571388208497-71bedc66e932?w=1000', activeWindow: { days: ['daily'], start: '13:00', end: '18:00' } },
  { vendorSlug: 'iron-forge-gym', title: 'Free Day Pass', subtitle: 'All facilities, one visit', tags: ['featured', 'free_item'], featured: true, todaysOffer: true, offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000', activeWindow: { days: ['daily'], start: '10:00', end: '15:00' } },
  { vendorSlug: 'iron-forge-gym', title: 'Buy 1 Class, Get 1 Free', subtitle: 'Yoga, HIIT, Strength', tags: ['bogo'], offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000', activeWindow: { days: ['daily'], start: '10:00', end: '15:00' } },
  { vendorSlug: 'iron-forge-gym', title: '50% Off Personal Training', subtitle: '30-min intro session', tags: ['percent_off'], offerType: 'PERCENT_OFF', discountValue: 50, heroImageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1000', activeWindow: { days: ['daily'], start: '10:00', end: '15:00' } },
  { vendorSlug: 'serenity-spa', title: '30% Off 60-min Massage', subtitle: 'Swedish or Deep Tissue', tags: ['featured', 'percent_off'], featured: true, todaysOffer: true, offerType: 'PERCENT_OFF', discountValue: 30, heroImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000', activeWindow: { days: ['mon','tue','wed','thu'], start: '11:00', end: '15:00' } },
  { vendorSlug: 'serenity-spa', title: 'Free Aromatherapy Upgrade', subtitle: 'With any massage', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1000', activeWindow: { days: ['daily'], start: '11:00', end: '15:00' } },
  { vendorSlug: 'serenity-spa', title: 'Buy 1 Facial, Get 1 Free', subtitle: 'Bring a friend', tags: ['bogo'], offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1000', activeWindow: { days: ['mon','tue','wed','thu'], start: '11:00', end: '15:00' } },
  { vendorSlug: 'embarcadero-hotel', title: '$30 Food Credit on Stay', subtitle: 'Book any room, get $30 credit', tags: ['featured', 'flat_off', 'hotel_bonus'], featured: true, todaysOffer: true, offerType: 'FLAT_OFF', discountValue: 30, heroImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000' },
  { vendorSlug: 'embarcadero-hotel', title: 'Late Checkout 2pm', subtitle: 'Complimentary with booking', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1000' },
  { vendorSlug: 'embarcadero-hotel', title: '20% Off Spa Treatment', subtitle: 'For hotel guests', tags: ['percent_off'], offerType: 'PERCENT_OFF', discountValue: 20, heroImageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000' },
  { vendorSlug: 'fog-city-wine', title: 'Buy 1 Glass, Get 1 Free', subtitle: 'House selections', tags: ['featured', 'bogo'], featured: true, todaysOffer: true, offerType: 'BOGO', heroImageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000', activeWindow: { days: ['daily'], start: '15:00', end: '18:00' } },
  { vendorSlug: 'fog-city-wine', title: 'Free Cheese Board', subtitle: 'With bottle purchase', tags: ['free_item'], offerType: 'FREE_ITEM', heroImageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=1000', activeWindow: { days: ['daily'], start: '15:00', end: '18:00' } },
  { vendorSlug: 'fog-city-wine', title: '30% Off Wine Flight', subtitle: '4 wines, sommelier-paired', tags: ['percent_off'], offerType: 'PERCENT_OFF', discountValue: 30, heroImageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000', activeWindow: { days: ['daily'], start: '15:00', end: '18:00' } },
];

async function wipeData() {
  logger.warn('--reset specified — wiping vendors/merchants/coupons/categories/subs/redemptions/payments');
  await Promise.all([
    Vendor.deleteMany({}),
    Merchant.deleteMany({}),
    Coupon.deleteMany({}),
    Category.deleteMany({}),
    Subscription.deleteMany({}),
    PurchasedCoupon.deleteMany({}),
    Redemption.deleteMany({}),
    Payment.deleteMany({}),
  ]);
  await User.deleteMany({ role: { $ne: 'admin' } });
}

async function upsertAdmin() {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  return User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL.toLowerCase() },
    { email: env.ADMIN_EMAIL.toLowerCase(), passwordHash, fullName: 'Happy Hour Admin', role: 'admin', status: 'active' },
    { new: true, upsert: true }
  );
}

async function upsertCategories() {
  for (const c of CATEGORIES) await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
}

async function upsertVendors() {
  const result = {};
  for (const v of VENDORS) {
    const vendor = await Vendor.findOneAndUpdate({ slug: v.slug }, { ...v, status: 'active', billingAddress: { country: 'US' } }, { upsert: true, new: true });
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
        vendorId: vendor._id, name: m.name, slug: m.slug,
        logoUrl: vendor.logoUrl, coverImageUrl: m.coverImageUrl || vendor.logoUrl,
        description: m.description, category: m.category, subCategory: m.subCategory,
        cuisineTags: m.cuisineTags || [], priceLevel: m.priceLevel || 2,
        rating: m.rating || 0, ratingCount: m.ratingCount || 0,
        address: { ...m.address, country: 'US' },
        phone: m.phone, acceptsNFC: true, status: 'active',
        offPeakHours: m.offPeakHours || [],
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
  for (const c of COUPON_TEMPLATES) {
    const vendor = vendorsBySlug[c.vendorSlug];
    if (!vendor) continue;
    const vendorMerchants = Object.values(merchantsBySlug).filter((m) => m.vendorId.toString() === vendor._id.toString());
    const categorySlug = vendorMerchants[0] ? vendorMerchants[0].category : 'dining';
    await Coupon.findOneAndUpdate(
      { title: c.title, vendorId: vendor._id },
      {
        vendorId: vendor._id,
        merchantIds: vendorMerchants.map((m) => m._id),
        title: c.title, subtitle: c.subtitle, description: c.description || c.subtitle,
        heroImageUrl: c.heroImageUrl,
        offerKind: 'member_perk',
        offerType: c.offerType, discountValue: c.discountValue,
        maxUsesPerCustomer: 1,
        priceUSD: 0,
        validFrom, validUntil, status: 'active',
        categorySlug,
        tags: c.tags || [],
        featured: !!c.featured, todaysOffer: !!c.todaysOffer, popupOffer: !!c.popupOffer,
        activeWindow: c.activeWindow || undefined,
        termsAndConditions: 'Valid at participating locations. Cannot be combined with other offers. Limit one redemption per visit.',
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
    await User.findOneAndUpdate({ email: c.email }, { ...c, passwordHash, role: 'customer', status: 'active' }, { upsert: true, new: true });
  }
}

async function upsertVendorOwners(vendorsBySlug) {
  const passwordHash = await bcrypt.hash('Vendor@123', 12);
  const vendor = vendorsBySlug['pizza-my-heart'];
  if (!vendor) return;
  await User.findOneAndUpdate(
    { email: 'pizza.owner@happyhour.demo' },
    {
      email: 'pizza.owner@happyhour.demo', passwordHash, fullName: 'Pizza My Heart Owner',
      role: 'vendor', vendorId: vendor._id, status: 'active',
      permissions: ['manage_coupons', 'view_stats', 'manage_team', 'manage_merchants'],
    },
    { upsert: true, new: true }
  );
}

async function upsertMerchantStaff(merchantsBySlug) {
  const passwordHash = await bcrypt.hash('Merchant@123', 12);
  const staff = [
    { email: 'pizza.staff@happyhour.demo', fullName: 'Diego Ramirez', merchantSlug: 'pmh-redwood-city' },
    { email: 'cafe.staff@happyhour.demo', fullName: 'Emma Wilson', merchantSlug: 'bay-brew-mission' },
  ];
  for (const s of staff) {
    const merchant = merchantsBySlug[s.merchantSlug];
    if (!merchant) continue;
    await User.findOneAndUpdate(
      { email: s.email },
      { email: s.email, fullName: s.fullName, passwordHash, role: 'merchant_staff',
        merchantId: merchant._id, vendorId: merchant.vendorId, status: 'active',
        permissions: ['scan_only'] },
      { upsert: true, new: true }
    );
  }
}

async function run() {
  await connectDB();
  logger.info('Seeding database...');
  if (RESET) await wipeData();
  await upsertAdmin();
  await upsertCategories();
  const vendorsBySlug = await upsertVendors();
  const merchantsBySlug = await upsertMerchants(vendorsBySlug);
  await upsertCoupons(vendorsBySlug, merchantsBySlug);
  await upsertCustomers();
  await upsertVendorOwners(vendorsBySlug);
  await upsertMerchantStaff(merchantsBySlug);
  logger.info('===== SEED COMPLETE =====');
  logger.info(`Admin:         ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
  logger.info('Vendor owner:  pizza.owner@happyhour.demo / Vendor@123');
  logger.info('Merchant:      pizza.staff@happyhour.demo / Merchant@123');
  logger.info('Customers:     customer1@happyhour.demo / Customer@123 (also customer2, customer3)');
  logger.info(`Vendors: ${VENDORS.length} · Merchants: ${MERCHANTS.length} · Coupons: ${COUPON_TEMPLATES.length}`);
  logger.info('=========================');
  await disconnectDB();
}

if (require.main === module) {
  run().catch((err) => { logger.error({ err }, 'Seed failed'); mongoose.disconnect(); process.exit(1); });
}

module.exports = { run };
