const mongoose = require('mongoose');

const PERMISSIONS = [
  'manage_coupons', 'view_coupons',
  'manage_merchants', 'view_merchants',
  'manage_team', 'view_team',
  'manage_hours', 'manage_profile',
  'view_stats', 'view_payments',
  'scan_coupons',
];

const roleSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  name: { type: String, required: true },
  description: String,
  scope: { type: String, enum: ['vendor', 'platform'], default: 'vendor', index: true },
  permissions: [{ type: String, enum: PERMISSIONS }],
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

roleSchema.statics.PERMISSIONS = PERMISSIONS;

module.exports = mongoose.model('Role', roleSchema);
module.exports.PERMISSIONS = PERMISSIONS;
