const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  // YYYY-MM-DD format (date-only, no time/timezone)
  date: { type: String, required: true, index: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  name: { type: String, required: true },
  // global: federal/national holidays, apply to everyone unless overridden per coupon
  // merchant: custom holiday added by a merchant/vendor, only affects that merchant
  scope: { type: String, enum: ['global', 'merchant'], default: 'global', index: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', sparse: true, index: true },
  // helpful flag for merchants/vendors to silence a global holiday (e.g. a store that DOES open on Memorial Day)
  // We don't delete globals from the collection — merchants add an excludedGlobalHoliday row with scope='merchant_excluded'
  // For now we keep it simple: a per-coupon `disabledOnHolidays: false` is the way to keep one coupon active.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Compound indexes for fast "is today a holiday for this merchant?" lookups
holidaySchema.index({ scope: 1, date: 1 });
holidaySchema.index({ merchantId: 1, date: 1 });
// Prevent dupes
holidaySchema.index({ scope: 1, date: 1, merchantId: 1 }, { unique: true, partialFilterExpression: { scope: 'global' } });

module.exports = mongoose.model('Holiday', holidaySchema);
