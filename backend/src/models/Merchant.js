const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  logoUrl: String,
  coverImageUrl: String,
  category: {
    type: String,
    enum: ['restaurant', 'cafe', 'bar', 'retail', 'fitness', 'beauty', 'entertainment'],
    required: true,
    index: true,
  },
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
  phone: String,
  website: String,
  acceptsNFC: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Merchant', merchantSchema);
