const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, lowercase: true, index: true },
  label: { type: String, required: true },
  description: String,
  enabled: { type: Boolean, default: false, index: true },
  group: { type: String, default: 'general' },
  audience: { type: String, enum: ['all', 'admin', 'beta'], default: 'all' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
