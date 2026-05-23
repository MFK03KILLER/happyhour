const mongoose = require('mongoose');

const offPeakSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'daily'], required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { _id: false });

const merchantSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  logoUrl: String,
  coverImageUrl: String,
  description: String,
  category: {
    type: String,
    enum: ['dining', 'cafe', 'bar', 'activities', 'services', 'wellness', 'hotels'],
    required: true,
    index: true,
  },
  subCategory: String,
  cuisineTags: [String],
  address: {
    street: String,
    city: { type: String, index: true },
    state: String,
    zip: String,
    country: { type: String, default: 'US' },
    lat: Number,
    lng: Number,
  },
  hours: [{
    day: { type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    open: String,
    close: String,
  }],
  offPeakHours: { type: [offPeakSlotSchema], default: [] },
  phone: String,
  website: String,
  acceptsNFC: { type: Boolean, default: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  priceLevel: { type: Number, default: 2, min: 1, max: 4 },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

merchantSchema.index({ 'address.lat': 1, 'address.lng': 1 });
merchantSchema.index({ rating: -1 });
merchantSchema.index({ priceLevel: 1 });

module.exports = mongoose.model('Merchant', merchantSchema);
