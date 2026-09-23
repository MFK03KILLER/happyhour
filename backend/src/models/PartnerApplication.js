const mongoose = require('mongoose');

// A venue asking to join the programme, submitted from the merchant app's public
// "Apply to become a partner" screen. Admins review these and issue staff accounts.
const partnerApplicationSchema = new mongoose.Schema({
  businessName: { type: String, required: true, trim: true, maxlength: 120 },
  contactName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 },
  address: { type: String, trim: true, maxlength: 200 },
  city: { type: String, trim: true, maxlength: 80 },
  category: {
    type: String,
    enum: ['dining', 'cafe', 'bar', 'bakery', 'activities', 'wellness', 'hotels', 'services', 'other'],
    default: 'dining',
  },
  locations: { type: Number, min: 1, max: 500, default: 1 },
  message: { type: String, trim: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ['new', 'contacted', 'approved', 'rejected'],
    default: 'new',
    index: true,
  },
  adminNotes: { type: String, trim: true, maxlength: 2000 },
  reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  sourceIp: String,
}, { timestamps: true });

partnerApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PartnerApplication', partnerApplicationSchema);
