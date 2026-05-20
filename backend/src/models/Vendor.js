const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  logoUrl: String,
  description: String,
  contactEmail: String,
  contactPhone: String,
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'US' },
  },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
