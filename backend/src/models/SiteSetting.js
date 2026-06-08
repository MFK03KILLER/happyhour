const mongoose = require('mongoose');

// Generic key/value setting store. The value is a free-form object.
// Use key 'terms' for terms-of-service content.
const siteSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
