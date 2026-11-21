const mongoose = require('mongoose');

// A contract text the admin keeps for sending (imported or pasted).
const contractSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 200000 },
  archived: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
