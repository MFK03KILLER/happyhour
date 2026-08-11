// San Francisco bakeries + steakhouses — additive seed (idempotent upserts by slug/title).
// Adds 'bakery' and 'steakhouse' as browse categories. Each entry becomes its own
// Vendor + Merchant (with lat/lng so it appears on the map) + one member-perk Coupon.
const Vendor = require('../models/Vendor');
const Merchant = require('../models/Merchant');
const Coupon = require('../models/Coupon');
const Category = require('../models/Category');

const BAKERY_IMAGES = [
  'https://images.unsplash.com/photo-1509440159596-0249088772ff',
  'https://images.unsplash.com/photo-1486427944299-d1955d23e34d',
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
  'https://images.unsplash.com/photo-1568254183919-78a4f43a2877',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
  'https://images.unsplash.com/photo-1517433670267-08bbd4be890f',
];
const STEAK_IMAGES = [
  'https://images.unsplash.com/photo-1544025162-d76694265947',
  'https://images.unsplash.com/photo-1546964124-0cce460f38ef',
  'https://images.unsplash.com/photo-1600891964092-4316c288032e',
  'https://images.unsplash.com/photo-1558030006-450675393462',
  'https://images.unsplash.com/photo-1432139509613-5c4255815697',
];

const ENTRIES = [
  { "type": "bakery", "name": "Foggy Morning Bakehouse", "slug": "sf-foggy-morning-bakehouse", "street": "2487 Mission St", "zip": "94110", "lat": 37.7565, "lng": -122.4189, "priceLevel": 2, "rating": 4.7, "ratingCount": 842, "phone": "(415) 555-0101", "couponTitle": "Buy 1 Pastry, Get 1 Free", "couponSubtitle": "Daily 7-10am on all morning pastries", "offerType": "BOGO", "discountValue": 0 },
  { "type": "bakery", "name": "Salt & Sugar Collective", "slug": "sf-salt-and-sugar-collective", "street": "645 Folsom St", "zip": "94107", "lat": 37.7853, "lng": -122.3971, "priceLevel": 2, "rating": 4.5, "ratingCount": 521, "phone": "(415) 555-0102", "couponTitle": "Free Coffee with Any Croissant", "couponSubtitle": "Weekday mornings before 11am", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "bakery", "name": "The Marina Crumb", "slug": "sf-the-marina-crumb", "street": "2156 Chestnut St", "zip": "94123", "lat": 37.8005, "lng": -122.4402, "priceLevel": 2, "rating": 4.6, "ratingCount": 690, "phone": "(415) 555-0103", "couponTitle": "30% Off a Dozen Cookies", "couponSubtitle": "Mix-and-match dozen, all day", "offerType": "PERCENT_OFF", "discountValue": 30 },
  { "type": "bakery", "name": "Beacon Street Boulangerie", "slug": "sf-beacon-street-boulangerie", "street": "512 Columbus Ave", "zip": "94133", "lat": 37.8001, "lng": -122.4093, "priceLevel": 2, "rating": 4.8, "ratingCount": 1120, "phone": "(415) 555-0104", "couponTitle": "Half-Price Loaves After 3pm", "couponSubtitle": "Fresh sourdough and country loaves", "offerType": "PERCENT_OFF", "discountValue": 50 },
  { "type": "bakery", "name": "Hayes Hearth Bakery", "slug": "sf-hayes-hearth-bakery", "street": "398 Hayes St", "zip": "94102", "lat": 37.7765, "lng": -122.4248, "priceLevel": 2, "rating": 4.7, "ratingCount": 734, "phone": "(415) 555-0105", "couponTitle": "$2 Off Any Whole Cake", "couponSubtitle": "Order in-store, no minimum", "offerType": "FLAT_OFF", "discountValue": 2 },
  { "type": "bakery", "name": "Castro Cocoa & Crumb", "slug": "sf-castro-cocoa-and-crumb", "street": "4124 18th St", "zip": "94114", "lat": 37.7609, "lng": -122.435, "priceLevel": 1, "rating": 4.4, "ratingCount": 408, "phone": "(415) 555-0106", "couponTitle": "Buy 1 Brownie, Get 1 Free", "couponSubtitle": "Fudgy classics, 2-5pm daily", "offerType": "BOGO", "discountValue": 0 },
  { "type": "bakery", "name": "Nob Hill Knead", "slug": "sf-nob-hill-knead", "street": "1245 California St", "zip": "94108", "lat": 37.7917, "lng": -122.4135, "priceLevel": 2, "rating": 4.6, "ratingCount": 562, "phone": "(415) 555-0107", "couponTitle": "Free Scone with a Latte", "couponSubtitle": "While supplies last, mornings only", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "bakery", "name": "Lincoln Park Loaf Co.", "slug": "sf-lincoln-park-loaf-co", "street": "5320 Geary Blvd", "zip": "94121", "lat": 37.7806, "lng": -122.476, "priceLevel": 1, "rating": 4.5, "ratingCount": 377, "phone": "(415) 555-0108", "couponTitle": "25% Off Your First Loaf", "couponSubtitle": "New app customers, any bread", "offerType": "PERCENT_OFF", "discountValue": 25 },
  { "type": "bakery", "name": "Sunset Sweet Dough", "slug": "sf-sunset-sweet-dough", "street": "1801 Irving St", "zip": "94122", "lat": 37.7638, "lng": -122.4775, "priceLevel": 1, "rating": 4.3, "ratingCount": 295, "phone": "(415) 555-0109", "couponTitle": "Buy 1 Donut, Get 1 Free", "couponSubtitle": "Glazed and filled, all day Tuesday", "offerType": "BOGO", "discountValue": 0 },
  { "type": "bakery", "name": "Montgomery Morning Co.", "slug": "sf-montgomery-morning-co", "street": "333 Montgomery St", "zip": "94104", "lat": 37.792, "lng": -122.4025, "priceLevel": 2, "rating": 4.6, "ratingCount": 648, "phone": "(415) 555-0110", "couponTitle": "Free Espresso with Any Danish", "couponSubtitle": "Weekday rush, 7-9am", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "bakery", "name": "Haight Street Honeybun", "slug": "sf-haight-street-honeybun", "street": "1542 Haight St", "zip": "94117", "lat": 37.7699, "lng": -122.448, "priceLevel": 1, "rating": 4.4, "ratingCount": 462, "phone": "(415) 555-0111", "couponTitle": "30% Off a Dozen Muffins", "couponSubtitle": "Mix any flavors, afternoon only", "offerType": "PERCENT_OFF", "discountValue": 30 },
  { "type": "bakery", "name": "Pacific Crust & Crumb", "slug": "sf-pacific-crust-and-crumb", "street": "2210 Fillmore St", "zip": "94115", "lat": 37.7905, "lng": -122.4344, "priceLevel": 2, "rating": 4.8, "ratingCount": 913, "phone": "(415) 555-0112", "couponTitle": "$3 Off Any Tart", "couponSubtitle": "Seasonal fruit tarts, in-store", "offerType": "FLAT_OFF", "discountValue": 3 },
  { "type": "bakery", "name": "Dogpatch Dough Works", "slug": "sf-dogpatch-dough-works", "street": "2545 Third St", "zip": "94107", "lat": 37.7558, "lng": -122.3884, "priceLevel": 1, "rating": 4.5, "ratingCount": 331, "phone": "(415) 555-0113", "couponTitle": "Half-Price Croissants After 4pm", "couponSubtitle": "Butter, almond, and chocolate", "offerType": "PERCENT_OFF", "discountValue": 50 },
  { "type": "bakery", "name": "Bernal Hill Baking Co.", "slug": "sf-bernal-hill-baking-co", "street": "331 Cortland Ave", "zip": "94110", "lat": 37.739, "lng": -122.4163, "priceLevel": 1, "rating": 4.6, "ratingCount": 428, "phone": "(415) 555-0114", "couponTitle": "Buy 1 Cinnamon Roll, Get 1 Free", "couponSubtitle": "Warm from the oven, weekends", "offerType": "BOGO", "discountValue": 0 },
  { "type": "bakery", "name": "Lantern Lane Bakery", "slug": "sf-lantern-lane-bakery", "street": "845 Grant Ave", "zip": "94108", "lat": 37.795, "lng": -122.4068, "priceLevel": 1, "rating": 4.4, "ratingCount": 556, "phone": "(415) 555-0115", "couponTitle": "Free Egg Tart with 6 Buns", "couponSubtitle": "Steamed and baked buns, daily", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "bakery", "name": "Russian Hill Rise", "slug": "sf-russian-hill-rise", "street": "1685 Polk St", "zip": "94109", "lat": 37.795, "lng": -122.4214, "priceLevel": 2, "rating": 4.7, "ratingCount": 601, "phone": "(415) 555-0116", "couponTitle": "20% Off Any Layer Cake", "couponSubtitle": "Pre-order a day ahead", "offerType": "PERCENT_OFF", "discountValue": 20 },
  { "type": "bakery", "name": "Cole Valley Croissanterie", "slug": "sf-cole-valley-croissanterie", "street": "945 Cole St", "zip": "94117", "lat": 37.7654, "lng": -122.4503, "priceLevel": 2, "rating": 4.8, "ratingCount": 708, "phone": "(415) 555-0117", "couponTitle": "Free Coffee with a Croissant", "couponSubtitle": "Flaky all-butter, mornings", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "bakery", "name": "Noe Valley Nibble", "slug": "sf-noe-valley-nibble", "street": "3982 24th St", "zip": "94114", "lat": 37.7513, "lng": -122.4337, "priceLevel": 1, "rating": 4.5, "ratingCount": 389, "phone": "(415) 555-0118", "couponTitle": "$2 Off a Half-Dozen Bagels", "couponSubtitle": "Hand-rolled, baked fresh daily", "offerType": "FLAT_OFF", "discountValue": 2 },
  { "type": "bakery", "name": "Potrero Proof & Crumb", "slug": "sf-potrero-proof-and-crumb", "street": "1428 18th St", "zip": "94107", "lat": 37.7627, "lng": -122.3975, "priceLevel": 2, "rating": 4.6, "ratingCount": 472, "phone": "(415) 555-0119", "couponTitle": "Buy 1 Focaccia, Get 1 Free", "couponSubtitle": "Rosemary and sea salt, after 2pm", "offerType": "BOGO", "discountValue": 0 },
  { "type": "bakery", "name": "Golden Gate Griddle Cakes", "slug": "sf-golden-gate-griddle-cakes", "street": "612 Larkin St", "zip": "94109", "lat": 37.7835, "lng": -122.4166, "priceLevel": 1, "rating": 4.2, "ratingCount": 268, "phone": "(415) 555-0120", "couponTitle": "35% Off Any Box of Pastries", "couponSubtitle": "Build-your-own box of six", "offerType": "PERCENT_OFF", "discountValue": 35 },
  { "type": "bakery", "name": "Embarcadero Ember Bakery", "slug": "sf-embarcadero-ember-bakery", "street": "4 Embarcadero Center", "zip": "94111", "lat": 37.7951, "lng": -122.399, "priceLevel": 2, "rating": 4.7, "ratingCount": 815, "phone": "(415) 555-0121", "couponTitle": "Free Mini Loaf with Any Order", "couponSubtitle": "Spend $10, get a mini sourdough", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "bakery", "name": "Wharfside Waffle & Bun", "slug": "sf-wharfside-waffle-and-bun", "street": "2785 Taylor St", "zip": "94133", "lat": 37.8068, "lng": -122.4163, "priceLevel": 2, "rating": 4.3, "ratingCount": 542, "phone": "(415) 555-0122", "couponTitle": "Buy 1 Belgian Waffle, Get 1 Free", "couponSubtitle": "Weekday afternoons, 2-5pm", "offerType": "BOGO", "discountValue": 0 },
  { "type": "bakery", "name": "Glen Park Galette Co.", "slug": "sf-glen-park-galette-co", "street": "675 Chenery St", "zip": "94131", "lat": 37.7338, "lng": -122.4338, "priceLevel": 1, "rating": 4.6, "ratingCount": 312, "phone": "(415) 555-0123", "couponTitle": "$4 Off Any Whole Galette", "couponSubtitle": "Apple, pear, or stone fruit", "offerType": "FLAT_OFF", "discountValue": 4 },
  { "type": "bakery", "name": "Ocean Edge Oven", "slug": "sf-ocean-edge-oven", "street": "3720 Noriega St", "zip": "94122", "lat": 37.7536, "lng": -122.5012, "priceLevel": 1, "rating": 4.5, "ratingCount": 356, "phone": "(415) 555-0124", "couponTitle": "Half-Price Day-Old Bread", "couponSubtitle": "Every evening after 5pm", "offerType": "PERCENT_OFF", "discountValue": 50 },
  { "type": "bakery", "name": "Mission Dolores Dough", "slug": "sf-mission-dolores-dough", "street": "3601 16th St", "zip": "94114", "lat": 37.7644, "lng": -122.4267, "priceLevel": 2, "rating": 4.7, "ratingCount": 679, "phone": "(415) 555-0125", "couponTitle": "Free Concha with Any Coffee", "couponSubtitle": "Pan dulce of the day, mornings", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Mission Iron Chophouse", "slug": "sf-mission-iron-chophouse", "street": "2841 Mission St", "zip": "94110", "lat": 37.7515, "lng": -122.4183, "priceLevel": 3, "rating": 4.6, "ratingCount": 842, "phone": "(415) 555-0201", "couponTitle": "25% Off Any Steak", "couponSubtitle": "Happy hour 2-5pm, dine-in only", "offerType": "PERCENT_OFF", "discountValue": 25 },
  { "type": "steakhouse", "name": "Foundry & Flank", "slug": "sf-foundry-and-flank", "street": "611 Folsom St", "zip": "94107", "lat": 37.7855, "lng": -122.3971, "priceLevel": 4, "rating": 4.7, "ratingCount": 1135, "phone": "(415) 555-0202", "couponTitle": "Buy 1 Entrée, Get 1 Free", "couponSubtitle": "Weekday happy hour 2-5pm", "offerType": "BOGO", "discountValue": 0 },
  { "type": "steakhouse", "name": "Marina Coast Grill", "slug": "sf-marina-coast-grill", "street": "2230 Chestnut St", "zip": "94123", "lat": 37.8005, "lng": -122.4404, "priceLevel": 3, "rating": 4.5, "ratingCount": 673, "phone": "(415) 555-0203", "couponTitle": "Free Glass of Wine with Dinner", "couponSubtitle": "House red or white, 2-5pm", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "North Beach Char House", "slug": "sf-north-beach-char-house", "street": "528 Columbus Ave", "zip": "94133", "lat": 37.7998, "lng": -122.4097, "priceLevel": 3, "rating": 4.6, "ratingCount": 918, "phone": "(415) 555-0204", "couponTitle": "Complimentary Dessert", "couponSubtitle": "With any two-course meal, 2-5pm", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Hayes Valley Prime", "slug": "sf-hayes-valley-prime", "street": "432 Hayes St", "zip": "94102", "lat": 37.7765, "lng": -122.4241, "priceLevel": 4, "rating": 4.8, "ratingCount": 1042, "phone": "(415) 555-0205", "couponTitle": "30% Off Dry-Aged Ribeye", "couponSubtitle": "Happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 30 },
  { "type": "steakhouse", "name": "Castro Cut Steakhouse", "slug": "sf-castro-cut-steakhouse", "street": "475 Castro St", "zip": "94114", "lat": 37.7611, "lng": -122.4348, "priceLevel": 3, "rating": 4.4, "ratingCount": 556, "phone": "(415) 555-0206", "couponTitle": "$10 Off Any Steak", "couponSubtitle": "Happy hour 2-5pm, min. $40 tab", "offerType": "FLAT_OFF", "discountValue": 10 },
  { "type": "steakhouse", "name": "Nob Hill Grill Room", "slug": "sf-nob-hill-grill-room", "street": "1100 California St", "zip": "94108", "lat": 37.7917, "lng": -122.4128, "priceLevel": 4, "rating": 4.7, "ratingCount": 1287, "phone": "(415) 555-0207", "couponTitle": "Free Glass of Wine with Dinner", "couponSubtitle": "Sommelier pour, 2-5pm", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Richmond Embers", "slug": "sf-richmond-embers", "street": "4012 Geary Blvd", "zip": "94118", "lat": 37.7809, "lng": -122.4632, "priceLevel": 2, "rating": 4.3, "ratingCount": 421, "phone": "(415) 555-0208", "couponTitle": "20% Off Surf & Turf", "couponSubtitle": "Happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 20 },
  { "type": "steakhouse", "name": "Sunset Smokehouse & Steaks", "slug": "sf-sunset-smokehouse-and-steaks", "street": "1310 Irving St", "zip": "94122", "lat": 37.7637, "lng": -122.472, "priceLevel": 2, "rating": 4.4, "ratingCount": 498, "phone": "(415) 555-0209", "couponTitle": "Buy 1 Entrée, Get 1 Free", "couponSubtitle": "Weekdays 2-5pm", "offerType": "BOGO", "discountValue": 0 },
  { "type": "steakhouse", "name": "Montgomery Beef Club", "slug": "sf-montgomery-beef-club", "street": "345 Montgomery St", "zip": "94104", "lat": 37.7926, "lng": -122.4026, "priceLevel": 4, "rating": 4.8, "ratingCount": 1456, "phone": "(415) 555-0210", "couponTitle": "25% Off Any Steak", "couponSubtitle": "Executive happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 25 },
  { "type": "steakhouse", "name": "Haight Street Chophouse", "slug": "sf-haight-street-chophouse", "street": "1560 Haight St", "zip": "94117", "lat": 37.77, "lng": -122.4483, "priceLevel": 2, "rating": 4.2, "ratingCount": 367, "phone": "(415) 555-0211", "couponTitle": "Complimentary Dessert", "couponSubtitle": "With any entrée, 2-5pm", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Pacific Heights Prime Cut", "slug": "sf-pacific-heights-prime-cut", "street": "2104 Fillmore St", "zip": "94115", "lat": 37.7895, "lng": -122.4339, "priceLevel": 4, "rating": 4.7, "ratingCount": 989, "phone": "(415) 555-0212", "couponTitle": "30% Off Tomahawk for Two", "couponSubtitle": "Happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 30 },
  { "type": "steakhouse", "name": "Dogpatch Forge Steaks", "slug": "sf-dogpatch-forge-steaks", "street": "2401 Third St", "zip": "94107", "lat": 37.7575, "lng": -122.3884, "priceLevel": 3, "rating": 4.5, "ratingCount": 612, "phone": "(415) 555-0213", "couponTitle": "$15 Off Dinner for Two", "couponSubtitle": "Happy hour 2-5pm", "offerType": "FLAT_OFF", "discountValue": 15 },
  { "type": "steakhouse", "name": "Bernal Heights Butcher Block", "slug": "sf-bernal-heights-butcher-block", "street": "345 Cortland Ave", "zip": "94110", "lat": 37.7388, "lng": -122.4159, "priceLevel": 2, "rating": 4.5, "ratingCount": 534, "phone": "(415) 555-0214", "couponTitle": "Free Glass of Wine with Dinner", "couponSubtitle": "House selection, 2-5pm", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Chinatown Lantern Steakhouse", "slug": "sf-chinatown-lantern-steakhouse", "street": "720 Grant Ave", "zip": "94108", "lat": 37.7949, "lng": -122.4061, "priceLevel": 3, "rating": 4.4, "ratingCount": 708, "phone": "(415) 555-0215", "couponTitle": "20% Off Any Steak", "couponSubtitle": "Happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 20 },
  { "type": "steakhouse", "name": "Russian Hill Reserve", "slug": "sf-russian-hill-reserve", "street": "1601 Hyde St", "zip": "94109", "lat": 37.7977, "lng": -122.4188, "priceLevel": 4, "rating": 4.8, "ratingCount": 1098, "phone": "(415) 555-0216", "couponTitle": "Complimentary Dessert", "couponSubtitle": "With two-course dinner, 2-5pm", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Cole Valley Coal Grill", "slug": "sf-cole-valley-coal-grill", "street": "940 Cole St", "zip": "94117", "lat": 37.766, "lng": -122.4503, "priceLevel": 3, "rating": 4.5, "ratingCount": 445, "phone": "(415) 555-0217", "couponTitle": "Buy 1 Entrée, Get 1 Free", "couponSubtitle": "Weekday happy hour 2-5pm", "offerType": "BOGO", "discountValue": 0 },
  { "type": "steakhouse", "name": "Noe Valley Hearth & Steak", "slug": "sf-noe-valley-hearth-and-steak", "street": "3901 24th St", "zip": "94114", "lat": 37.7514, "lng": -122.4334, "priceLevel": 3, "rating": 4.6, "ratingCount": 587, "phone": "(415) 555-0218", "couponTitle": "25% Off Filet Mignon", "couponSubtitle": "Happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 25 },
  { "type": "steakhouse", "name": "Potrero Hill Ember House", "slug": "sf-potrero-hill-ember-house", "street": "1429 18th St", "zip": "94107", "lat": 37.7625, "lng": -122.3975, "priceLevel": 3, "rating": 4.4, "ratingCount": 498, "phone": "(415) 555-0219", "couponTitle": "$12 Off Any Ribeye", "couponSubtitle": "Happy hour 2-5pm", "offerType": "FLAT_OFF", "discountValue": 12 },
  { "type": "steakhouse", "name": "Tenderloin Tallow & Tongs", "slug": "sf-tenderloin-tallow-and-tongs", "street": "512 Jones St", "zip": "94102", "lat": 37.7855, "lng": -122.4133, "priceLevel": 2, "rating": 4.2, "ratingCount": 389, "phone": "(415) 555-0220", "couponTitle": "Free Glass of Wine with Dinner", "couponSubtitle": "2-5pm, dine-in", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Embarcadero Pier Steakhouse", "slug": "sf-embarcadero-pier-steakhouse", "street": "Pier 3 The Embarcadero", "zip": "94111", "lat": 37.7965, "lng": -122.394, "priceLevel": 4, "rating": 4.7, "ratingCount": 1321, "phone": "(415) 555-0221", "couponTitle": "30% Off Waterfront Surf & Turf", "couponSubtitle": "Happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 30 },
  { "type": "steakhouse", "name": "Fisherman's Anchor Chophouse", "slug": "sf-fishermans-anchor-chophouse", "street": "2845 Taylor St", "zip": "94133", "lat": 37.8074, "lng": -122.4177, "priceLevel": 3, "rating": 4.3, "ratingCount": 876, "phone": "(415) 555-0222", "couponTitle": "Buy 1 Entrée, Get 1 Free", "couponSubtitle": "Weekdays 2-5pm", "offerType": "BOGO", "discountValue": 0 },
  { "type": "steakhouse", "name": "Glen Park Grillworks", "slug": "sf-glen-park-grillworks", "street": "678 Chenery St", "zip": "94131", "lat": 37.7335, "lng": -122.4338, "priceLevel": 2, "rating": 4.4, "ratingCount": 312, "phone": "(415) 555-0223", "couponTitle": "Complimentary Dessert", "couponSubtitle": "With any entrée, 2-5pm", "offerType": "FREE_ITEM", "discountValue": 0 },
  { "type": "steakhouse", "name": "Outer Sunset Driftwood Steaks", "slug": "sf-outer-sunset-driftwood-steaks", "street": "3801 Noriega St", "zip": "94122", "lat": 37.753, "lng": -122.501, "priceLevel": 2, "rating": 4.5, "ratingCount": 421, "phone": "(415) 555-0224", "couponTitle": "20% Off Any Steak", "couponSubtitle": "Sunset happy hour 2-5pm", "offerType": "PERCENT_OFF", "discountValue": 20 },
  { "type": "steakhouse", "name": "Valencia Cellar Steakhouse", "slug": "sf-valencia-cellar-steakhouse", "street": "899 Valencia St", "zip": "94110", "lat": 37.7592, "lng": -122.4215, "priceLevel": 3, "rating": 4.6, "ratingCount": 745, "phone": "(415) 555-0225", "couponTitle": "$15 Off Dinner for Two", "couponSubtitle": "Happy hour 2-5pm", "offerType": "FLAT_OFF", "discountValue": 15 },
];

async function seedSfFood() {
  // 1) Browse categories
  const cats = [
    { slug: 'bakery', name: 'Bakeries', sortOrder: 9, iconUrl: 'fa-bread-slice', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800' },
    { slug: 'steakhouse', name: 'Steakhouses', sortOrder: 10, iconUrl: 'fa-drumstick-bite', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800' },
  ];
  for (const c of cats) await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });

  const validFrom = new Date();
  const validUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  let bi = 0, si = 0, count = 0;

  for (const e of ENTRIES) {
    const isBakery = e.type === 'bakery';
    const base = isBakery ? BAKERY_IMAGES[bi++ % BAKERY_IMAGES.length] : STEAK_IMAGES[si++ % STEAK_IMAGES.length];
    const logo = `${base}?w=200`;
    const hero = `${base}?w=1000`;

    const vendor = await Vendor.findOneAndUpdate(
      { slug: e.slug },
      {
        name: e.name, slug: e.slug, logoUrl: logo,
        description: isBakery ? 'Artisan San Francisco bakery.' : 'Premium San Francisco steakhouse.',
        status: 'active', billingAddress: { city: 'San Francisco', state: 'CA', country: 'US' },
      },
      { upsert: true, new: true },
    );

    const merchant = await Merchant.findOneAndUpdate(
      { slug: e.slug },
      {
        vendorId: vendor._id, name: e.name, slug: e.slug, logoUrl: logo, coverImageUrl: hero,
        description: e.couponSubtitle,
        category: isBakery ? 'cafe' : 'dining',
        subCategory: isBakery ? 'Bakery' : 'Steakhouse',
        cuisineTags: isBakery ? ['Bakery', 'Pastries'] : ['Steakhouse', 'American'],
        priceLevel: e.priceLevel, rating: e.rating, ratingCount: e.ratingCount,
        address: { street: e.street, city: 'San Francisco', state: 'CA', zip: e.zip, country: 'US', lat: e.lat, lng: e.lng },
        phone: e.phone, acceptsNFC: true, status: 'active',
        offPeakHours: isBakery ? [{ day: 'daily', start: '07:00', end: '11:00' }] : [{ day: 'daily', start: '14:00', end: '17:00' }],
      },
      { upsert: true, new: true },
    );

    await Coupon.findOneAndUpdate(
      { title: e.couponTitle, vendorId: vendor._id },
      {
        vendorId: vendor._id, merchantIds: [merchant._id],
        title: e.couponTitle, subtitle: e.couponSubtitle, description: e.couponSubtitle,
        heroImageUrl: hero, offerKind: 'member_perk',
        offerType: e.offerType, discountValue: e.discountValue || undefined,
        maxUsesPerCustomer: 1, priceUSD: 0,
        validFrom, validUntil, status: 'active',
        categorySlug: isBakery ? 'bakery' : 'steakhouse',
        tags: isBakery ? ['bakery'] : ['steakhouse'],
        featured: e.rating >= 4.75, todaysOffer: false,
        activeWindow: isBakery ? { days: ['daily'], start: '07:00', end: '15:00' } : { days: ['daily'], start: '14:00', end: '17:00' },
        termsAndConditions: 'Valid at this location. Cannot be combined with other offers. Limit one redemption per visit.',
      },
      { upsert: true, new: true },
    );
    count++;
  }
  return count;
}

module.exports = { seedSfFood, SF_FOOD_COUNT: ENTRIES.length };
